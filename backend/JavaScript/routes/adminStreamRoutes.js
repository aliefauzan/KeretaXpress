import express from 'express';
import { adminAuthMiddleware } from '../middlerware/adminMiddleware.js';

const router = express.Router();

// Store active admin SSE connections
// Map<adminId, Set<response>>
const adminClients = new Map();

/**
 * SSE endpoint for admin real-time updates
 * Streams booking updates, payment confirmations, etc.
 */
router.get('/stream', adminAuthMiddleware, (req, res) => {
  const adminId = req.admin.id;
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

  // Send initial connection success
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    message: 'Admin SSE connected',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Add this client to the admin connections
  if (!adminClients.has(adminId)) {
    adminClients.set(adminId, new Set());
  }
  adminClients.get(adminId).add(res);

  console.log(`📡 Admin SSE connected: ${req.admin.email}. Total admin clients: ${adminClients.get(adminId).size}`);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    
    const clients = adminClients.get(adminId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        adminClients.delete(adminId);
      }
    }
    
    console.log(`📡 Admin SSE disconnected: ${req.admin.email}`);
  });
});

/**
 * Broadcast booking update to all connected admins
 * @param {string} eventType - 'booking.created', 'booking.updated', 'payment.confirmed', etc.
 * @param {Object} data - Event data
 */
export function broadcastToAdmins(eventType, data) {
  const message = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });

  let totalSent = 0;
  
  // Send to all connected admin clients
  adminClients.forEach((clients, adminId) => {
    clients.forEach((client) => {
      try {
        client.write(`data: ${message}\n\n`);
        totalSent++;
      } catch (error) {
        console.error('Error sending to admin client:', error);
        clients.delete(client);
      }
    });
  });

  if (totalSent > 0) {
    console.log(`📨 Broadcasted ${eventType} to ${totalSent} admin client(s)`);
  }
}

/**
 * Get connection statistics
 */
export function getAdminConnectionStats() {
  let totalClients = 0;
  adminClients.forEach((clients) => {
    totalClients += clients.size;
  });
  
  return {
    adminsConnected: adminClients.size,
    totalConnections: totalClients
  };
}

export default router;
