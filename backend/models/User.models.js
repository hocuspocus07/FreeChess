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
}

export default User;