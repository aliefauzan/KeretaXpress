import express from 'express';
import authMiddleware from '../middlerware/authMiddleware.js';

const router = express.Router();

// Store active user SSE connections for booking updates
// Map<userUuid, Set<response>>
const bookingClients = new Map();

/**
 * SSE endpoint for user booking updates
 * Streams payment confirmations, booking status changes, etc.
 */
router.get('/stream', authMiddleware, (req, res) => {
  const userUuid = req.user.uuid;
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

  // Send initial connection success
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    message: 'Booking updates SSE connected',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Add this client to the booking connections
  if (!bookingClients.has(userUuid)) {
    bookingClients.set(userUuid, new Set());
  }
  bookingClients.get(userUuid).add(res);

  console.log(`📡 Booking SSE connected for user ${userUuid}. Total clients: ${bookingClients.get(userUuid).size}`);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    
    const clients = bookingClients.get(userUuid);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        bookingClients.delete(userUuid);
      }
    }
    
    console.log(`📡 Booking SSE disconnected for user ${userUuid}`);
  });
});

/**
 * Notify specific user about booking update
 * @param {string} userUuid - User UUID
 * @param {string} eventType - 'booking.payment_confirmed', 'booking.cancelled', etc.
 * @param {Object} data - Event data
 */
export function notifyUserBooking(userUuid, eventType, data) {
  const clients = bookingClients.get(userUuid);
  
  if (!clients || clients.size === 0) {
    return; // No clients connected for this user
  }

  const message = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });

  let sent = 0;
  clients.forEach((client) => {
    try {
      client.write(`data: ${message}\n\n`);
      sent++;
    } catch (error) {
      console.error('Error sending booking update to user:', error);
      clients.delete(client);
    }
  });

  if (sent > 0) {
    console.log(`📨 Sent ${eventType} to ${sent} client(s) for user ${userUuid}`);
  }
}

/**
 * Get connection statistics
 */
export function getBookingConnectionStats() {
  let totalClients = 0;
  bookingClients.forEach((clients) => {
    totalClients += clients.size;
  });
  
  return {
    usersConnected: bookingClients.size,
    totalConnections: totalClients
  };
}

export default router;
