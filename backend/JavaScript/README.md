# 🚂 KeretaXpress Backend - Node.js + Express.js

Modern, production-ready REST API backend for the KeretaXpress train booking platform.

## ✨ Features

### 🔐 **Authentication & Authorization**
- **JWT Authentication**: Stateless token-based auth with refresh tokens
- **Dual Auth System**: Separate authentication for customers and admins
- **Role-Based Access**: Admin middleware for protected admin routes
- **Secure Passwords**: bcrypt hashing with salt rounds

### 🚄 **Train Management**
- **Train Search**: Advanced filtering by route, date, and class
- **Seat Availability**: Real-time seat tracking with locking mechanism
- **Promotional Trains**: Featured train offerings
- **Train CRUD**: Full admin management (Create, Read, Update, Delete)

### 🎫 **Booking System**
- **Transaction Management**: Database transactions for data consistency
- **Unique Transaction IDs**: Format: `KX-XXXXXXXXXX`
- **Booking History**: Filter by status (pending, confirmed, cancelled, paid)
- **Seat Locking**: Prevent double-booking with row-level locks
- **Admin Dashboard**: Real-time booking overview with analytics

### 💳 **Payment Integration**
- **Midtrans Integration**: 
  - Snap API for e-wallet and virtual accounts
  - Core API for QRIS generation
- **Webhook Notifications**: Automatic payment status updates with signature verification
- **Manual Confirmation**: Admin can manually verify bank transfers
- **Payment Proof Upload**: Supabase Storage integration
- **Dual Notification Sources**: Webhook (automatic) + Admin (manual)

### 🔔 **Real-time Notifications**
- **Server-Sent Events (SSE)**: Live updates without polling
- **Customer Notifications**: Payment status, booking confirmations
- **Admin Notifications**: New bookings, pending payments
- **Polymorphic Design**: Flexible notification system
- **Three SSE Streams**:
  - `/api/notifications/stream` - Customer notifications
  - `/api/admin/notifications/stream` - Admin alerts
  - `/api/bookings/stream` - Booking status updates

### ⚙️ **System Features**
- **Cloud Scheduler**: Automated cleanup of expired bookings
- **Database Pooling**: Efficient PostgreSQL connection management
- **Request Validation**: express-validator for input sanitization
- **Security Headers**: Helmet.js for HTTP security
- **CORS Configuration**: Cross-origin resource sharing
- **Error Handling**: Comprehensive error responses
- **File Upload**: Multer middleware for payment proofs

## 📂 Project Structure

```
backend/JavaScript/
├── config/
│   └── database.js              # PostgreSQL connection pool configuration
│
├── controllers/                 # Request handlers & business logic
│   ├── authController.js        # User authentication (register, login, logout)
│   ├── adminController.js       # Admin operations & authentication
│   ├── trainController.js       # Train management & search
│   ├── bookingController.js     # Booking creation & management
│   ├── paymentController.js     # Midtrans integration & payment proof
│   ├── stationController.js     # Station CRUD operations
│   └── notificationController.js # Notification management
│
├── middlerware/                 # Express middleware
│   ├── authMiddleware.js        # JWT verification for customers
│   └── adminMiddleware.js       # Admin authorization checks
│
├── models/                      # Data models with static methods
│   ├── User.js                  # Customer user model
│   ├── Admin.js                 # Admin user model
│   ├── Station.js               # Train station model
│   ├── Train.js                 # Train schedule model
│   ├── Booking.js               # Booking transaction model
│   ├── Payment.js               # Payment record model
│   └── Notification.js          # Notification model (polymorphic)
│
├── routes/                      # API endpoint definitions
│   ├── authRoutes.js            # /api/auth/* (register, login)
│   ├── adminRoutes.js           # /api/admin/* (admin operations)
│   ├── trainRoutes.js           # /api/trains/* (search, CRUD)
│   ├── bookingRoutes.js         # /api/bookings/* (create, history)
│   ├── paymentRoutes.js         # /api/payments/* (Midtrans, upload)
│   ├── stationRoutes.js         # /api/stations/* (station management)
│   ├── notificationRoutes.js    # /api/notifications/* (get, mark read)
│   ├── notificationStreamRoutes.js # SSE: Customer notifications
│   ├── adminStreamRoutes.js     # SSE: Admin dashboard updates
│   ├── bookingStreamRoutes.js   # SSE: Booking status changes
│   ├── schedulerRoutes.js       # /api/scheduler/* (Cloud Scheduler jobs)
│   ├── maintenance.js           # Train maintenance routes
│   └── maintenanceStreamRoutes.js # SSE: Real-time maintenance updates
│
├── services/                    # External service integrations
│   ├── supabaseService.js       # Supabase Storage client
│   └── midtransService.js       # Midtrans payment gateway
│
├── utils/                       # Utility functions
│   └── validators.js            # Request validation schemas
│
├── migrations/                  # Database migration scripts
│   ├── 01_create_users_table.sql
│   ├── 02_create_admins_table.sql
│   ├── 03_create_stations_table.sql
│   ├── 04_create_trains_table.sql
│   ├── 05_create_bookings_table.sql
│   ├── 06_create_payments_table.sql
│   ├── 07_create_booking_history_table.sql
│   ├── 08_create_notifications_table.sql
│   └── complete_schema.sql      # Full database schema
│
├── uploads/                     # Temporary file upload directory
│
├── server.js                    # Main Express application
├── scheduler-server.js          # Cloud Scheduler cron job server
├── create_admin.js              # Script to create admin accounts
│
├── Dockerfile                   # Main API container
├── Dockerfile.scheduler         # Scheduler container
├── cloudbuild.yaml             # Google Cloud Build config (API)
├── cloudbuild-scheduler.yaml   # Google Cloud Build config (Scheduler)
├── deploy.sh                   # Deployment script
│
├── package.json                # Dependencies & scripts
├── .env                        # Environment variables
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## 🔧 Prerequisites

- **Node.js**: v18 or higher
- **npm** or **yarn**: Package manager
- **PostgreSQL**: Supabase account (cloud-hosted)
- **Supabase Storage**: For payment proof files
- **Midtrans Account**: For payment gateway (Sandbox or Production)
- **Google Cloud Account**: For deployment (optional, for production)

---

## ⏰ Booking Expiration System

### **Hybrid Approach: Per-Booking Timers + Scheduler Backup**

KeretaXpress uses a **hybrid system** combining efficient per-booking timers with a scheduler backup:

**Primary System: Per-Booking Timers**
✅ **Precise 30-minute expiration** (exact timing for each booking)  
✅ **Efficient** (only runs for bookings that exist)  
✅ **Real-time** (expires immediately when timer fires)  
✅ **Cost-effective** (no Cloud Scheduler needed for normal operation)

**Backup System: Scheduler Safety Net**
✅ **Catches missed bookings** (if server crashes or timer fails)  
✅ **Recovery mechanism** (processes overdue bookings)  
✅ **Monitoring capability** (reports system health)  
✅ **Optional** (can run hourly/daily as safety check)

### **How It Works**

```javascript
// PRIMARY: Per-Booking Timer (Normal Flow)
// 1. User creates booking at 10:00 PM
BookingController.book() → scheduleExpiration(transactionId, 30 minutes)

// 2. Timer fires at 10:30 PM (exactly 30 minutes later)
setTimeout(() => expireBooking(transactionId), 30 * 60 * 1000)

// 3. Booking expired automatically ✅

// BACKUP: Scheduler (Safety Net)
// Runs hourly/daily to catch any bookings timers missed
Cloud Scheduler (every 1 hour)
  ↓
POST /api/scheduler/cleanup-bookings
  ↓
Query: SELECT bookings WHERE pending AND > 30 minutes old
  ↓
For each: expireBooking(transactionId) // Uses same service
  ↓
Report: "Found 0 overdue bookings" (if timers working) ✅
```

### **Advantages Over Single-System Approaches**

| Feature | Hybrid (Current) | Timer-Only | Scheduler-Only |
|---------|------------------|------------|----------------|
| Precision | Exact 30 minutes | Exact 30 minutes | Depends on cron |
| Resource Usage | Minimal | Minimal | High (queries all) |
| Reliability | Very High | Medium | High |
| Server Restart | Auto-recovers | Needs restoration | No impact |
| Edge Cases | Catches all | Might miss some | Catches all |
| Cost | Very Low | Free | Cloud Scheduler fees |

### **System Architecture**

```
┌─────────────────────────────────────────────────────────┐
│              Booking Created (10:00 PM)                  │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│ PRIMARY SYSTEM  │      │  BACKUP SYSTEM   │
│  (Timers)       │      │  (Scheduler)     │
├─────────────────┤      ├──────────────────┤
│ ⏰ 30 min timer │      │ 🕐 Hourly check  │
│ Fires: 10:30 PM │      │ Runs: 11:00 PM   │
│                 │      │ Finds: 0 overdue │
│ ✅ Expires      │      │ ✅ All clear     │
└─────────────────┘      └──────────────────┘
         │                        │
         └───────────┬────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │ bookingExpiration   │
         │    Service          │
         │ (Shared Logic)      │
         └─────────────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │ • Update status     │
         │ • Restore seat      │
         │ • Send notification │
         └─────────────────────┘
```

### **Timer Restoration on Server Restart**

```javascript
// On server startup, restore timers for pending bookings
await bookingExpirationService.restoreTimers();

// For each pending booking:
// - If already expired (> 30 min) → Expire immediately
// - If still valid (< 30 min) → Schedule remaining time

// Example: Server restarts at 10:20 PM
// Booking created at 10:00 PM
// Remaining time: 10 minutes
// New timer scheduled for 10:30 PM ✅
```

### **Scheduler Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/scheduler/cleanup-bookings` | POST | Main backup cleanup (called by Cloud Scheduler) |
| `/api/scheduler/restore-timers` | POST | Manually trigger timer restoration |
| `/api/scheduler/health` | GET | Health check + active timer count |
| `/api/scheduler/status` | GET | Detailed system status + overdue count |

### **Optional: Cloud Scheduler Setup**

```bash
# Create hourly backup cleanup job (optional safety net)
gcloud scheduler jobs create http cleanup-expired-bookings-backup \
  --schedule="0 * * * *" \
  --uri="https://your-api.run.app/api/scheduler/cleanup-bookings" \
  --http-method=POST \
  --time-zone="Asia/Jakarta" \
  --headers="Authorization=Bearer YOUR_SCHEDULER_TOKEN"

# Or for more frequent checks (every 15 minutes)
# --schedule="*/15 * * * *"

# Expected result in logs when timers are working:
# "Found 0 overdue bookings - all timers working correctly" ✅
```

### **Implementation Files**

- **Service**: `services/bookingExpirationService.js` (shared expiration logic)
- **Routes**: `routes/schedulerRoutes.js` (backup scheduler endpoints)
- **Booking Creation**: `controllers/bookingController.js` (schedules timer)
- **Payment Success**: `controllers/paymentController.js` (cancels timer)
- **Admin Confirmation**: `controllers/adminController.js` (cancels timer)
- **Server Startup**: `server.js` (restores timers + registers scheduler routes)

### **Monitoring & Testing**

**Check Timer Status:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.run.app/api/scheduler/status

# Response:
{
  "active_timers": 5,
  "pending_bookings": 5,
  "expired_overdue": 0,  // Should be 0 if timers working
  "system": "Per-booking timers with scheduler backup"
}
```

**Manual Cleanup Test:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.run.app/api/scheduler/cleanup-bookings

# Response:
{
  "success": true,
  "count": 0,  // 0 means timers caught everything
  "message": "No expired bookings found"
}
```

---

## 🚀 Deployment to Google Cloud Run

### **Prerequisites**

1. **Navigate to backend directory**:
   ```bash
   cd backend/JavaScript
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create `.env` file (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   
   Update the following variables:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database (Supabase PostgreSQL)
   DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres.your-project-ref
   DB_PASSWORD=your-database-password
   
   # Supabase Storage
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   SUPABASE_BUCKET=payment-proofs
   
   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   
   # Midtrans Payment Gateway
   MIDTRANS_SERVER_KEY=your-midtrans-server-key
   MIDTRANS_CLIENT_KEY=your-midtrans-client-key
   MIDTRANS_IS_PRODUCTION=false  # true for production
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3001
   ```

4. **Run database migrations**:
   ```bash
   npm run migrate
   # Or manually run SQL files in migrations/ directory
   ```

5. **Create admin account** (optional):
   ```bash
   node create_admin.js
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   Server will start on `http://localhost:3000`

## 🗄️ Database Schema

### **Users Table**
```sql
- id: SERIAL PRIMARY KEY
- uuid: UUID UNIQUE NOT NULL
- name: VARCHAR(255) NOT NULL
- email: VARCHAR(255) UNIQUE NOT NULL
- password: VARCHAR(255) NOT NULL (bcrypt hashed)
- created_at, updated_at: TIMESTAMP
```

### **Admins Table**
```sql
- id: SERIAL PRIMARY KEY
- uuid: UUID UNIQUE NOT NULL
- name: VARCHAR(255) NOT NULL
- email: VARCHAR(255) UNIQUE NOT NULL
- password: VARCHAR(255) NOT NULL (bcrypt hashed)
- created_at, updated_at: TIMESTAMP
```

### **Stations Table**
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- city: VARCHAR(255) NOT NULL
- address: TEXT (optional)
- created_at, updated_at: TIMESTAMP
```

### **Trains Table**
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- operator: VARCHAR(255) NOT NULL
- departure_station_id: INTEGER REFERENCES stations(id)
- arrival_station_id: INTEGER REFERENCES stations(id)
- departure_time: TIMESTAMP NOT NULL
- arrival_time: TIMESTAMP NOT NULL
- duration_minutes: INTEGER NOT NULL
- class_type: VARCHAR(50) NOT NULL (ekonomi, bisnis, eksekutif)
- price: DECIMAL(10,2) NOT NULL
- available_seats: INTEGER NOT NULL
- created_at, updated_at: TIMESTAMP
```

### **Bookings Table**
```sql
- id: SERIAL PRIMARY KEY
- transaction_id: VARCHAR(50) UNIQUE NOT NULL (e.g., KX-ABC1234567)
- user_uuid: UUID REFERENCES users(uuid)
- train_id: INTEGER REFERENCES trains(id)
- travel_date: DATE NOT NULL
- passenger_name: VARCHAR(255) NOT NULL
- passenger_id_number: VARCHAR(50) NOT NULL
- passenger_dob: DATE NOT NULL
- passenger_gender: VARCHAR(10) NOT NULL (male/female)
- seat_number: VARCHAR(10) NOT NULL
- payment_method: VARCHAR(50) NOT NULL (transfer, e-wallet, qris)
- status: VARCHAR(20) NOT NULL (pending, confirmed, cancelled, paid)
- total_price: DECIMAL(10,2) NOT NULL
- payment_proof: TEXT (URL, nullable)
- created_at, updated_at: TIMESTAMP
```

### **Payments Table**
```sql
- id: SERIAL PRIMARY KEY
- booking_id: INTEGER REFERENCES bookings(id)
- midtrans_order_id: VARCHAR(255) UNIQUE
- midtrans_transaction_id: VARCHAR(255)
- payment_type: VARCHAR(50) (snap, qris, manual)
- status: VARCHAR(20) (pending, success, failed, cancelled)
- amount: DECIMAL(10,2) NOT NULL
- snap_token: TEXT (nullable)
- qr_code: TEXT (nullable, base64 or URL)
- payment_proof_url: TEXT (nullable, Supabase Storage URL)
- created_at, updated_at: TIMESTAMP
```

### **Notifications Table** (Polymorphic)
```sql
- id: SERIAL PRIMARY KEY
- type: VARCHAR(100) NOT NULL (payment.completed, booking.confirmed, etc.)
- notifiable_type: VARCHAR(50) NOT NULL (User, Admin)
- notifiable_id: UUID NOT NULL (user uuid or admin uuid)
- data: JSONB NOT NULL (notification payload)
- read_at: TIMESTAMP (nullable)
- triggered_by: VARCHAR(20) ('midtrans' | 'admin')
- created_at, updated_at: TIMESTAMP
- INDEX: GIN index on (data->>'user_uuid')::uuid
```

### **Booking History Table**
```sql
- id: SERIAL PRIMARY KEY
- booking_id: INTEGER REFERENCES bookings(id)
- old_status: VARCHAR(20)
- new_status: VARCHAR(20)
- changed_by: VARCHAR(50) (system, admin, user)
- notes: TEXT (optional)
- created_at: TIMESTAMP
```

## 🚀 Running the Server

### **Development Mode** (with auto-reload)
```bash
npm run dev
```

### **Production Mode**
```bash
npm start
```

### **Scheduler Service** (for Cloud Scheduler)
```bash
node scheduler-server.js
```

Server will start on `http://localhost:3000` (or the PORT specified in `.env`)

---

## 🔌 API Endpoints

### 🔓 **Public Endpoints** (No Authentication)

#### **Authentication**
```http
POST   /api/register
POST   /api/login
POST   /api/admin/login
```

#### **Stations** (Public Data)
```http
GET    /api/stations              # Get all stations
GET    /api/stations/:id          # Get station by ID
```

#### **Trains** (Public Browse)
```http
GET    /api/trains/all            # Get all available trains
```

---

### 🔒 **Protected Endpoints** (Require Bearer Token)

#### **User Authentication**
```http
POST   /api/logout                # Logout user
GET    /api/user/:id?             # Get user profile
```

#### **Train Search & Management**
```http
GET    /api/trains/search         # Search trains by filters
  Query Params:
  - departure_station: integer (required)
  - arrival_station: integer (required)
  - date: YYYY-MM-DD (required)
  - class_type: string (optional: ekonomi, bisnis, eksekutif)

GET    /api/trains/promo          # Get promotional trains
GET    /api/trains/:id            # Get train details by ID
GET    /api/trains/:id/available-seats?date=YYYY-MM-DD  # Available seats
```

#### **Bookings**
```http
POST   /api/bookings              # Create new booking
  Body: {
    train_id, travel_date, passenger_name,
    passenger_id_number, passenger_dob, passenger_gender,
    seat_number, payment_method
  }

GET    /api/bookings/history      # Get booking history
  Query Params:
  - user_uuid: UUID (optional, admin only)
  - status: string (optional: pending, confirmed, cancelled, paid)

PUT    /api/bookings/:transactionId/status  # Update booking status
  Body: { status: string }
```

#### **Payments**
```http
POST   /api/payments/:id/upload   # Upload payment proof (multipart/form-data)
  Body: payment_proof (file)

POST   /api/payments/midtrans/snap  # Create Midtrans Snap transaction
  Body: { booking_id: integer }
  Returns: { snap_token, snap_url }

POST   /api/payments/midtrans/qris  # Generate QRIS code
  Body: { booking_id: integer }
  Returns: { qr_code: base64_string }

POST   /api/payments/midtrans/webhook  # Midtrans notification (PUBLIC)
  Headers: X-Midtrans-Signature
  Body: Midtrans notification payload
```

#### **Notifications**
```http
GET    /api/notifications         # Get user notifications
  Query Params:
  - unread: boolean (optional)
  - limit: integer (optional, default: 50)

PUT    /api/notifications/:id/read  # Mark notification as read
PUT    /api/notifications/read-all  # Mark all as read
DELETE /api/notifications/:id     # Delete notification
```

---

### 👨‍💼 **Admin Endpoints** (Require Admin Token)

#### **Train Management**
```http
POST   /api/admin/trains          # Create new train
PUT    /api/admin/trains/:id      # Update train
DELETE /api/admin/trains/:id      # Delete train
```

#### **Station Management**
```http
POST   /api/admin/stations        # Create new station
PUT    /api/admin/stations/:id    # Update station
DELETE /api/admin/stations/:id    # Delete station
```

#### **Booking Management**
```http
GET    /api/admin/bookings        # Get all bookings
  Query Params:
  - status: string (optional)
  - date_from: YYYY-MM-DD (optional)
  - date_to: YYYY-MM-DD (optional)

GET    /api/admin/bookings/analytics  # Get booking statistics
  Returns: { total_bookings, total_revenue, status_breakdown }
```

#### **Payment Confirmation**
```http
POST   /api/admin/payments/confirm  # Manually confirm payment
  Body: { booking_id: integer, notes: string }
```

---

### ⚡ **Real-time Endpoints** (SSE Streams)

```http
GET    /api/notifications/stream  # Customer notifications (SSE)
  Headers: Authorization: Bearer <token>
  Stream: text/event-stream
  Events: notification, booking_update

GET    /api/admin/notifications/stream  # Admin notifications (SSE)
  Headers: Authorization: Bearer <admin-token>
  Stream: text/event-stream
  Events: new_booking, payment_pending

GET    /api/bookings/stream       # Booking status updates (SSE)
  Headers: Authorization: Bearer <token>
  Query Params: user_uuid (optional, for filtering)
  Stream: text/event-stream
  Events: booking_confirmed, booking_cancelled
```

---

### 🤖 **Scheduler Endpoints** (Internal, Cloud Scheduler Only)

```http
POST   /api/scheduler/cleanup-bookings  # Cleanup expired bookings
  Authorization: Cloud Scheduler service account
  Returns: { cleaned: count, message: string }
```

---

## 🔑 Authentication

### **JWT Token Format**
Include the token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

### **Token Response** (from login)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### **Token Expiration**
- Default: 24 hours
- Configurable via `JWT_EXPIRES_IN` in `.env`

---

## 🧪 Testing the API

### **Using cURL**

#### Register a new user
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Search trains (with authentication)
```bash
curl -X GET "http://localhost:3000/api/trains/search?departure_station=1&arrival_station=2&date=2025-11-15" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "train_id": 1,
    "travel_date": "2025-11-15",
    "passenger_name": "John Doe",
    "passenger_id_number": "1234567890",
    "passenger_dob": "1990-01-01",
    "passenger_gender": "male",
    "seat_number": "A1",
    "payment_method": "transfer"
  }'
```

#### Test SSE connection
```bash
curl -N -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/notifications/stream
```

### **Using Postman or Thunder Client**
1. Import the API endpoints
2. Set up environment variables for `BASE_URL` and `TOKEN`
3. Use Bearer Token authentication for protected routes

---

## ☁️ Deployment

### **Google Cloud Run Deployment**

#### **Deploy Main API Server**
```bash
cd backend/JavaScript

# Build and deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or manual Docker deployment
docker build -t gcr.io/YOUR_PROJECT_ID/keretaxpress-api .
docker push gcr.io/YOUR_PROJECT_ID/keretaxpress-api

gcloud run deploy keretaxpress-api \
  --image gcr.io/YOUR_PROJECT_ID/keretaxpress-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DB_HOST=your-db-host,DB_PASSWORD=your-db-password,JWT_SECRET=your-jwt-secret"
```

### **Environment Variables for Production**
Set these in Cloud Run:
```bash
gcloud run services update keretaxpress-api \
  --set-env-vars="NODE_ENV=production,\
  DB_HOST=your-production-db-host,\
  MIDTRANS_IS_PRODUCTION=true,\
  CORS_ORIGIN=https://your-frontend-domain.com"
```

### **Using the Deployment Script**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔒 Security Best Practices

### **Implemented Security Features**
- ✅ **JWT Authentication**: Stateless, secure token-based auth
- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **SQL Injection Prevention**: Parameterized queries with pg
- ✅ **CORS Configuration**: Restricted origins
- ✅ **Helmet.js**: Security headers (XSS, clickjacking protection)
- ✅ **Request Validation**: express-validator for input sanitization
- ✅ **Environment Variables**: Sensitive data in `.env`
- ✅ **Midtrans Signature Verification**: Webhook authenticity check

### **Production Checklist**
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Enable `MIDTRANS_IS_PRODUCTION=true`
- [ ] Configure proper `CORS_ORIGIN` for your frontend domain
- [ ] Set up database backups (Supabase automatic backups)
- [ ] Monitor Cloud Run logs for errors
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure rate limiting (optional)

---

## 📊 Performance & Monitoring

### **Database Connection Pooling**
- Configured in `config/database.js`
- Default pool size: 20 connections
- Idle timeout: 30 seconds

### **Cloud Run Monitoring**
```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=keretaxpress-api" --limit 50

# Monitor metrics
gcloud monitoring dashboards create --config-from-file=monitoring-dashboard.json
```

### **Health Check Endpoint**
```bash
# Check if API is running
curl http://localhost:3000/api/stations
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Check `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` in `.env`

#### JWT Token Invalid
```
Error: jwt malformed
```
**Solution**: Ensure token is included in `Authorization: Bearer <token>` header

#### Midtrans Webhook Signature Mismatch
```
Error: Invalid signature
```
**Solution**: Verify `MIDTRANS_SERVER_KEY` matches your Midtrans account

#### SSE Connection Timeout
```
Error: EventSource failed
```
**Solution**: Ensure keepalive is configured, check Cloud Run timeout settings (default 300s)

---

## 📚 Additional Resources

- **[Root README](../../README.md)** - Complete project overview
- **[Frontend README](../../web_version/README.md)** - Next.js frontend documentation
- **[Database Migrations](./migrations/README.md)** - Database schema details
- **[Midtrans Documentation](https://docs.midtrans.com/)** - Payment gateway docs
- **[Supabase Documentation](https://supabase.com/docs)** - Database and storage docs

---

## 📄 License

MIT License - See [LICENSE](../../LICENSE) file for details

---

<div align="center">

**🚂 KeretaXpress Backend - Powering modern train booking**

Built with ❤️ using Node.js + Express.js + PostgreSQL

</div>
