import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

class User {
  static async create({ name, email, password }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const uuid = uuidv4();
      
      const result = await pool.query(
        `INSERT INTO users (uuid, name, email, password, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, NOW(), NOW()) 
         RETURNING id, uuid, name, email, created_at, updated_at`,
        [uuid, name, email, hashedPassword]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT id, uuid, name, email, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByUuid(uuid) {
    try {
      const result = await pool.query(
        'SELECT id, uuid, name, email, created_at, updated_at FROM users WHERE uuid = $1',
        [uuid]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getBookings(userUuid) {
    try {
      const result = await pool.query(
        `SELECT b.*, 
                t.name as train_name, t.operator, t.class_type,
                ds.name as departure_station_name, ds.city as departure_city,
                as_station.name as arrival_station_name, as_station.city as arrival_city,
                t.departure_time, t.arrival_time
         FROM bookings b
         JOIN trains t ON b.train_id = t.id
         JOIN stations ds ON t.departure_station_id = ds.id
         JOIN stations as_station ON t.arrival_station_id = as_station.id
         WHERE b.user_uuid = $1
         ORDER BY b.created_at DESC`,
        [userUuid]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

export default User;
