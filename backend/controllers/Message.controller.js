import { error } from "console";
import Message from "../models/Message.models.js";

export const sendMessage=async(req,res)=>{
    try{
        const {from_user,to_user,text}=req.body;
        if(!from_user || !to_user || !text){
            return res.status(400).json({message:"from_user, to_user and text are required"});
        }
        const message=await Message.create({from_user,to_user,text});
        res.status(201).json({message});
    }catch(e){
        res.status(500).json({message:"error sending message",error:e.message});
    }
}

export const getInbox=async(req,res)=>{
    try {
        const {userId}=req.params;
        if(!userId){
            return res.status(400).json({message:"userId is required"});
        }
        const messages=await Message.getInbox(userId);
        res.status(200).json({messages})
    } catch (error) {
        res.status(500).json({message:"error fetching inbox",error:error.message});
    }
}

export const getConversation=async(req,res)=>{
    try {
        const {userId,otherUserId}=req.params;
        if(!userId || !otherUserId){
            return res.status(400).json({message:"userId and otherUserId are required"});
        }
        const messages=await Message.getConversation(userId,otherUserId);
        res.status(200).json({messages});
    } catch (error) {
        res.status(500).json({message:"error fetching conversation",error:error.message});
    }
}