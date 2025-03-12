import express,{Router} from 'express'
import { registerUser,loginUser,getUserDetails } from "../controllers/User.controller.js";

const userRouter=Router()

userRouter.post('/register',registerUser);
userRouter.post('/login',loginUser);
userRouter.post('/:userId',getUserDetails);

export default userRouter;