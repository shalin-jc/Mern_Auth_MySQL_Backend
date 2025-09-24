import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js';
import mySqlPool from '../config/mySqlDb.js';

export const userAuth = async (req, res, next)=>{
    const {token} = req.cookies;
    if(!token){
        res.json({success: false, message: "Not authorized Login agian"})
    }
// check is user exist or not
    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)

        if(tokenDecode.id){
            const [rows] = await mySqlPool.query( 'SELECT * FROM users WHERE id=?',[tokenDecode.id])
            if(rows.length < 1){
                return res.status(401).json({success: false, message: "Not authorized Login again"})
            }
            req.userId = tokenDecode.id
        }else{
            return res.json({success: false, message: "Not authorized Login agian"})

        }
        next()
    } catch (error) {
        return res.json({success: false, message: error.message})

    }
}