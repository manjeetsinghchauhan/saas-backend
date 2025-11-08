# 🚀 SaaS POC Project - Setup & Startup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Starting the Project](#starting-the-project)
6. [Testing the Setup](#testing-the-setup)
7. [Troubleshooting](#troubleshooting)
8. [Development Workflow](#development-workflow)

---

## 🎯 Prerequisites

### Required Software
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 2GB free space
- **OS**: Windows 10+, macOS 10.14+, or Linux

### Verify Installations
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check PostgreSQL version
psql --version

# Check Git version
git --version
```

---

## 📥 Installation

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd saas-poc
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Or if you prefer yarn
yarn install
```

### 3. Install Global Dependencies (Optional)
```bash
# Install TypeScript globally for development
npm install -g typescript ts-node

# Install nodemon for development (alternative to ts-node-dev)
npm install -g nodemon
```

---

## 🗄️ Database Setup

### 1. PostgreSQL Installation & Configuration

#### On macOS (using Homebrew)
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create a user (if needed)
createuser -s postgres
```

#### On Windows
- Download and install from [PostgreSQL website](https://www.postgresql.org/download/windows/)
- Use the default port (5432)
- Remember the password you set during installation

#### On Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -u postgres psql
```

### 2. Create Database
```bash
# Connect to PostgreSQL as postgres user
psql -U postgres

# Create the database
CREATE DATABASE saas_poc;

# Verify database creation
\l

# Exit PostgreSQL
\q
```

### 3. Database Schema Setup
The project will automatically create tables when you first run it, but you can also manually seed the database:

```bash
# Seed the database with initial data (roles, permissions, etc.)
npm run postbuild
```

---

## ⚙️ Environment Configuration

### 1. Create Environment File
Create a `.env` file in the root directory:

```bash
# Copy the example file (if it exists)
cp .env.example .env

# Or create a new .env file
touch .env
```

### 2. Configure Environment Variables
Add the following to your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_poc
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=4000
HOST=localhost

# Note: PORT and HOST are now configurable via environment variables
# The server will use these values or fall back to defaults (4000/localhost)

# Optional: Logging
LOG_LEVEL=info
NODE_ENV=development
```

### 3. Environment File Security
```bash
# Add .env to .gitignore (if not already there)
echo ".env" >> .gitignore

# Verify .env is ignored
git status
```

---

## 🚀 Starting the Project

### 1. Development Mode (Recommended for Development)
```bash
# Start in development mode with auto-reload
npm run dev
```

This will:
- Start the server on port 4000
- Enable hot-reload on file changes
- Show detailed logs
- Auto-restart on crashes

### 2. Production Mode
```bash
# Build the project first
npm run build

# Start the production server
npm start
```

### 3. Manual Start
```bash
# Using ts-node directly
npx ts-node src/index.ts

# Using node (after building)
node dist/index.js
```

---

## 🧪 Testing the Setup

### 1. Check Server Status
```bash
# Check if port 4000 is in use
lsof -i:4000

# Or check with netstat
netstat -an | grep 4000
```

### 2. Access the Application
- **Main Application**: http://localhost:4000
- **API Documentation**: http://localhost:4000/docs
- **Chat Test Interface**: http://localhost:4000/chat-test
- **Chat Debug Interface**: http://localhost:4000/chat-debug

### 3. Test API Endpoints
```bash
# Test health check (if available)
curl http://localhost:4000/api/v1/health

# Test authentication endpoint
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 4. Add Test User
```bash
# Add a test user to the system
npm run add-test-user
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Port Already in Use
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Or find and kill manually
lsof -i:4000
kill -9 <PID>
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux

# Restart PostgreSQL
brew services restart postgresql       # macOS
sudo systemctl restart postgresql     # Linux
```

#### 3. Permission Denied Errors
```bash
# Fix PostgreSQL permissions
sudo -u postgres psql
ALTER USER postgres PASSWORD 'your_password';
\q
```

#### 4. TypeScript Compilation Errors
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npx tsc --noEmit
```

#### 5. Missing Dependencies
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 🛠️ Development Workflow

### 1. Code Structure
```
src/
├── api/v1/           # API endpoints and controllers
├── config/           # Configuration files
├── models/           # Database models
├── services/         # Business logic services
├── middleware/       # Custom middleware
├── scripts/          # Database scripts and utilities
└── utils/            # Utility functions
```

### 2. Available Scripts
```bash
# Development
npm run dev           # Start development server
npm run build         # Build for production
npm start             # Start production server

# Database
npm run postbuild     # Seed database after build
npm run add-test-user # Add test user

# Custom scripts
node reset-db.js      # Reset database (drop all tables)
```

### 3. Database Management
```bash
# Reset database completely
node reset-db.js

# Seed with initial data
npm run postbuild

# Add test user
npm run add-test-user
```

### 4. API Testing
- **Swagger UI**: http://localhost:4000/docs
- **Postman Collection**: Import from project docs
- **cURL Examples**: See API documentation

---

## 📚 Additional Resources

### Documentation
- [Hapi.js Documentation](https://hapi.dev/)
- [Sequelize Documentation](https://sequelize.org/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Development Tools
- **VS Code Extensions**:
  - TypeScript and JavaScript Language Features
  - PostgreSQL
  - REST Client
  - Thunder Client

### Monitoring & Debugging
- **Logs**: Check console output for detailed logs
- **Database**: Use pgAdmin or DBeaver for database management
- **Network**: Use browser DevTools for API calls
- **Real-time**: Use chat debug interface for Socket.IO debugging

---

## 🎉 Success Checklist

- [ ] Node.js and npm installed
- [ ] PostgreSQL installed and running
- [ ] Database `saas_poc` created
- [ ] Dependencies installed (`npm install`)
- [ ] Environment file configured (`.env`)
- [ ] Server starts without errors (`npm run dev`)
- [ ] Can access http://localhost:4000
- [ ] Swagger docs accessible at `/docs`
- [ ] Database tables created automatically
- [ ] Test user can be added

---

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs** - Look for error messages in the console
2. **Verify prerequisites** - Ensure all required software is installed
3. **Check configuration** - Verify your `.env` file settings
4. **Database connectivity** - Ensure PostgreSQL is running
5. **Port availability** - Check if port 4000 is free
6. **Dependencies** - Try reinstalling with `npm install`

For additional support, check the project's issue tracker or documentation.

---

**Happy Coding! 🚀** 
