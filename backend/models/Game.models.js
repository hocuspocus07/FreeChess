import { pool } from "../config/db.js";
import { Chess } from "chess.js";
class Game {
  static async create(player1_id, player2_id, winner_id, status, time_control) {
    const result = await pool.query(
      "INSERT INTO games(player1_id,player2_id,winner_id,status,time_control) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [player1_id, player2_id, winner_id, status, time_control]
    );
    return result.rows[0].id;
  }
  static async getTimeControl(gameId) {
    const result = await pool.query(
      "SELECT time_control FROM games WHERE id = $1",
      [gameId]
    );
    return result.rows[0]?.time_control || 600;
  }

  static async update(gameId, updateFields) {
    // updateFields is an object, so we need to build the query dynamically
    const keys = Object.keys(updateFields);
    const values = Object.values(updateFields);
    const setString = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");
    const query = `UPDATE games SET ${setString} WHERE id = $${
      keys.length + 1
    }`;
    const result = await pool.query(query, [...values, gameId]);
    return result;
  }

  static async updateMoves(id, moves) {
    await pool.query("DELETE FROM moves WHERE game_id = $1", [id]);
    for (const move of moves) {
      await pool.query(
        "INSERT INTO moves (game_id, player_id, move_number, move) VALUES ($1, $2, $3, $4)",
        [id, move.player_id, move.move_number, move.move]
      );
    }
  }

  static async findById(id) {
    const result = await pool.query("SELECT * FROM games WHERE id = $1", [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    await pool.query("UPDATE games SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);
  }

  static async setWinner(id, winner_id) {
    await pool.query("UPDATE games SET winner_id = $1 WHERE id = $2", [
      winner_id,
      id,
    ]);
  }

  static async endGame(id) {
    await pool.query(
      "UPDATE games SET end_time = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );
  }

  static async findByUserId(userId) {
    try {
      const result = await pool.query(
        "SELECT * FROM games WHERE player1_id = $1 OR player2_id = $1",
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error in findByUserId:", error);
      throw error;
    }
  }

  static async updateRefreshToken(userId, refreshToken) {
    await pool.query("UPDATE users SET refreshToken = $1 WHERE id = $2", [
      refreshToken,
      userId,
    ]);
  }

  static async findByRefreshToken(refreshToken) {
    const result = await pool.query(
      "SELECT * FROM users WHERE refreshToken = $1",
      [refreshToken]
    );
    return result.rows[0];
  }

  static async findWaitingGames() {
    const result = await pool.query(
      "SELECT * FROM games WHERE status = 'waiting' AND player2_id IS NULL"
    );
    return result.rows;
  }

  static async cleanupAbandonedGames() {
    await pool.query(`
    DELETE FROM games
    WHERE id NOT IN (SELECT DISTINCT game_id FROM moves)
      AND created_at < NOW() - INTERVAL '10 minutes'
      AND status = 'active'
  `);
  }

  static async saveMove(
    gameId,
    playerId,
    moveNumber,
    move,
    remainingTime = 600
  ) {
    await pool.query(
      "INSERT INTO moves (game_id, player_id, move_number, move, remaining_time) VALUES ($1, $2, $3, $4, $5)",
      [gameId, playerId, moveNumber, move, remainingTime]
    );
  }

  static async getGameState(gameId) {
    const result = await pool.query(
      "SELECT * FROM moves WHERE game_id = $1 ORDER BY move_number ASC",
      [gameId]
    );
    const moves = result.rows;

    const chess = new Chess();
    moves.forEach((move) => {
      chess.move(move.move);
    });

    return {
      fen: chess.fen(),
      currentTurn: chess.turn() === "w" ? "white" : "black",
      moves,
    };
  }
}

export default Game;
