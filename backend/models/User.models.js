import { pool } from "../config/db.js";
import bcrypt from 'bcrypt'
class User{
    static async create(username,email,password){
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result]=await pool.query(
            'INSERT INTO users(username,email,password) VALUES (?,?,?)',[username,email,hashedPassword]
        );
        return result.insertId;
    }

    static async findByEmail(email){
        const [rows]=await pool.query(
            'SELECT * FROM users WHERE email=?',[email]);
            return rows[0];
    }

    static async findById(id){
        const [rows] = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [id]
          );
            return rows[0];
    }

    static async findByUsername(username) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE username = ?', [username]);
        return rows[0]; 
      }

      static async isPasswordCorrect(inputPassword, hashedPassword) {
        return await bcrypt.compare(inputPassword, hashedPassword);
      }
      static async findUsernameById(userId) {
        const [rows] = await pool.query(
          'SELECT username FROM users WHERE id = ?',
          [userId]
        );
        return rows[0]?.username;
      }
      static async updateRefreshToken(userId, refreshToken) {
        await pool.query(
          'UPDATE users SET refreshToken = ? WHERE id = ?',
          [refreshToken, userId]
        );
      }

      static async searchByUsername(query) {
        const [rows] = await pool.query(
          'SELECT id, username, email FROM users WHERE username LIKE ?',
          [`%${query}%`] // Partial match
        );
        return rows;
      }
}

export default User;