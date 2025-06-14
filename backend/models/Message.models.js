import { pool } from "../config/db.js";

class Message {
    static async create({from_user,to_user,text}){
        const result=await pool.query(
            `INSERT INTO messages(from_user,to_user,text) VALUES ($1,$2,$3) RETURNING id,from_user,to_user,text,timestamp`,
            [from_user,to_user,text]
        )
        return result.rows[0];
    }

    static async getInbox(userId) {
    const result = await pool.query(
      `
      SELECT DISTINCT ON (LEAST(from_user, to_user), GREATEST(from_user, to_user))
        id, from_user, to_user, text, timestamp
      FROM messages
      WHERE from_user = $1 OR to_user = $1
      ORDER BY LEAST(from_user, to_user), GREATEST(from_user, to_user), timestamp DESC
      `,
      [userId]
    );
    return result.rows;
  }

  static async getConversation(userId,otherUserId){
    const result=await pool.query(` SELECT id,from_user,to_user,text,timestamp FROM messages WHERE (from_user=$1 AND to_user=$2) OR (from_user=$2 AND to_user=$1) ORDER BY timestamp ASC`,[userId,otherUserId]);
    return result.rows;
  }
}

export default Message;