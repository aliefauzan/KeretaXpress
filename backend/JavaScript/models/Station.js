import pool from '../config/database.js';

class Station {
  static async getAll() {
    try {
      const result = await pool.query(
        'SELECT * FROM stations ORDER BY name ASC'
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM stations WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByCity(city) {
    try {
      const result = await pool.query(
        'SELECT * FROM stations WHERE city ILIKE $1',
        [`%${city}%`]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async create({ name, city, address }) {
    try {
      const result = await pool.query(
        `INSERT INTO stations (name, city, address, created_at, updated_at) 
         VALUES ($1, $2, $3, NOW(), NOW()) 
         RETURNING *`,
        [name, city, address]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export default Station;
