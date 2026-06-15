import express from 'express';
import NotificationController from '../controllers/notificationController.js';
import authMiddleware from '../middlerware/authMiddleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with filters and pagination
 * @access  Private (Customer)
 * @query   type, read, page, limit
 */
router.get('/', NotificationController.getUserNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for user
 * @access  Private (Customer)
 */
router.get('/unread-count', NotificationController.getUnreadCount);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for current user
 * @access  Private (Customer)
 */
router.put('/read-all', NotificationController.markAllAsRead);

/**
 * @route   PUT /api/notifications/:uuid/read
 * @desc    Mark specific notification as read
 * @access  Private (Customer)
 */
router.put('/:uuid/read', NotificationController.markAsRead);

export default router;
