import express from 'express';
import BookingCleanupService from '../services/bookingCleanupService.js';

const router = express.Router();

/**
 * Middleware to verify Cloud Scheduler requests
 * Checks for Authorization header with expected token
 */
const verifySchedulerToken = (req, res, next) => {
  const authHeader = req.get('Authorization');
  const expectedToken = process.env.SCHEDULER_TOKEN;

  if (!expectedToken) {
    console.warn('⚠️ SCHEDULER_TOKEN not configured in environment');
    return res.status(500).json({
      success: false,
      error: 'Server configuration error'
    });
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    console.warn('⚠️ Unauthorized scheduler attempt from:', req.ip);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  next();
};

/**
 * POST /api/scheduler/cleanup-bookings
 * Trigger booking cleanup job
 * Called by Cloud Scheduler hourly
 */
router.post('/cleanup-bookings', verifySchedulerToken, async (req, res) => {
  console.log('☁️ Scheduler triggered: cleanup-bookings');
  console.log('📊 Request source:', req.body?.source || 'unknown');
  console.log('🕐 Trigger time:', new Date().toISOString());

  try {
    // Run the cleanup service
    const result = await BookingCleanupService.cleanupExpiredBookings();

    if (result.success) {
      console.log(`✅ Cleanup successful: ${result.message}`);
      
      return res.status(200).json({
        success: true,
        count: result.count,
        failed: result.failed || 0,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`❌ Cleanup failed: ${result.message}`);
      
      return res.status(500).json({
        success: false,
        error: result.message,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('💥 Scheduler endpoint error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.APP_DEBUG === 'true' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/scheduler/health
 * Health check for scheduler endpoints
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'scheduler',
    timestamp: new Date().toISOString()
  });
});

export default router;
