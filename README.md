# Camera Store Web Application

Full-stack e-commerce application for camera marketplace.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- npm or yarn

### Start Everything

**Windows:**
```bash
FINAL.bat
```

**Manual:**
```bash
# 1. Start database
docker-compose up -d

# 2. Setup database
cd backend
npm install
node setup-database.js
npm run start:dev

# 3. Start frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
my_web/
├── backend/          # NestJS API
├── frontend/         # Next.js App
├── database/         # Database config
├── docker-compose.yml
└── FINAL.bat         # Start everything
```

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env` (or copy from `backend/env.example`):
```env
DATABASE_HOST=localhost
DATABASE_PORT=5440
DATABASE_USER=postgres
DATABASE_PASSWORD=12343
DATABASE_NAME=camera_web

PORT=3001
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Frontend

Frontend automatically connects to backend at `http://localhost:3001/api`

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Database**: localhost:5440

## 🛠️ Troubleshooting

### Database Issues

**Option 1: Use batch script**
```bash
setup-database.bat
```

**Option 2: Use npm script**
```bash
npm run setup
```

**Option 3: Manual**
```bash
cd backend
node setup-database.js
```

### Check Health
```bash
node check-health.js
```

### Reset Everything
```bash
# Stop all
docker-compose down
taskkill /F /IM node.exe

# Restart
FINAL.bat
```

## 📝 Features

- User authentication (JWT)
- Product management
- Order system
- Category management
- Admin dashboard

## 🧪 Development

Backend runs on port 3001, Frontend on port 3000.

TypeORM synchronizes database schema automatically in development.

## 🎯 Default Accounts

- **Admin**: admin@admin.com / 123
