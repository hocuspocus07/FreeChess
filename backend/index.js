import express from 'express';
import dotenv from "dotenv";
import { pool, checkDatabaseConnection } from "./config/db.js";
import { server } from './app.js'; // Only import server

dotenv.config();
const port = process.env.PORT || 8000;

checkDatabaseConnection()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      console.log(`Socket.IO available at ws://localhost:${port}/socket.io`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed: ", error);
    process.exit(1);
  });