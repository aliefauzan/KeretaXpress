import Notification from '../models/Notification.js';

class NotificationController {
  /**
   * Get user notifications
   * GET /api/notifications
   * Query params: type, read (true/false), page, limit
   */
  static async getUserNotifications(req, res) {
    try {
      const userUuid = req.user.uuid || req.user.id;
      const { type, read, page = 1, limit = 20 } = req.query;

      // Build filters
      const filters = {};
      if (type) filters.type = type;
      if (read !== undefined) filters.read = read === 'true';

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Get notifications by user UUID from JSONB data field
      const notifications = await Notification.getByUserUuid(
        userUuid,
        filters,
        parseInt(limit),
        offset
      );

      // Get unread count
      const unreadCount = await Notification.countUnreadByUserUuid(userUuid);

      return res.status(200).json({
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: notifications.length
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({
        message: 'Gagal mengambil notifikasi',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Mark notification as read
   * PUT /api/notifications/:uuid/read
   */
  static async markAsRead(req, res) {
    try {
      const { uuid } = req.params;
      const userUuid = req.user.uuid || req.user.id;

      // Get notification to check ownership
      const notification = await Notification.findByUuid(uuid);

      if (!notification) {
        return res.status(404).json({
          message: 'Notifikasi tidak ditemukan'
        });
      }

      // Check if notification belongs to user
      const notificationUserUuid = notification.data?.user_uuid;
      if (notificationUserUuid !== userUuid) {
        return res.status(403).json({
          message: 'Anda tidak memiliki akses ke notifikasi ini'
        });
      }

      // Check if already read
      if (notification.read_at) {
        return res.status(200).json({
          message: 'Notifikasi sudah ditandai sebagai dibaca',
          notification
        });
      }

      // Mark as read
      const updatedNotification = await Notification.markAsReadByUuid(uuid);

      return res.status(200).json({
        message: 'Notifikasi berhasil ditandai sebagai dibaca',
        notification: updatedNotification
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      return res.status(500).json({
        message: 'Gagal menandai notifikasi sebagai dibaca',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Mark all notifications as read for user
   * PUT /api/notifications/read-all
   */
  static async markAllAsRead(req, res) {
    try {
      const userUuid = req.user.uuid || req.user.id;

      // Mark all as read
      const count = await Notification.markAllAsReadByUserUuid(userUuid);

      return res.status(200).json({
        message: 'Semua notifikasi berhasil ditandai sebagai dibaca',
        count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      return res.status(500).json({
        message: 'Gagal menandai semua notifikasi sebagai dibaca',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get unread count
   * GET /api/notifications/unread-count
   */
  static async getUnreadCount(req, res) {
    try {
      const userUuid = req.user.uuid || req.user.id;
      const count = await Notification.countUnread(userUuid);

      return res.status(200).json({
        unreadCount: count
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      return res.status(500).json({
        message: 'Gagal mengambil jumlah notifikasi belum dibaca',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default NotificationController;
