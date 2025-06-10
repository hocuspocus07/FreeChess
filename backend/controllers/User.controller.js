import User from "../models/User.models.js";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

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
    const accessToken = jwt.sign(
      { _id: user.id, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { _id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
console.log(accessToken,refreshToken);
    await User.updateRefreshToken(user.id, refreshToken);

    // Set cookies
    res.cookie('accessToken', accessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax',
    });
    
    res.cookie('refreshToken', refreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.status(200).json({ 
      message: "User logged in successfully!", 
      token: accessToken,
      user: { id: user.id, username: user.username } 
    });
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

export const logoutUser = async (req, res) => {
  try {
    console.log('User ID:', req.user.id);
    const userId = req.user.id;

    await User.updateRefreshToken(userId, null);

    res.clearCookie('accessToken', { httpOnly: true, secure: true });
    res.clearCookie('refreshToken', { httpOnly: true, secure: true });

    res.status(200).json({ message: 'USER LOGGED OUT SUCCESSFULLY' });
  } catch (error) {
    console.error('Logout Error:', error); 
    res.status(500).json({ error: 'Failed to log out', details: error.message });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    console.log('Received refresh token:', refreshToken); // Debug log

    if (!refreshToken) {
      console.log('No refresh token provided');
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Verify the token first
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log('Decoded refresh token:', decoded);

    // Then find the user
    const user = await User.findByRefreshToken(refreshToken);
    if (!user) {
      console.log('No user found with this refresh token');
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { _id: user.id, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    // Set the new access token cookie
    res.cookie('accessToken', newAccessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    return res.status(200).json({ 
      message: 'Access token refreshed', 
      accessToken: newAccessToken 
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Refresh token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to refresh access token', 
      details: error.message 
    });
  }
};

export const searchUsersByUsername = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.searchByUsername(query); 
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
};

//friend functionality controllers

export const sendFriendRequest = async (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.id;
  if (userId === friendId) return res.status(400).json({ message: "Cannot add yourself." });
  await User.sendFriendRequest(userId, friendId);
  res.json({ message: "Friend request sent." });
};

export const acceptFriendRequest = async (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.id;
  await User.acceptFriendRequest(userId, friendId);
  res.json({ message: "Friend request accepted." });
};

export const removeFriend = async (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.id;
  await User.removeFriend(userId, friendId);
  res.json({ message: "Friend removed." });
};

export const getFriends = async (req, res) => {
  const userId = req.user.id;
  const friends = await User.getFriends(userId);
  console.log(friends);
  res.json({ friends });
};

export const getFriendRequests = async (req, res) => {
  const userId = req.user.id;
  const requests = await User.getFriendRequests(userId);
  res.json({ requests });
};

export const getFriendsOfUser = async (req, res) => {
  const userId = req.params.userId;
  const friends = await User.getFriends(userId);
  res.json({ friends });
};

export const getFriendshipStatus = async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.params;
  const status = await User.getFriendStatus(userId, otherUserId);
  if (!status) return res.json({ status: 'none' });
  return res.json({ status });
};

//update avatar
export const updateUserAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    const { avatar } = req.body;
    
    await User.updateAvatar(userId, avatar);
    res.status(200).json({ message: 'Avatar updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update avatar' });
  }
};