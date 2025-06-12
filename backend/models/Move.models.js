import { pool } from "../config/db.js";

class Move{
  static async create(gameId, playerId, moveNumber, move, remainingTime) {
    const result = await pool.query(
      'INSERT INTO moves (game_id, player_id, move_number, move, remaining_time) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [gameId, playerId, moveNumber, move, remainingTime]
    );
    return result.rows[0].id;
  }

  static async findByGameId(game_id) {
    const result = await pool.query(
      `SELECT moves.*, 
              CASE 
                WHEN moves.player_id = games.player1_id THEN 'player1'
                WHEN moves.player_id = games.player2_id THEN 'player2'
              END AS player
       FROM moves
       JOIN games ON moves.game_id = games.id
       WHERE moves.game_id = $1
       ORDER BY moves.move_number`,
      [game_id]
    );
    return result.rows;
  }

  static async findLastMove(game_id) {
    const result = await pool.query(
      'SELECT * FROM moves WHERE game_id = $1 ORDER BY move_number DESC LIMIT 1',
      [game_id]
    );
    return result.rows[0];
  }
  
  static async findNextMove(game_id, move_number) {
    const result = await pool.query(
      'SELECT * FROM moves WHERE game_id = $1 AND move_number > $2 ORDER BY move_number ASC LIMIT 1',
      [game_id, move_number]
    );
    return result.rows[0];
  }

  static async findPreviousMove(game_id, move_number) {
    const result = await pool.query(
      'SELECT * FROM moves WHERE game_id = $1 AND move_number < $2 ORDER BY move_number DESC LIMIT 1',
      [game_id, move_number]
    );
    return result.rows[0];
  }

  static async findByGameAndMoveNumber(gameId, moveNumber) {
    const result = await pool.query(
      'SELECT * FROM moves WHERE game_id = $1 AND move_number = $2',
      [gameId, moveNumber]
    );
    return result.rows[0]; 
  }
}

export default Move;