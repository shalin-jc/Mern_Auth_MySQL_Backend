import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../config/nodemailer.js";
import mySqlPool from "../config/mySqlDb.js";

export const register = async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    const error = {
      status: 422,
      message: "All fields are required",
      extraDetails: "Name, email, and password must be provided",
    };
    return next(error);
  }

  try {
    const [existingUser] = await mySqlPool.query("CALL get_user_by_email(?)", [email]);
 


    console.log(existingUser[0]);
    console.log(existingUser[0].length);
    
    if (existingUser[0].length === 1) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [deletedUser] = await mySqlPool.query(
      "CALL get_deleted_user_by_email(?)",
      [email]
    );
    console.log(deletedUser[0])
    console.log(deletedUser[0].length);
    
    if (deletedUser[0].length === 1) {
      await mySqlPool.query(
        "CALL insert_deleted_user(?,?,?)",
        [name, hashedPassword, email]
      );
      return res
        .status(201)
        .json({ success: true, message: "User registered successfully" });
    }

    const newUser = await mySqlPool.query(
      "CALL insert_new_user(?,?,?)",
      [name, email, hashedPassword]
    );
    if (!newUser) {
      return res
        .status(500)
        .json({ success: true, message: "Registration failed" });
    }

    // Try to send email, but don't fail registration if it errors

    sendEmail(
      email,
      "Welcome Email",
      "Welcome to coders.com Thanks for register"
    )
      .then(() => console.log("Email sent successfully"))
      .catch((err) => console.error("Error sending email:", err));

    return res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Error found in registration:", error);
    const err = {
      status: 500,
      message: "Internal server error",
      extraDetails: error.message,
    };
    return next(err);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }
  try {
    const [rows] = await mySqlPool.query(
      "CALL get_user_by_email(?)",
      [email]
    );
    if (rows[0].length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid credentials" });
    }
    // console.log(rows[0][0])
    const user = rows[0][0];
    // console.log([...user])
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    if(token){
      const insert_token = await mySqlPool.query("INSERT INTO token_master(token,user_id) values(?,?)",[token, user.id])
    }
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const result = {
      user_name: user.name,
      user_email: user.email,
    };
    return res
      .status(200)
      .json({
        success: true,
        message: "User logged in successfully",
        data: result,
        token,
      });
  } catch (error) {
    // return res.json({success: false, message: error.message})
    console.error(error);
    const err = {
      status: 500,
      message: "Internal server error",
      extraDetails: error.message,
    };
    return next(err);
  }
};

export const logout = async (req, res, next) => {
  const userId = req.userId
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    console.log(userId);
    
    const [result] =  await mySqlPool.query("DELETE FROM token_master WHERE user_id = ?",[userId])
    console.log(result);
    
    if(result.affectedRows === 1){
      console.log("token is deleted");
    }else{
      console.log("token is not deleted")
    }

    return res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    // return res.json({success: false, message: error.message})
    console.error("error found in login"+error);
    const err = {
      status: 500,
      message: "Logout failed",
      extraDetails: error.message,
    };
    return next(err);
  }
};

export const isAuthenticated = async (req, res, next) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    console.log("error found in isAuthenticated"+ error);
    
    // return res.json({success: false, message: error.message})
    const err = {
      status: 500,
      message: "Authentication failed",
      extraDetails: error.message,
    };
    return next(err);
  }
};

export const getUserData = async (req, res, next) => {
  try {
    const userId = req.userId;
    const [rows] = await mySqlPool.query(
      "CALL get_user_by_id(?)",
      [userId]
    );
    
// console.log(rows[0][0]);
// console.log(rows[0].length);

    if (rows[0].length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const user = rows[0][0];
    console.log(user);
    
    res.status(200).json({
      success: true,
      userData: {
        name: user.name,
        email: user.email,
        avatar: user.userImg
        // avatar: user.avatar
      },
    });
  } catch (error) {
    // return res.json({success: false, message: error.message})
    console.error("error found in getUserData"+error);
    const err = {
      status: 500,
      message: "Internal server error",
      extraDetails: error.message,
    };
    return next(err);
  }
};

export const sendResetOtp = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(422)
      .json({ success: false, message: "Email is required" });
  }
  try {
    const [rows] = await mySqlPool.query(
      "CALL get_user_by_email(?)",
      [email]
    );
    if (rows[0].length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await mySqlPool.query(
      "CALL pass_reset_otp(?,?,?)",
      [otp, expiry, email]
    );

    sendEmail(
      email,
      "Password Reset OTP",
      `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`
    )
      .then(() => console.log("Email sent successfully"))
      .catch((err) => console.error("Error sending email:", err));
    return res
      .status(200)
      .json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("error found in sendResetOtp"+error);
    const err = {
      status: 500,
      message: "Internal server error",
      extraDetails: error.message,
    };
    return next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(422)
        .json({ success: false, message: "Otp is required" });
    }
    const [rows] = await mySqlPool.query(
      "CALL get_user_by_email(?)",
      [email]
    );
    if (rows[0].length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const user = rows[0][0];
    if (user.resetPassOtp !== otp || Date.now() > user.expResetPassOtp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      userId: user.id,
    });
  } catch (error) {
    console.error("error found in verifyOtp"+error);
    const err = {
      status: 500,
      message: "Internal server error",
      extraDetails: error.message,
    };
    return next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res
        .status(422)
        .json({ success: false, message: "All fields are required" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await mySqlPool.query(
      "CALL reset_pass(?,?)",
      [hashedPassword, userId]
    );
    if (result.affectedRows < 1) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Error found in resetPassword"+error);
    const err = {
      status: 500,
      message: "Internal server error",
      extraDetails: error.message,
    };
    return next(err);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(422).json({ success: false, message: "Login again" });
    }
    const [rows] = await mySqlPool.query(
      "CALL get_user_by_id(?)",
      [userId]
    );
    if (rows[0].length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found or deleted" });
    }
    const [result] = await mySqlPool.query(
      "UPDATE users SET deleted = 1 WHERE id =?",
      [userId]
    );

    console.log(result)
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Account Deleted successfully" });
  } catch (error) {
    console.error(error);
    const err = {
      status: 500,
      message: "Internal server error",
      extraDetails: error.message,
    };
    return next(err);
  }
};




export const destructure = async(req, res)=>{
  try{
    const userId = req.userId;

    const {...updateFields} = req.body;
        console.log("Fields received from frontend:", updateFields);

      const allowedFields = ['name', 'password', 'resetPassOtp', 'deleted']
      console.log("Allowed fields: ", allowedFields)


      const keys = Object.keys(updateFields).filter((key)=>allowedFields.includes(key) && updateFields[key] !== undefined);
      console.log("valid fields to update", keys)

      console.log(keys.length);
      
        if (keys.length === 0) {
      console.log("No valid fields provided to update");
      return res.status(400).json({
        errors: [{ message: "No valid fields provided to update." }],
        result: {},
      });
    }
    

    const values = keys.map((field)=> updateFields[field]);
    console.log("values to update", values);
    
    const setClause = keys.map((field)=>`${field} = ?`).join(", ");
    console.log('set clause for sql query', setClause)

    values.push(userId)
    console.log('final values array for sql query', values);

    const query = `UPDATE users SET ${setClause} WHERE id = ?`
    console.log("final query : ", query)

    const [result] = await mySqlPool.query(query, values)
    console.log("Database result:", result);

    if (result.affectedRows === 0) {
      console.log("No user found with the given ID");
      return res.status(404).json({ message: "User not found." });
    }

    console.log("User updated successfully");
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error in update route:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
  
}

export const uploadImg = async (req, res)=>{
    const {image} = req.body;
    const userId = req.userId
    console.log(image);
    
    try {
       const userId = req.userId;
    const [rows] = await mySqlPool.query(
      "CALL get_user_by_id(?)",
      [userId]
    );
    
// console.log(rows[0][0]);
// console.log(rows[0].length);

    if (rows[0].length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const user = rows[0][0];
    // console.log(user);
    
   
      const [result] = await mySqlPool.query("UPDATE users SET userImg = ? WHERE id = ?",[image, userId])
      // console.log(result);
      
      if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
       res.status(200).json({
      success: true,
      message:"Image succesfulluy uploaded",
      userData: {
        name: user.name,
        email: user.email,
        avatar: user.userImg
        // avatar: user.avatar
      },
    });

    } catch (error) {
       console.error("Error in uploadImg route:", error);
    return res.status(500).json({ message: "Internal server error", error });
    }
}