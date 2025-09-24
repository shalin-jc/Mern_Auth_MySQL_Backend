import express from 'express'
import { deleteAccount, destructure, getUserData, isAuthenticated, login, logout, register, resetPassword, sendResetOtp, uploadImg, verifyOtp } from '../controllers/authController.js'
import { userAuth } from '../middleware/userAuth.js'
import { upload } from '../middleware/multer-middleware.js'

const authRouter = express.Router()

// authRouter.post('/register',upload.single("avatar"), register)


authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/logout',userAuth, logout)
authRouter.get('/is-auth', userAuth, isAuthenticated)
authRouter.get('/getuser', userAuth, getUserData)
authRouter.post('/sendOtp', sendResetOtp)
authRouter.post('/verifyOtp', verifyOtp)
authRouter.put('/resetPassword', resetPassword)
authRouter.delete('/delete',userAuth, deleteAccount)
authRouter.put('/destructure',userAuth, destructure)
authRouter.post('/uploadImg',userAuth, uploadImg)


export default authRouter;