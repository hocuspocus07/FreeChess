import { pool } from "../config/db.js";

class User{
    static async create(username,email,password){
        const [result]=await pool.query(
            'INSERT INTO users(username,email,password) VALUES (?,?,?)',[username,email,password]
        );
        return result.insertId;
    }

    static async findByEmail(email){
        const [rows]=await pool.query(
            'SELECT * FROM users WEHERE email=?',[email]);
            return rows[0];
    }

    static async findById(id){
        const [rows]=await pool.query(
            'SELECT * FROM users WEHERE id=?',[id]);
            return rows[0];
    }

    static async findByUsername(username) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE username = ?', [username]);
        return rows[0]; 
      }
}

export default User;