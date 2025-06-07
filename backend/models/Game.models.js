import { pool } from "../config/db.js";
import { Chess } from "chess.js";
class Game{
    static async create(player1_id,player2_id,winner_id,status,time_control){
        const [result]=await pool.query(
            'INSERT INTO games(player1_id,player2_id,winner_id,status,time_control) VALUES (?,?,?,?,?)',
            [player1_id,player2_id,winner_id,status,time_control]
        );
        return result.insertId;
    }
static async getTimeControl(gameId) {
    const [rows] = await pool.query(
        'SELECT time_control FROM games WHERE id = ?', 
        [gameId]
    );
    return rows[0]?.time_control || 600;
}

    static async update(gameId, updateFields) {
      const query = 'UPDATE games SET ? WHERE id = ?';
      const [result] = await pool.query(query, [updateFields, gameId]);
      return result;
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

          static async findWaitingGames() {
            const [rows] = await pool.query(
              'SELECT * FROM games WHERE status = "waiting" AND player2_id IS NULL'
            );
            return rows;
          }

          static async cleanupAbandonedGames() {
            // Clean up games older than 1 hour with no moves
            const [result] = await pool.query(
              `DELETE FROM games 
               WHERE status = 'waiting' 
               AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`
            );
            return result;
          }

          static async saveMove(gameId, playerId, moveNumber, move,remainingTime = 600) {
            await pool.query(
                "INSERT INTO moves (game_id, player_id, move_number, move,remaining_time) VALUES (?, ?, ?, ?,?)",
                [gameId, playerId, moveNumber, move,remainingTime]
            );
        }
    
        // Update this method to handle game state
        static async getGameState(gameId) {
            // Get all moves for this game
            const [moves] = await pool.query(
                "SELECT * FROM moves WHERE game_id = ? ORDER BY move_number ASC",
                [gameId]
            );
            
            // Reconstruct game state from moves
            const chess = new Chess();
            moves.forEach(move => {
                chess.move(move.move);
            });
            
            return {
                fen: chess.fen(),
                currentTurn: chess.turn() === 'w' ? 'white' : 'black',
                moves
            };
        }
}

export default Game;