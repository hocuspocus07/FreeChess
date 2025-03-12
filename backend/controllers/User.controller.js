import User from "../models/User.models.js";
import jwt from 'jsonwebtoken'

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ message: "Please enter username, email, and password." });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const userId = await User.create(username, email, password);

    const newUser = await User.findById(userId);
    res.status(201).json({ message: "User registered successfully!", newUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!password || !username) {
      res.status(400).json({ message: "Please enter email and password." });
    }
    const user = await User.findByUsername(username);
    if (!user) {
      res.status(401).json({ message: "User not found" });
    }
    const isPasswordValid = await User.isPasswordCorrect(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { _id: user.id, username: user.username }, // Payload
      process.env.ACCESS_TOKEN_SECRET, // Secret key
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } // Token expiration
    );
    res.status(200).json({ message: "User logged in successfully!", token });
    console.log("LOGIN SUCCESS!");
  } catch (error) {
    res.status(500).json({ message: "ERROR OCCURED: ", error: error.message });
  }
};

export const getUserDetails = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (user) {
      res.status(200).json({ user });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};