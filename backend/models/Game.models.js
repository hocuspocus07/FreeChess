import { pool } from "../config/db.js";

class Game{
    static async create(player1_id,player2_id,winner_id,status){
        const [result]=await pool.query(
            'INSERT INTO games(player1_id,player2_id,winner_id,status) VALUES (?,?,?,?)',
            [player1_id,player2_id,winner_id,status]
        );
        return result.insertId;
    }

    static async updateMoves(id, moves) {
      console.log(`Updating moves for game ${id}:`, moves);
      await pool.query(
          "DELETE FROM moves WHERE game_id = ?", [id]
      );
      for (const move of moves) {
          await pool.query(
              "INSERT INTO moves (game_id, player_id, move_number, move) VALUES (?, ?, ?, ?)",
              [id, move.player_id, move.move_number, move.move]
          );
      }
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

      static async findByUserId(userId) {
              try {
                  const [rows] = await pool.query(
                      'SELECT * FROM games WHERE player1_id = ? OR player2_id = ?',
                      [userId, userId]
                  );
                  return rows;
              } catch (error) {
                  console.error('Error in findByUserId:', error);
                  throw error;
              }
          }

          static async updateRefreshToken(userId, refreshToken) {
            await pool.query(
              'UPDATE users SET refreshToken = ? WHERE id = ?',
              [refreshToken, userId]
            );
          }
        
          static async findByRefreshToken(refreshToken) {
            const [rows] = await pool.query(
              'SELECT * FROM users WHERE refreshToken = ?',
              [refreshToken]
            );
            return rows[0];
          }
}

export default Game;