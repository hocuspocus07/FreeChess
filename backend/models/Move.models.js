import { pool } from "../config/db";

class Move{
    static async create(game_id, player_id, move_number, move) {
        const [result] = await pool.query(
          'INSERT INTO moves (game_id, player_id, move_number, move) VALUES (?, ?, ?, ?)',
          [game_id, player_id, move_number, move]
        );
        return result.insertId;
    }

    static async findByGameId(game_id) {
        const [rows] = await pool.query(
          `SELECT moves.*, 
                  CASE 
                    WHEN moves.player_id = games.player1_id THEN 'player1'
                    WHEN moves.player_id = games.player2_id THEN 'player2'
                  END AS player
           FROM moves
           JOIN games ON moves.game_id = games.id
           WHERE moves.game_id = ?
           ORDER BY moves.move_number`,
          [game_id]
        );
        return rows;
      }

      static async findLastMove(game_id) {
        const [rows] = await pool.query(
          'SELECT * FROM moves WHERE game_id = ? ORDER BY move_number DESC LIMIT 1',
          [game_id]
        );
        return rows[0];
      }
    
      static async findNextMove(game_id, move_number) {
        const [rows] = await pool.query(
          'SELECT * FROM moves WHERE game_id = ? AND move_number > ? ORDER BY move_number ASC LIMIT 1',
          [game_id, move_number]
        );
        return rows[0];
      }

      static async findPreviousMove(game_id, move_number) {
        const [rows] = await pool.query(
          'SELECT * FROM moves WHERE game_id = ? AND move_number < ? ORDER BY move_number DESC LIMIT 1',
          [game_id, move_number]
        );
        return rows[0];
      }
}

export default Move;