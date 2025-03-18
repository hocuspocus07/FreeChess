import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import User from '../models/User.models.js';

dotenv.config()
export const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ', '');
        console.log('Token:', token); 
        if (!token) {
            return res.status(401).json({ message: 'UNAUTHORIZED REQUEST' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log('Decoded Token:', decodedToken);

        const user = await User.findById(decodedToken._id);
        if (!user) {
            return res.status(401).json({ message: 'INVALID ACCESS TOKEN' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'TOKEN EXPIRED' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'INVALID TOKEN' });
        } else {
            return res.status(500).json({ message: 'UNEXPECTED ERROR OCCURRED', error: error.message });
        }
    }
};