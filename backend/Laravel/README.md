# Train Booking System - Backend API

Laravel-based REST API backend for the Train Booking System application.

## 🚀 Tech Stack

- **Framework**: Laravel 11.x
- **Database**: Supabase PostgreSQL (Cloud-hosted)
- **Authentication**: Laravel Sanctum (Token-based)
- **Architecture**: RESTful API
- **Cloud Platform**: Google Cloud Platform
- **CI/CD**: Google Cloud Build
- **Deployment**: Google Cloud Run (Serverless containers)
- **Environment**: Docker containerized

## 📁 Project Structure

```
tesbackend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── AuthController.php      # Authentication logic
│   │       ├── BookingController.php   # Booking management
│   │       ├── PaymentController.php   # Payment processing
│   │       ├── StationController.php   # Station data
│   │       └── TrainController.php     # Train operations
│   ├── Models/
│   │   ├── User.php
│   │   ├── Train.php
│   │   ├── Station.php
│   │   ├── Booking.php
│   │   └── Payment.php
│   └── Services/                       # Business logic layer
├── database/
│   ├── migrations/                     # Database schema
│   ├── seeders/                        # Sample data
│   └── factories/                      # Model factories
├── routes/
│   ├── api.php                        # API routes definition
│   └── web.php
├── config/                            # Configuration files
├── cloudbuild.yaml                    # Google Cloud Build configuration
├── docker-compose.yml                 # Docker configuration
├── Dockerfile                         # Docker build file for Cloud Run
└── README.md
```

## 🔗 API Endpoints

### Base URL

**Development:**
```
http://localhost:8000/api
```

**Production (Google Cloud Run):**
```
https://your-service-name-hash-uc.a.run.app/api
```

### 🔓 Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | User registration |
| POST | `/login` | User login |
| GET | `/trains/all` | Get all available trains |
| GET | `/stations` | Get all stations |

### 🔒 Protected Endpoints (Authentication Required)

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/logout` | User logout |
| GET | `/user/{id?}` | Get user profile |

#### Train Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trains/search` | Search trains by route and date |
| GET | `/trains/promo` | Get promotional trains |
| GET | `/trains/{id}/available-seats` | Get available seats for specific train |

#### Booking Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create new booking |
| GET | `/bookings/history` | Get user booking history |
| PUT | `/bookings/{transactionId}/status` | Update booking status |

#### Payment Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/{id}/upload` | Upload payment proof |

## 🛠️ Installation & Setup

### Prerequisites
- PHP 8.1+
- Composer
- Supabase account (for PostgreSQL database)
- Google Cloud Platform account (for deployment)
- Node.js (for asset compilation)
- Docker (for containerization)

### Step 1: Clone & Install Dependencies
```powershell
# Navigate to backend directory
cd C:\Users\Alief\coolyeah\ABP\tubes\tes_tubes\tesbackend

# Install PHP dependencies
composer install

# Install Node.js dependencies (if any)
npm install
```

### Step 2: Environment Configuration
```powershell
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

#### Configure Supabase Database
Update your `.env` file with Supabase PostgreSQL credentials:
```env
DB_CONNECTION=pgsql
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-supabase-password
```

### Step 3: Database Setup
```powershell
# Run migrations
php artisan migrate

# Seed sample data (optional)
php artisan db:seed
```

### Step 4: Start Development Server
```powershell
# Start Laravel development server
php artisan serve

# Server will be available at http://localhost:8000
```

## 🐳 Docker Setup

### Local Development with Docker
```powershell
# Build and start containers
docker-compose up -d

# Run migrations in container
docker-compose exec app php artisan migrate

# Seed data
docker-compose exec app php artisan db:seed
```

### Google Cloud Run Deployment
```powershell
# Build for Cloud Run using Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or build locally and deploy
docker build -t gcr.io/your-project-id/train-booking-api .
docker push gcr.io/your-project-id/train-booking-api

# Deploy to Cloud Run
gcloud run deploy train-booking-api \
  --image gcr.io/your-project-id/train-booking-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔧 Configuration

### Environment Variables (.env)

#### Local Development
```env
APP_NAME="Train Booking API"
APP_ENV=local
APP_KEY=base64:your-app-key
APP_DEBUG=true
APP_URL=http://localhost:8000

# Supabase PostgreSQL Configuration
DB_CONNECTION=pgsql
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-supabase-password

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000,localhost:3001
```

#### Production (Cloud Run)
```env
APP_NAME="Train Booking API"
APP_ENV=production
APP_KEY=base64:your-production-app-key
APP_DEBUG=false
APP_URL=https://your-service-name-hash-uc.a.run.app

# Supabase PostgreSQL Configuration
DB_CONNECTION=pgsql
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-supabase-password

# Production CORS domains
SANCTUM_STATEFUL_DOMAINS=your-frontend-domain.com,your-app-domain.com
```

### CORS Configuration
The API is configured to accept requests from frontend applications running on:
- `http://localhost:3000` (Next.js web version)
- `http://localhost:3001` (Alternative port)
- Mobile applications

## 🔐 Authentication

The API uses **Laravel Sanctum** for token-based authentication:

1. **Login/Register**: Returns access token
2. **Protected Routes**: Include token in Authorization header
3. **Token Format**: `Authorization: Bearer {token}`

### Example Authentication Flow
```javascript
// Login
const response = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token } = await response.json();

// Use token for protected routes
const protectedResponse = await fetch('/api/user', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 📊 Database Schema

### Key Models
- **User**: User accounts and authentication
- **Station**: Train stations data
- **Train**: Train information and schedules
- **Booking**: User bookings and reservations
- **Payment**: Payment records and proofs

## 🧪 Testing

```powershell
# Run all tests
php artisan test

# Run specific test suite
php artisan test --testsuite=Feature

# Generate test coverage report
php artisan test --coverage
```

## 📈 Performance & Optimization

- **Database**: Supabase PostgreSQL with connection pooling
- **Caching**: Route and configuration caching enabled
- **Container**: Optimized Docker image for Cloud Run
- **Auto-scaling**: Cloud Run automatic scaling based on traffic
- **CDN**: Google Cloud CDN for static assets
- **Monitoring**: Google Cloud Monitoring and Logging integrated

### Cloud Run Optimization
```powershell
# Configure Cloud Run for optimal performance
gcloud run services update train-booking-api \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=100 \
  --max-instances=10 \
  --region=us-central1
```

### Database Performance
- **Connection Pooling**: Supabase handles connection pooling automatically
- **Indexing**: Optimized queries for stations and trains
- **Query Optimization**: Eloquent ORM with proper relationships

## 🚀 Deployment

### Google Cloud Platform Setup

#### Prerequisites
```powershell
# Install Google Cloud CLI
# Download from: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project your-project-id

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Cloud Build Configuration
The `cloudbuild.yaml` file handles:
- Building Docker image
- Running database migrations
- Deploying to Cloud Run

```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/train-booking-api', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/train-booking-api']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
    - 'run'
    - 'deploy'
    - 'train-booking-api'
    - '--image'
    - 'gcr.io/$PROJECT_ID/train-booking-api'
    - '--region'
    - 'us-central1'
    - '--platform'
    - 'managed'
    - '--allow-unauthenticated'
```

#### Automated Deployment
```powershell
# Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or trigger from Git repository
gcloud builds submit --repo=https://github.com/your-username/your-repo.git
```

### Supabase Database Setup

#### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com/)
2. Create new project
3. Note your database URL and password

#### 2. Configure Connection
```env
DB_CONNECTION=pgsql
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-supabase-password
```

#### 3. Run Migrations
```powershell
# Local migration to Supabase
php artisan migrate --env=production

# Or via Cloud Run (after deployment)
gcloud run services proxy train-booking-api --port=8080
```

### Production Deployment
```powershell
# Set production environment variables in Cloud Run
gcloud run services update train-booking-api \
  --set-env-vars="APP_ENV=production,APP_DEBUG=false" \
  --region=us-central1

# Update with Supabase credentials
gcloud run services update train-booking-api \
  --set-env-vars="DB_HOST=db.your-project-ref.supabase.co,DB_PASSWORD=your-supabase-password" \
  --region=us-central1
```

## 🤝 Development Guidelines

### Code Standards
- Follow PSR-12 coding standards
- Use Laravel naming conventions
- Implement proper error handling
- Write comprehensive tests

### Git Workflow
```powershell
# Create feature branch
git checkout -b feature/new-endpoint

# Make changes and commit
git add .
git commit -m "Add new booking endpoint"

# Push and create PR
git push origin feature/new-endpoint
```

## 📞 API Support

### Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

### Success Responses
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

## 📝 Changelog

### Version 1.0.0
- Initial API implementation
- User authentication system
- Train and station management
- Booking system
- Payment processing

## 📄 License

This project is part of the Train Booking System and is licensed under the [MIT License](https://opensource.org/licenses/MIT).
