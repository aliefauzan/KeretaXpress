import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

// Import scheduler routes only
import schedulerRoutes from './routes/schedulerRoutes.js';

// Import database to test connection
import pool from './config/database.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'KeretaXpress Scheduler Service',
    version: '1.0.0',
    status: 'running',
    service: 'scheduler'
  });
});

// Scheduler routes only (no API routes)
app.use('/api/scheduler', schedulerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    hint: 'This service only handles /api/scheduler routes'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.APP_DEBUG === 'true' && { stack: err.stack })
  });
});

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('✓ Database connected successfully');
    client.release();
    
    console.log('ℹ️  Scheduler service ready for Cloud Scheduler triggers');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Scheduler service running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.APP_ENV || 'development'}`);
      console.log(`✓ Cleanup endpoint: http://localhost:${PORT}/api/scheduler/cleanup-bookings`);
    });
  } catch (error) {
    console.error('✗ Failed to start scheduler service:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();

export default app;
