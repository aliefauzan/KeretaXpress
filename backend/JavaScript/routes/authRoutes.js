import express from 'express';
import AuthController from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../utils/validators.js';
import authMiddleware from '../middlerware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);

// Admin routes
router.post('/admin/login', loginValidation, AuthController.adminLogin);

// Protected routes
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/refresh', authMiddleware, AuthController.refresh);
router.get('/user/:id?', authMiddleware, AuthController.getUser);

export default router;
