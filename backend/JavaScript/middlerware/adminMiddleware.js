import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

// Middleware to check if user is authenticated admin
export const adminAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get admin from database
    const result = await pool.query(
      'SELECT id, uuid, name, email, role, created_at FROM admins WHERE id = $1',
      [decoded.adminId] // Note: using adminId instead of userId
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    // Attach admin to request
    req.admin = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware to check if admin has specific role
export const checkAdminRole = (allowedRoles) => {
  return (req, res, next) => {
    const admin = req.admin;
    
    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // allowedRoles can be a string or array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(admin.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${admin.role}` 
      });
    }

    next();
  };
};

export default { adminAuthMiddleware, checkAdminRole };
