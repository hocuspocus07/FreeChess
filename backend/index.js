import express from "express"
import http from 'http'
import { Server } from "socket.io"
import cors from "cors"
import { Chess } from "chess.js"
import dotenv from "dotenv"
import {  pool,checkDatabaseConnection } from "./config/db.js"

dotenv.config();

const app=express()
app.use(cors);

const server=http.createServer(app);
const io=new Server(server,{
    cors:{
        origin:'http://localhost:5173',
        methods:['GET','POST'],
    }
});

const chess=new Chess();


checkDatabaseConnection()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log("server listening on ", process.env.PORT);
        })
    }).catch((error) => {
        console.log("connection failed: ", error);
    })