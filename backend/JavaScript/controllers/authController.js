import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class AuthController {
  // Generate JWT token
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // Register new user
  static async register(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(422).json({ 
          errors: [{ 
            field: 'email', 
            message: 'Email already exists' 
          }] 
        });
      }

      // Create new user
      const user = await User.create({ name, email, password });

      // Generate token
      const token = AuthController.generateToken(user.id);

      return res.status(201).json({
        user: {
          id: user.id,
          uuid: user.uuid,
          name: user.name,
          email: user.email,
          created_at: user.created_at
        },
        token
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = AuthController.generateToken(user.id);

      return res.status(200).json({
        user: {
          id: user.id,
          uuid: user.uuid,
          name: user.name,
          email: user.email,
          created_at: user.created_at
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Logout user (client-side token removal, no server action needed)
  static async logout(req, res) {
    try {
      // In JWT, logout is handled on client-side by removing the token
      // Here we just send a success response
      return res.status(200).json({ message: 'Successfully logged out' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Refresh token
  static async refresh(req, res) {
    try {
      // User is already authenticated via middleware
      const user = req.user;

      // Generate new token
      const token = AuthController.generateToken(user.id);

      return res.status(200).json({
        user: {
          id: user.id,
          uuid: user.uuid,
          name: user.name,
          email: user.email,
          created_at: user.created_at
        },
        token,
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ message: 'Token refresh failed' });
    }
  }

  // Get user info
  static async getUser(req, res) {
    try {
      const { id } = req.params;

      if (id) {
        // Get user by UUID
        const user = await User.findByUuid(id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ user });
      }

      // Return authenticated user
      return res.status(200).json({ user: req.user });
    } catch (error) {
      console.error('User fetching error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default AuthController;
