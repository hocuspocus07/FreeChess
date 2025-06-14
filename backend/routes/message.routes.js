import express,{Router} from 'express';
import { sendMessage,getInbox,getConversation } from '../controllers/Message.controller.js';
const messageRouter=Router();

messageRouter.post("/send",sendMessage);
messageRouter.get("/inbox/:userId",getInbox);
messageRouter.get("/conversation/:userId/:otherUserId",getConversation);

export default messageRouter;