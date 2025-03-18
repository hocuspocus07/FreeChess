import express from 'express'
import http from 'http'
import cookieParser from 'cookie-parser'
import { Server } from "socket.io"
import cors from "cors"
import gameRouter from './routes/game.routes.js'
import userRouter from './routes/user.routes.js'
import moveRouter from './routes/move.routes.js'
import analyzeRouter from './routes/analyze.routes.js'
const app=express()
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true, 
  }));
  app.options('*', cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));

const server=http.createServer(app);
const io=new Server(server,{
    cors:{
        origin:'http://localhost:5173',
        methods:['GET','POST'],
    }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));
app.use(cookieParser()); 

app.use('/chess/game',gameRouter);
app.use('/chess/users',userRouter);
app.use('/chess/moves',moveRouter);
app.use('/chess/analyze',analyzeRouter);

export {app}