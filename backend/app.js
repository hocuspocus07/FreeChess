import express from 'express'
import http from 'http'
import { Server } from "socket.io"
import cors from "cors"
import { Chess } from "chess.js"
import gameRouter from './routes/game.routes.js'
import userRouter from './routes/user.routes.js'
import moveRouter from './routes/move.routes.js'
import analyzeRouter from './routes/analyze.routes.js'
const app=express()
app.use(cors());
app.options('*', cors());

const server=http.createServer(app);
const io=new Server(server,{
    cors:{
        origin:'*',
        methods:['GET','POST'],
    }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));

app.use('/chess/game',gameRouter);
app.use('/chess/users',userRouter);
app.use('/chess/game',moveRouter);
app.use('/chess/game',analyzeRouter);
const chess=new Chess();

export {app}