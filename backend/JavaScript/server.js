import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import stationRoutes from './routes/stationRoutes.js';
import trainRoutes from './routes/trainRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import notificationStreamRoutes from './routes/notificationStreamRoutes.js';
import adminStreamRoutes from './routes/adminStreamRoutes.js';
import bookingStreamRoutes from './routes/bookingStreamRoutes.js';
import schedulerRoutes from './routes/schedulerRoutes.js';
import maintenanceRoutes from './routes/maintenance.js';
import maintenanceStreamRoutes from './routes/maintenanceStreamRoutes.js';

// Import database to test connection
import pool from './config/database.js';
import bookingExpirationService from './services/bookingExpirationService.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet());
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['*'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Add ETag support for better caching
app.set('etag', 'strong');

// Cache control middleware for static data
const cacheControl = (maxAge = 300) => (req, res, next) => {
  // Only cache GET requests
  if (req.method === 'GET') {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
  }
  next();
};

// Apply cache control to specific routes
app.use('/api/stations', cacheControl(600)); // Cache stations for 10 minutes
app.use('/api/trains/all', cacheControl(300)); // Cache all trains for 5 minutes

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'KeretaXpress API Server',
    version: '1.0.0',
    status: 'running'
  });
});

// API Routes
app.use('/api', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/bookings', adminStreamRoutes); // SSE stream for admin bookings (must be before /api/admin)
app.use('/api/admin', adminRoutes);
app.use('/api/maintenance/stream', maintenanceStreamRoutes); // SSE stream for maintenance (public, must be before authenticated routes)
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationStreamRoutes); // SSE stream for notifications
app.use('/api/notifications', notificationRoutes);
app.use('/api/bookings', bookingStreamRoutes); // SSE stream for user bookings (must be before /api/bookings)
app.use('/api/bookings', bookingRoutes);
app.use('/api/scheduler', schedulerRoutes); // Backup cleanup scheduler

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Default error
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
    
    // ⏰ Restore booking expiration timers on server restart
    await bookingExpirationService.restoreTimers();
    console.log('✓ Booking expiration service initialized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.APP_ENV || 'development'}`);
      console.log(`✓ API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
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
