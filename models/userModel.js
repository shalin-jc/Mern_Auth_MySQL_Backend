import { register } from "module";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{type: String, required: true} ,
    email:{type: String, required: true, unique: true} ,
    password: {type: String, required: true},
    // avatar: {type: String, required: true} ,
    resetOtp: {type: String, default: ""} ,
    resetOtpExpiry: {type: Number, default: 0} ,
    registeredAt: {type: Date, default: Date.now},
})
// ok i have to add date 

const userModel =mongoose.models.user || mongoose.model("Users", userSchema);

export default userModel;




























// verifyOtp: {type: String, default: ""} ,
    // verifyOtpExpireAt: {type: Number, default: 0} ,
    // isAccountVerified: {type: Boolean, default: false} ,
    // resetPasswordOtp: {type: String, default: ""} ,
    // resetPasswordOtpExpireAt: {type: Number, default: 0} ,