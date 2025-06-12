import { pool } from "../config/db.js";
import bcrypt from "bcrypt";
class User {
  static async create(username, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users(username, email, password) VALUES ($1, $2, $3) RETURNING id",
      [username, email, hashedPassword]
    );
    return result.rows[0].id;
  }

  static async findByEmail(email) {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      "SELECT id, username, email, created_at, avatar AS profilePic FROM users WHERE id = $1",
      [id]
    );
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    return result.rows[0];
  }

  static async isPasswordCorrect(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }
  static async findUsernameById(userId) {
    const result = await pool.query("SELECT username FROM users WHERE id = $1", [
      userId,
    ]);
    return result.rows[0]?.username;
  }
  static async updateRefreshToken(userId, refreshToken) {
    await pool.query("UPDATE users SET refreshToken = $1 WHERE id = $2", [
      refreshToken,
      userId,
    ]);
  }

  static async findByRefreshToken(refreshToken) {
    const result = await pool.query(
      "SELECT * FROM users WHERE refreshToken = $1",
      [refreshToken]
    );
    return result.rows[0];
  }

  static async searchByUsername(query) {
    const result = await pool.query(
      "SELECT id, username, email FROM users WHERE username ILIKE $1",
      [`%${query}%`] // Partial match, ILIKE for case-insensitive
    );
    return result.rows;
  }

  // add friend functionality

  static async sendFriendRequest(userId, friendId) {
    await pool.query(
      `INSERT INTO friends (user_id, friend_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (user_id, friend_id) DO NOTHING`,
      [userId, friendId]
    );
  }

  static async acceptFriendRequest(userId, friendId) {
    await pool.query(
      'UPDATE friends SET status = $1 WHERE user_id = $2 AND friend_id = $3',
      ['accepted', friendId, userId] // friendId sent the request to userId
    );
  }

  static async removeFriend(userId, friendId) {
    await pool.query(
      "DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)",
      [userId, friendId]
    );
  }

  static async getFriends(userId) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.avatar AS profilePic
     FROM friends f
     JOIN users u ON (
       (f.user_id = $1 AND u.id = f.friend_id)
       OR
       (f.friend_id = $1 AND u.id = f.user_id)
     )
     WHERE f.status = 'accepted'`,
      [userId]
    );
    return result.rows;
  }

  static async getFriendRequests(userId) {
    const result = await pool.query(
      `SELECT f.id, u.id as user_id, u.username
     FROM friends f
     JOIN users u ON u.id = f.user_id
     WHERE f.friend_id = $1 AND f.status = 'pending'`,
      [userId]
    );
    return result.rows;
  }

  static async getFriendStatus(userId, otherUserId) {
    const result = await pool.query(
      `SELECT status FROM friends 
     WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, otherUserId]
    );
    return result.rows[0]?.status || null;
  }
  //user avatar
  static async updateAvatar(userId, avatar) {
    await pool.query("UPDATE users SET avatar = $1 WHERE id = $2", [
      avatar,
      userId,
    ]);
  }
}

export default User;