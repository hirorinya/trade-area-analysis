# Trade Area Analysis - Setup Instructions

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed
- npm or yarn package manager

## Step-by-Step Setup

### 1. Start Database Services
```bash
# Start PostgreSQL with PostGIS
sudo docker-compose up -d

# Verify database is running
sudo docker ps
```

### 2. Start Backend Server
```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

You should see:
```
🚀 Server running on port 8000
📊 Connected to PostgreSQL database
📍 Environment: development
```

### 3. Test Authentication API
```bash
# Run the authentication test script
./test-auth.sh
```

### 4. Start Frontend (Optional)
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

## Manual API Testing

### Health Check
```bash
curl -X GET http://localhost:8000/api/health
```

### Register New User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourpassword123",
    "first_name": "Your",
    "last_name": "Name"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourpassword123"
  }'
```

### Get Profile (Protected)
```bash
# Replace YOUR_TOKEN with the access_token from login response
curl -X GET http://localhost:8000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if database container is running
sudo docker ps

# Check database logs
sudo docker logs trade-area-db

# Restart database
sudo docker-compose restart postgres
```

### Backend Issues
```bash
# Check for TypeScript errors
cd backend && npx tsc --noEmit

# Restart backend server
# In the terminal running npm run dev, press Ctrl+C and run again
npm run dev
```

### Port Conflicts
- Backend runs on port 8000
- Frontend runs on port 5173
- Database runs on port 5432

If ports are in use:
```bash
# Kill processes using the ports
sudo lsof -ti:8000 | xargs kill -9
sudo lsof -ti:5173 | xargs kill -9
```

## Environment Variables

Backend `.env` file should contain:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trade_area_analysis
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

Frontend `.env` file should contain:
```
VITE_API_URL=http://localhost:8000/api
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```