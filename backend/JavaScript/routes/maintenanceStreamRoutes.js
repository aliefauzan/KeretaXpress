import express from 'express';

const router = express.Router();

// Store active SSE connections
const maintenanceClients = new Set();

// Broadcast maintenance update to all connected clients
export function broadcastMaintenanceUpdate(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  maintenanceClients.forEach(client => {
    try {
      client.res.write(message);
    } catch (error) {
      console.error('Error broadcasting to maintenance client:', error);
      maintenanceClients.delete(client);
    }
  });
  
  console.log(`📡 Broadcasted maintenance update to ${maintenanceClients.size} clients`);
}

// SSE endpoint for maintenance updates
router.get('/stream', (req, res) => {
  console.log('📡 Maintenance stream connection request received');
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write('data: {"type":"connected","message":"Maintenance stream connected"}\n\n');
  res.flushHeaders();

  // Store client connection
  const client = { res, connectedAt: new Date() };
  maintenanceClients.add(client);

  console.log(`✅ New maintenance stream client connected. Total clients: ${maintenanceClients.size}`);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write('data: {"type":"heartbeat"}\n\n');
    } catch (error) {
      clearInterval(heartbeatInterval);
      maintenanceClients.delete(client);
    }
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    maintenanceClients.delete(client);
    console.log(`❌ Maintenance stream client disconnected. Remaining clients: ${maintenanceClients.size}`);
  });
});

export default router;
