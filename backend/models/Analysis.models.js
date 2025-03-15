import { pool } from "../config/db.js";

class Analysis{
  static async create(
    moveId,
    bestMove,
    evaluation,
    isGreatMove,
    isBestMove,
    isExcellent,
    isGood,
    isBook,
    isInaccuracy,
    isMistake,
    isMiss,
    isBlunder
  ) {
    console.log('Saving analysis for move:', moveId, 'Best move:', bestMove); 
    const [result] = await pool.query(
      'INSERT INTO move_analysis(move_id,best_move,evaluation,is_great_move,is_best_move,is_excellent,is_good,is_book,is_inaccuracy,is_mistake,is_miss,is_blunder) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [moveId, bestMove, evaluation, isGreatMove, isBestMove, isExcellent, isGood, isBook, isInaccuracy, isMistake, isMiss, isBlunder]
    );
    console.log('Analysis saved with ID:', result.insertId); 
    return result.insertId;
  }

    static async findByMoveId(moveId){
        const rows=await pool.query(
            'SELECT * FROM move_analysis WHERE move_id=?',[moveId]
        );
        return rows[0];
    }

    static async findByGameId(gameId) {
        const [rows] = await pool.query(
          `SELECT ma.* FROM move_analysis ma
           JOIN moves m ON ma.move_id = m.id
           WHERE m.game_id=?`,
          [gameId]
        );
        return rows; 
      }

      static async update(moveId,
        bestMove,
        evaluation,
        isGreatMove,
        isBestMove,
        isExcellent,
        isGood,
        isBook,
        isInaccuracy,
        isMistake,
        isMiss,
        isBlunder) {
            await pool.query(
                `UPDATE move_analysis SET
                  best_move=?, evaluation = ?,
                  is_great_move=?, is_best_move = ?, is_excellent = ?, is_good = ?, is_book = ?,
                  is_inaccuracy = ?, is_mistake = ?, is_miss = ?, is_blunder = ?
                 WHERE move_id = ?`,
                [
                  bestMove, evaluation,
                  isGreatMove, isBestMove, isExcellent, isGood, isBook,
                  isInaccuracy, isMistake, isMiss, isBlunder,
                  moveId
                ]
              );
      }
    
      static async delete(moveId) {
        await pool.query(
          'DELETE FROM move_analysis WHERE move_id = ?',
          [moveId]
        );
      }
}

export default Analysis;