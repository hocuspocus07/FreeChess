import express from 'express'
import dotenv from "dotenv"
import {  pool,checkDatabaseConnection } from "./config/db.js"
import { app } from './app.js';
dotenv.config();
const port=8000;
checkDatabaseConnection()
    .then(() => {
        app.listen(port, () => {
            console.log("server listening on ",port);
        })
    }).catch((error) => {
        console.log("connection failed: ", error);
    })