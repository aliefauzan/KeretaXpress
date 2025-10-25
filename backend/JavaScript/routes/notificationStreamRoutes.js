import express from 'express';
import authMiddleware from '../middlerware/authMiddleware.js';

const router = express.Router();

// Store active SSE connections
const clients = new Map(); // Map<userUuid, Set<response>>

/**
 * SSE endpoint for real-time notifications
 * GET /api/notifications/stream
 */
router.get('/stream', authMiddleware, (req, res) => {
  const userUuid = req.user.uuid || req.user.id;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection success
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Add client to active connections
  if (!clients.has(userUuid)) {
    clients.set(userUuid, new Set());
  }
  clients.get(userUuid).add(res);

  console.log(`📡 SSE connected for user ${userUuid}. Total clients: ${Array.from(clients.values()).reduce((sum, set) => sum + set.size, 0)}`);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    
    const userClients = clients.get(userUuid);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) {
        clients.delete(userUuid);
      }
    }

    console.log(`📡 SSE disconnected for user ${userUuid}. Total clients: ${Array.from(clients.values()).reduce((sum, set) => sum + set.size, 0)}`);
  });
});

/**
 * Broadcast notification to user's connected clients
 * Called by NotificationController after creating a notification
 */
export function notifyUser(userUuid, notification) {
  const userClients = clients.get(userUuid);
  
  if (userClients && userClients.size > 0) {
    const data = JSON.stringify({
      type: 'notification',
      notification,
      timestamp: new Date().toISOString()
    });

    let sent = 0;
    userClients.forEach(client => {
      try {
        client.write(`data: ${data}\n\n`);
        sent++;
      } catch (error) {
        console.error('Error sending SSE:', error);
        userClients.delete(client);
      }
    });

    console.log(`📨 Sent notification to ${sent} client(s) for user ${userUuid}`);
    return sent;
  }

  return 0;
}

/**
 * Broadcast unread count update to user
 */
export function notifyUnreadCount(userUuid, unreadCount) {
  const userClients = clients.get(userUuid);
  
  if (userClients && userClients.size > 0) {
    const data = JSON.stringify({
      type: 'unread_count',
      unreadCount,
      timestamp: new Date().toISOString()
    });

    userClients.forEach(client => {
      try {
        client.write(`data: ${data}\n\n`);
      } catch (error) {
        console.error('Error sending SSE:', error);
        userClients.delete(client);
      }
    });
  }
}

/**
 * Get statistics about active connections
 */
export function getConnectionStats() {
  return {
    totalUsers: clients.size,
    totalConnections: Array.from(clients.values()).reduce((sum, set) => sum + set.size, 0),
    users: Array.from(clients.keys())
  };
}

export default router;
