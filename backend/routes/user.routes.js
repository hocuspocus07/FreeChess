import express,{Router} from 'express'
import { registerUser,loginUser,getUserDetails,logoutUser,searchUsersByUsername,refreshAccessToken } from "../controllers/User.controller.js";
import { verifyJWT } from '../middleware/auth.middleware.js';
const userRouter=Router()

userRouter.post('/register',registerUser);
userRouter.post('/login',loginUser);
userRouter.get('/search', searchUsersByUsername);
userRouter.get('/:userId',getUserDetails);
userRouter.post('/logout',verifyJWT,logoutUser);
userRouter.post('/refresh-token', refreshAccessToken); 
export default userRouter;