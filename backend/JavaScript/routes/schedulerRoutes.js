import express from 'express';
import bookingExpirationService from '../services/bookingExpirationService.js';
import pool from '../config/database.js';

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
 * Backup cleanup job - catches any bookings that timers might have missed
 * Called by Cloud Scheduler as safety net
 */
router.post('/cleanup-bookings', verifySchedulerToken, async (req, res) => {
  console.log('☁️ Scheduler triggered: backup cleanup job');
  console.log('🕐 Trigger time:', new Date().toISOString());

  const client = await pool.connect();
  
  try {
    // Find all pending bookings older than 30 minutes
    const result = await client.query(
      `SELECT transaction_id, created_at 
       FROM bookings 
       WHERE status = 'pending'
       AND created_at < NOW() - INTERVAL '30 minutes'`
    );

    const expiredBookings = result.rows;
    let successCount = 0;
    let failedCount = 0;

    if (expiredBookings.length === 0) {
      console.log('✅ No expired bookings found - all timers working correctly');
      return res.status(200).json({
        success: true,
        count: 0,
        failed: 0,
        message: 'No expired bookings found',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Found ${expiredBookings.length} expired bookings to process`);

    // Process each expired booking using the same service
    for (const booking of expiredBookings) {
      try {
        await bookingExpirationService.expireBooking(booking.transaction_id);
        successCount++;
        console.log(`✅ Expired: ${booking.transaction_id}`);
      } catch (error) {
        failedCount++;
        console.error(`❌ Failed to expire ${booking.transaction_id}:`, error.message);
      }
    }

    console.log(`📊 Cleanup complete: ${successCount} successful, ${failedCount} failed`);

    return res.status(200).json({
      success: true,
      count: successCount,
      failed: failedCount,
      message: `Backup cleanup processed ${successCount} bookings`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Scheduler endpoint error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.APP_DEBUG === 'true' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/scheduler/restore-timers
 * Manually trigger timer restoration (for testing or recovery)
 */
router.post('/restore-timers', verifySchedulerToken, async (req, res) => {
  console.log('🔄 Manual timer restoration triggered');
  
  try {
    await bookingExpirationService.restoreTimers();
    
    return res.status(200).json({
      success: true,
      message: 'Timers restored successfully',
      active_timers: bookingExpirationService.getActiveTimerCount(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Timer restoration error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
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
    service: 'scheduler-backup',
    active_timers: bookingExpirationService.getActiveTimerCount(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/scheduler/status
 * Get current scheduler status and timer info
 */
router.get('/status', verifySchedulerToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
        COUNT(*) FILTER (WHERE status = 'pending' AND created_at < NOW() - INTERVAL '30 minutes') as expired_overdue
       FROM bookings`
    );

    const stats = result.rows[0];

    res.json({
      success: true,
      active_timers: bookingExpirationService.getActiveTimerCount(),
      pending_bookings: parseInt(stats.pending_bookings),
      expired_overdue: parseInt(stats.expired_overdue),
      system: 'Per-booking timers with scheduler backup',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

export default router;
