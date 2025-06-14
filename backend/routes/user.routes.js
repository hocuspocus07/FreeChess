import express,{Router} from 'express'
import { registerUser,loginUser,getUserDetails,logoutUser,searchUsersByUsername,refreshAccessToken,sendFriendRequest,acceptFriendRequest,removeFriend,getFriendRequests,getFriends,getFriendsOfUser,getFriendshipStatus,updateUserAvatar } from "../controllers/User.controller.js";
import { verifyJWT } from '../middleware/auth.middleware.js';
const userRouter=Router()

userRouter.post('/register',registerUser);
userRouter.post('/login',loginUser);
userRouter.get('/search', searchUsersByUsername);
userRouter.post('/logout',verifyJWT,logoutUser);
userRouter.post('/refresh-token', refreshAccessToken); 

//friend functionality routes
userRouter.post('/friends/request', verifyJWT, sendFriendRequest);
userRouter.post('/friends/accept', verifyJWT, acceptFriendRequest);
userRouter.post('/friends/remove', verifyJWT, removeFriend);
userRouter.get('/friends', verifyJWT, getFriends);
userRouter.get('/friends/requests', verifyJWT, getFriendRequests);
userRouter.get('/friendship-status/:otherUserId', verifyJWT,getFriendshipStatus);
userRouter.get('/:userId/friends', getFriendsOfUser);
userRouter.get('/:userId',getUserDetails);
userRouter.patch('/:userId', verifyJWT, updateUserAvatar);
export default userRouter;