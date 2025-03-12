import { pool } from "../config/db.js";

class Game{
    static async create(player1_id,player2_id){
        const [result]=await pool.query(
            'INSERT INTO games(player1_id,player2_id) VALUES (?,?)',
            [player1_id,player2_id]
        );
        return result.insertId;
    }

    static async updateMoves(id,moves){
        await pool.query(
            'UPDATE games SET moves =? WHERE id=?',[moves,id]
        );
    }
    
    static async findById(id){
        const [rows]=await pool.query(
            'SELECT * FROM games WHERE id = ?',[id]);
            return rows[0];
    }

    static async updateStatus(id, status) {
        await pool.query('UPDATE games SET status = ? WHERE id = ?', [status, id]);
      }
    
      static async setWinner(id, winner_id) {
        await pool.query('UPDATE games SET winner_id = ? WHERE id = ?', [winner_id, id]);
      }
    
      static async endGame(id) {
        await pool.query('UPDATE games SET end_time = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      }
}

export default Game;