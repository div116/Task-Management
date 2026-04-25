# Trackify — MEAN Stack Task Management Application

A full-featured Task Management application built with the **MEAN Stack** (MongoDB, Express.js, Angular, Node.js) with role-based authorization, JWT authentication, and real-time updates via Socket.io.

---

## Live Demo

**[Open Trackify](https://task-management-delta-wine.vercel.app/)**

## Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | Angular 21 (Standalone Components, Signals)  |
| UI        | Angular Material 21                           |
| Backend   | Node.js + Express.js                         |
| Database  | MongoDB (Mongoose ODM)                        |
| Auth      | JWT (JSON Web Tokens) + bcryptjs              |
| Real-time | Socket.io                                     |

---

## Features

- **User Authentication**: Register, login with JWT tokens
- **Role-based Authorization**: Manager, Team Lead, Employee roles with distinct permissions
- **Task CRUD**: Create, read, update, delete tasks with title, description, status, priority, due date
- **Task Filtering**: Filter by status (pending / in-progress / completed) and priority
- **Role-specific Dashboards**: Different views for each role
- **Real-time Updates**: Task changes broadcast via Socket.io to all connected clients
- **Responsive UI**: Mobile-friendly Angular Material design

---

## Prerequisites

- **Node.js** v18+ (v22 recommended)
- **npm** v9+
- **Angular CLI** v21 (`npm install -g @angular/cli@latest`)
- **MongoDB Atlas** account (or local MongoDB instance)

---

## MongoDB Atlas Setup (Required)

1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a new **free cluster** (M0 Sandbox)
3. Under **Database Access**, create a database user with a username and password
4. Under **Network Access**, add your IP address (or `0.0.0.0/0` for development)
5. Click **Connect** → **Connect your application** → copy the connection string
6. Replace `<username>`, `<password>`, and `<cluster>` in the connection string

---

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Task-Management
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/task-management?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:4200
NODE_ENV=development
```

Start the backend:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be running at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start the development server
ng serve
```

The Angular app will be running at `http://localhost:4200`

---

## Seeding Initial Manager Account

Since public registration creates only Employee accounts, use MongoDB Compass or Atlas Data Explorer to manually create an initial manager user, or use this script:

```bash
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const existing = await User.findOne({ email: 'manager@example.com' });
  if (!existing) {
    await User.create({
      username: 'admin_manager',
      email: 'manager@example.com',
      password: 'Manager@123',
      role: 'manager'
    });
    console.log('Manager created: manager@example.com / Manager@123');
  } else {
    console.log('Manager already exists');
  }
  process.exit(0);
});
"
```

---

## Real-time Updates

The application uses **Socket.io** for real-time task synchronization:

- When any user creates, updates, or deletes a task, all connected clients receive the update instantly
- The Angular frontend connects to Socket.io automatically upon login and disconnects on logout
- Events: `task:created`, `task:updated`, `task:deleted`

---

## Building for Production

```bash
# Backend: Set NODE_ENV=production in .env, then:
npm start

# Frontend:
ng build --configuration=production
# Output: frontend/dist/frontend/
```

---

## Environment Variables Reference

| Variable        | Description                          | Example                              |
|-----------------|--------------------------------------|--------------------------------------|
| `PORT`          | Backend server port                  | `5000`                               |
| `MONGO_URI`     | MongoDB connection string            | `mongodb+srv://...`                  |
| `JWT_SECRET`    | Secret key for JWT signing           | `your_secret_key_here`               |
| `JWT_EXPIRES_IN`| JWT token expiry                     | `24h`                                 |
| `CLIENT_URL`    | Frontend URL (CORS whitelist)        | `http://localhost:4200`              |
| `NODE_ENV`      | Environment mode                     | `development` or `production`        |

A full-stack Task Management Application built using the MEAN stack (MongoDB, Express.js, Angular, Node.js). This application enables users to efficiently manage tasks with role-based access control, secure authentication, and a responsive user interface.
