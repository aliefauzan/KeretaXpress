# 🚆 KeretaXpress - Modern Train Booking Platform

<div align="center">

![KeretaXpress](https://img.shields.io/badge/KeretaXpress-Train%20Booking%20Platform-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?style=for-the-badge&logo=nextdotjs)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=nodedotjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue?style=for-the-badge&logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?style=for-the-badge&logo=typescript)

**A complete, production-ready train booking platform with real-time notifications, payment integration, and modern cloud architecture**

[Features](#-key-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Deployment](#-deployment)

</div>

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)

---

## Overview

KeretaXpress is a **modern, full-stack train booking platform** designed for seamless ticket booking experiences. Built with cutting-edge technologies and best practices, it features:

- **Beautiful UI/UX** with Next.js 13+ App Router and Tailwind CSS
- ⚡ **Real-time Updates** via Server-Sent Events (SSE)
- **Payment Integration** with Midtrans (Snap + Core API)
- **Dual Notification System** (Webhook + Admin Manual)
- ☁️ **Cloud-Native Architecture** on Google Cloud Platform
- **Enterprise Security** with JWT authentication
- **Responsive Design** optimized for all devices

---

## ✨ Key Features

### Customer Features
1. **User Authentication** - Secure registration and login with JWT
2. **Train Search** - Advanced search by route, date, and class
3. **Seat Selection** - Interactive seat map with real-time availability
4. **Booking Management** - Create, view, and track bookings
5. **Payment Integration** - Midtrans Snap (e-wallet) + Core API (QRIS)
6. **Booking History** - Complete transaction history with filtering
7. **Real-time Notifications** - Live updates via SSE
8. **Payment Status** - Automatic webhook notifications from Midtrans
9. **Booking Details** - View comprehensive booking information
10. **Payment Confirmation** - Upload payment proof for bank transfer
11. **QR Code Payment** - Generate QRIS for cashless payment
12. **View Notifications** - Real-time notification center

### Admin Features
13. **Admin Login** - Separate admin authentication system
14. **Train Management** - CRUD operations for train schedules
15. **Booking Overview** - Real-time booking dashboard with SSE
16. **Payment Confirmation** - Manual payment verification
17. **Booking Analytics** - Revenue and booking statistics
18. **Station Management** - Manage train stations
19. **Seat Monitoring** - Real-time seat availability tracking
20. **Admin Notifications** - Booking alerts via SSE
21. **User Management** - View and manage customer accounts

### ⚙️ **System Features**
22. **Webhook Notification** - Dual-source notifications (Midtrans + Admin)
23. **Payment Processing** - Automated payment status updates via Midtrans webhook
24. **Cleanup Expired Bookings** - Automated job via Cloud Scheduler

---

## Architecture

### System Architecture

```
+-----------------------------------------------------------------+
|                     FRONTEND (Next.js 15)                       |
|  +---------------+  +--------------+  +---------------------+  |
|  |  Customer UI  |  |   Admin UI   |  |   SSE Connections   |  |
|  +---------------+  +--------------+  +---------------------+  |
+---------------------------|-------------------------------------+
                            | HTTPS / REST / SSE
+---------------------------|-------------------------------------+
|              BACKEND (Node.js + Express.js)                     |
|  +-------------------+  +-------------------+  +---------------+|
|  |  REST API Routes  |  |   SSE Streaming   |  |   Scheduler   |  |
|  |  - Auth           |  |  - Notifications  |  |  - Cleanup    |  |
|  |  - Trains         |  |  - Admin Bookings |  |               |  |
|  |  - Bookings       |  |  - Booking Status |  |               |  |
|  |  - Payments       |  +-------------------+  +---------------+  |
|  +-------------------+                                            |
+---------------------------|-------------------------------------+
                            |
        +-------------------+-------------------+
        |                   |                   |
+-------+--------+  +-------+--------+  +-------+--------+
|   Supabase     |  |    Midtrans    |  |  Cloud         |
|   PostgreSQL   |  |    Payment     |  |  Scheduler     |
|   - Users      |  |    Gateway     |  |  - Cron Jobs   |
|   - Trains     |  |    - Snap API  |  |  - Cleanup     |
|   - Bookings   |  |    - Core API  |  |                |
+----------------+  +----------------+  +----------------+
```

### Real-time Notification Flow

```
+--------------------------------------------------------------+
|                    NOTIFICATION SOURCES                      |
+----------------+---------------------------------+-----------+
                 |                                 |
        +--------+--------+               +--------+--------+
        |     Midtrans    |               |  Admin Manual   |
        |     Webhook     |               |  Confirmation   |
        |  (Automatic)    |               |   (Manual)      |
        +--------+--------+               +--------+--------+
                 |                                 |
                 |         triggered_by:           |
                 |      'midtrans' | 'admin'       |
                 |                                 |
        +--------+---------------------------------+--------+
        |            Notification Controller                |
        |  - Creates notification in database               |
        |  - Triggers SSE event to connected clients        |
        +-----------------------+---------------------------+
                                |
                +---------------+---------------+
                |                               |
        +-------+-------+              +--------+--------+
        |  Customer UI  |              |   Admin UI      |
        |  - Toast      |              |   - Dashboard   |
        |  - Badge      |              |   - Alerts      |
        +---------------+              +-----------------+
```

---

## Tech Stack

### **Frontend (Web)**
- **Framework**: Next.js 15.3.2 (App Router)
- **Language**: TypeScript 5.3.3
- **Styling**: Tailwind CSS 3.4.0
- **State Management**: React Hooks + Context API
- **API Client**: Object-based services with \`apiRequest()\` function
- **Real-time**: SSE via EventSource API (\`useNotifications\` hook)
- **Forms**: React Hook Form
- **Icons**: Heroicons + React Icons

### **Backend**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: JavaScript (ES Modules)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **File Upload**: Multer
- **Real-time**: Server-Sent Events (SSE)
- **Payment**: Midtrans SDK (Snap + Core API)
- **Storage**: Supabase Storage

### **Database**
- **Database**: PostgreSQL (Supabase)
- **Connection**: pg (node-postgres) with connection pooling
- **Tables**: users, admins, stations, trains, bookings, payments, notifications, booking_history
- **Features**: 
  - Polymorphic notifications
  - GIN indexes for JSON queries
  - Transaction support

### **Cloud Infrastructure**
- **Hosting**: Google Cloud Run (serverless containers)
- **Database**: Supabase (managed PostgreSQL)
- **Scheduler**: Google Cloud Scheduler
- **CI/CD**: Google Cloud Build
- **Storage**: Supabase Storage (payment proofs)
- **Containerization**: Docker

### **Payment Integration**
- **Provider**: Midtrans
- **APIs**: 
  - Snap API (e-wallet, virtual account)
  - Core API (QRIS generation)
- **Features**: 
  - Webhook notifications
  - Signature verification
  - Multiple payment methods

---

## Project Structure

\`\`\`
KeretaXpress/
├── web_version/                    # Next.js 15 Frontend (App Router)
│   ├── src/
│   │   ├── app/                    # App Router pages
│   │   │   ├── page.tsx           # Homepage (/)
│   │   │   ├── schedule/          # Train search (/schedule)
│   │   │   ├── seat-selection/    # Seat picker (/seat-selection)
│   │   │   ├── passenger-info/    # Passenger form (/passenger-info)
│   │   │   ├── payment/           # Payment page (/payment)
│   │   │   ├── booking-history/   # Booking history (/booking-history)
│   │   │   ├── admin/             # Admin dashboard (/admin)
│   │   │   ├── login/             # Login page (/login)
│   │   │   └── register/          # Register page (/register)
│   │   ├── components/            # Reusable React components
│   │   ├── lib/                   # API client and utilities
│   │   │   └── api.ts            # Object-based services
│   │   ├── hooks/                 # Custom React hooks
│   │   │   └── useNotifications.ts # SSE + polling hook
│   │   ├── contexts/              # React Context providers
│   │   ├── types/                 # TypeScript definitions
│   │   └── styles/                # Global styles
│   ├── Dockerfile                 # Container config
│   ├── cloudbuild.yaml           # GCP deployment
│   └── package.json              # Dependencies
│
├── backend/JavaScript/            # Node.js + Express.js Backend
│   ├── controllers/              # Request handlers
│   │   ├── authController.js
│   │   ├── trainController.js
│   │   ├── bookingController.js
│   │   ├── paymentController.js
│   │   ├── adminController.js
│   │   ├── stationController.js
│   │   └── notificationController.js
│   ├── routes/                   # API endpoints
│   │   ├── authRoutes.js
│   │   ├── trainRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── stationRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── notificationStreamRoutes.js
│   │   ├── adminStreamRoutes.js
│   │   ├── bookingStreamRoutes.js
│   │   └── schedulerRoutes.js
│   ├── models/                   # Data models
│   ├── middleware/               # Express middleware
│   ├── services/                 # Business logic
│   ├── migrations/               # Database migrations
│   ├── Dockerfile                # Container config
│   ├── cloudbuild-scheduler.yaml # Scheduler deployment
│   └── scheduler-server.js       # Cron job server
│
├── PlantUML_ClassDiagrams.md     # Architecture diagrams
├── PlantUML_UseCaseClassDiagrams.md
├── SequenceDiagram.md
├── Usecase.md
├── Docker-compose.yaml
└── README.md
\`\`\`

---

## Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- PostgreSQL (Supabase account)
- Midtrans Account
- Google Cloud Account (optional, for deployment)

### **Backend Setup**

\`\`\`bash
cd backend/JavaScript
npm install

# Configure .env (see backend/JavaScript/README.md)
cp .env.example .env

# Run migrations
npm run migrate

# Start server
npm run dev  # http://localhost:3000
\`\`\`

### **Frontend Setup**

\`\`\`bash
cd web_version
npm install

# Configure .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > .env.local

# Start development
npm run dev  # http://localhost:3001
\`\`\`

### **Access**
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Admin**: http://localhost:3001/admin

---

## Documentation

### **Architecture & Design**
- [Class Diagrams](./PlantUML_ClassDiagrams.md) - Complete system architecture
- [Use Case Diagrams](./PlantUML_UseCaseClassDiagrams.md) - All 24 use cases
- [Sequence Diagrams](./SequenceDiagram.md) - Interaction flows
- [Use Case Descriptions](./Usecase.md) - Detailed documentation

### **Component Documentation**
- [Backend README](./backend/JavaScript/README.md) - API docs
- [Frontend README](./web_version/README.md) - Component docs
- [Deployment Guide](./web_version/DEPLOYMENT.md) - Production setup

---

## ☁️ Deployment

### **Backend (Google Cloud Run)**
\`\`\`bash
cd backend/JavaScript
gcloud builds submit --config cloudbuild.yaml
gcloud builds submit --config cloudbuild-scheduler.yaml
\`\`\`

### **Frontend (Vercel)**
\`\`\`bash
cd web_version
npm i -g vercel
vercel --prod
\`\`\`

---

## API Reference

### **Authentication**
\`\`\`http
POST   /api/register          # User registration
POST   /api/login             # User login (JWT)
POST   /api/admin/login       # Admin login
GET    /api/user/:id?         # Get user info
\`\`\`

### **Trains**
\`\`\`http
GET    /api/trains/all        # All trains
GET    /api/trains/search     # Search with filters
GET    /api/trains/promo      # Promotional trains
\`\`\`

### **Bookings**
\`\`\`http
POST   /api/bookings          # Create booking
GET    /api/bookings/history  # User history
PUT    /api/bookings/:id/status # Update status
\`\`\`

### **Payments**
\`\`\`http
POST   /api/payments/midtrans/snap # Snap token
POST   /api/payments/midtrans/qris # QRIS code
POST   /api/payments/midtrans/webhook # Webhook
POST   /api/admin/payments/confirm # Manual confirm
\`\`\`

### **Notifications (SSE)**
\`\`\`http
GET    /api/notifications/stream # Customer SSE
GET    /api/admin/notifications/stream # Admin SSE
GET    /api/bookings/stream # Booking updates
\`\`\`

**Authentication**: Bearer token required
\`\`\`http
Authorization: Bearer <jwt-token>
\`\`\`

---

## Notification System

### **Dual-Source Notifications**

1. **Midtrans Webhook (Automatic)**
   - Payment completion triggers webhook
   - Signature verification
   - \`triggered_by='midtrans'\`

2. **Admin Manual Confirmation**
   - Admin confirms payment in dashboard
   - \`triggered_by='admin'\`

Both create identical notification types and broadcast via SSE.

---

## License

MIT License - See [LICENSE](LICENSE) file

---

<div align="center">

**KeretaXpress - Making train travel booking simple, fast, and beautiful**

[![Documentation](https://img.shields.io/badge/Docs-Complete-green?style=for-the-badge)](./PlantUML_ClassDiagrams.md)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>
