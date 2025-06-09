import { pool } from "../config/db.js";
import bcrypt from "bcrypt";
class User {
  static async create(username, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users(username,email,password) VALUES (?,?,?)",
      [username, email, hashedPassword]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email=?", [
      email,
    ]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  static async findByUsername(username) {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    return rows[0];
  }

  static async isPasswordCorrect(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }
  static async findUsernameById(userId) {
    const [rows] = await pool.query("SELECT username FROM users WHERE id = ?", [
      userId,
    ]);
    return rows[0]?.username;
  }
  static async updateRefreshToken(userId, refreshToken) {
    await pool.query("UPDATE users SET refreshToken = ? WHERE id = ?", [
      refreshToken,
      userId,
    ]);
  }

  static async findByRefreshToken(refreshToken) {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE refreshToken = ?",
      [refreshToken]
    );
    return rows[0];
  }

  static async searchByUsername(query) {
    const [rows] = await pool.query(
      "SELECT id, username, email FROM users WHERE username LIKE ?",
      [`%${query}%`] // Partial match
    );
    return rows;
  }

  // add friend functionality

  static async sendFriendRequest(userId, friendId) {
    await pool.query(
      'INSERT IGNORE INTO friends (user_id, friend_id, status) VALUES (?, ?, "pending")',
      [userId, friendId]
    );
  }

  static async acceptFriendRequest(userId, friendId) {
    await pool.query(
      'UPDATE friends SET status="accepted" WHERE user_id=? AND friend_id=?',
      [friendId, userId] // friendId sent the request to userId
    );
  }

  static async removeFriend(userId, friendId) {
    await pool.query(
      "DELETE FROM friends WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)",
      [userId, friendId, friendId, userId]
    );
  }

  static async getFriends(userId) {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.email
     FROM friends f
     JOIN users u ON (
       (f.user_id = ? AND u.id = f.friend_id)
       OR
       (f.friend_id = ? AND u.id = f.user_id)
     )
     WHERE f.status = 'accepted'`,
      [userId, userId]
    );
    return rows;
  }

  static async getFriendRequests(userId) {
    const [rows] = await pool.query(
      `SELECT f.id, u.id as user_id, u.username
     FROM friends f
     JOIN users u ON u.id = f.user_id
     WHERE f.friend_id = ? AND f.status = 'pending'`,
      [userId]
    );
    return rows;
  }

  static async getFriendStatus(userId, otherUserId) {
    const [rows] = await pool.query(
      `SELECT status FROM friends 
     WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
      [userId, otherUserId, otherUserId, userId]
    );
    return rows[0]?.status || null;
  }
}

export default User;
