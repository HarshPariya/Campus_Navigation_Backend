# 🏫 Campus Navigation System

A comprehensive campus navigation and management platform built with **Next.js 16** (frontend) and **Node.js/Express** (backend). It provides real-time campus navigation, room management, event tracking, and a full suite of campus life tools for students, faculty, and administrators.

---

## ✨ Features

### 🔐 Authentication
- Email/password registration and login
- Google Sign-In (Firebase Authentication)
- JWT-based session management with role-based access (Student, Faculty, Admin)

### 🗺️ Navigation & Rooms
- Interactive campus maps with **Leaflet** integration
- Room search, filtering by building/floor/type
- Real-time room availability and occupancy tracking
- Room booking system with schedule management
- QR code generation for rooms and locations

### 📅 Events & Calendar
- Upcoming events dashboard
- Event creation, registration, and management
- Calendar integration support
- Categories: workshops, seminars, fests, exams

### 👨‍🏫 Faculty Directory
- Faculty profiles with cabin locations
- Real-time availability status
- Office hours and schedule display
- Contact information and department details

### 📢 Announcements & Notifications
- Campus-wide and targeted announcements (by department, year, role)
- Priority levels (low, normal, high, urgent)
- Real-time notifications via **Socket.io**
- Notification bell with unread count

### 🍽️ Cafeteria
- Daily menu display with meal categories (breakfast, lunch, dinner)
- Chef's daily specials
- Online food ordering
- Meal plan management

### 🚌 Transportation
- Campus shuttle routes and schedules
- Stop locations with coordinates
- Real-time vehicle tracking support

### 📚 Academic Tools
- **Courses**: Course catalog, enrollment, and management
- **Attendance**: Digital attendance tracking and marking
- **Grades**: Grade publishing and viewing
- **Study Groups**: Create, join, and manage study groups

### 🔧 Campus Services
- **Maintenance Requests**: Report and track facility issues
- **Lost & Found**: Report lost items, claim found items
- **Emergency Alerts**: Campus emergency reporting and acknowledgment
- **Feedback System**: Submit and view campus facility feedback
- **Campus Directory**: Search for people and departments

### 📊 Admin Dashboard
- Campus analytics and statistics
- User management
- Resource allocation overview

---

## 🛠️ Tech Stack

| Layer        | Technology                                                  |
|--------------|-------------------------------------------------------------|
| **Frontend** | Next.js 16 (Turbopack), React 18, TypeScript, Tailwind CSS |
| **Backend**  | Node.js, Express.js, Socket.io                             |
| **Database** | MongoDB (local or Atlas)                                    |
| **Auth**     | Firebase Auth (Google Sign-In), JWT, bcrypt                 |
| **Maps**     | Leaflet + React-Leaflet                                     |
| **UI**       | Lucide React icons, React Hot Toast                         |
| **PWA**      | Service Worker, Web App Manifest                            |

---

## 📂 Project Structure

```
Campus NAv/
├── backend/                  # Express.js API server
│   ├── config/               # Firebase admin configuration
│   ├── middleware/            # Auth middleware
│   ├── models/               # Mongoose schemas (18 models)
│   │   ├── User.js           # Users with roles (student/faculty/admin)
│   │   ├── Room.js           # Rooms with schedules and facilities
│   │   ├── Event.js          # Campus events
│   │   ├── Faculty.js        # Faculty profiles and availability
│   │   ├── Announcement.js   # Campus announcements
│   │   ├── Course.js         # Academic courses
│   │   ├── Attendance.js     # Attendance records
│   │   ├── Grade.js          # Student grades
│   │   ├── Cafeteria.js      # Menus, orders, meal plans
│   │   ├── Transportation.js # Routes and vehicles
│   │   └── ...               # + 8 more models
│   ├── routes/               # API route handlers (22 route files)
│   ├── seed.js               # Database seeder with sample data
│   ├── server.js             # Express app entry point
│   └── .env                  # Environment variables
│
├── frontend/                 # Next.js 16 application
│   ├── app/                  # App Router pages (25+ routes)
│   │   ├── layout.tsx        # Root layout with AuthProvider
│   │   ├── page.tsx          # Landing page (redirects)
│   │   ├── login/            # Sign in page
│   │   ├── register/         # Registration page
│   │   ├── dashboard/        # Main dashboard with tabs
│   │   ├── rooms/            # Room management
│   │   ├── events/           # Events listing
│   │   ├── faculty/          # Faculty directory
│   │   ├── cafeteria/        # Cafeteria menu & ordering
│   │   ├── transportation/   # Shuttle routes
│   │   └── ...               # + 15 more route directories
│   ├── components/           # Reusable UI components
│   ├── contexts/             # React Context (AuthContext)
│   ├── lib/                  # API client, Firebase config
│   ├── public/               # Static assets, PWA files
│   └── .env.local            # Frontend environment variables
│
└── package.json              # Root scripts for monorepo management
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local instance or Atlas connection string)
- **npm** v9+

### 1. Clone the Repositories

```bash
# Backend
git clone https://github.com/HarshPariya/Campus_Navigation_Backend.git backend

# Frontend
git clone https://github.com/HarshPariya/Campus_Navigation_Frontend.git frontend
```

### 2. Install Dependencies

```bash
# Install all dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure Environment

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campus_navigation
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Firebase Admin SDK (for Google Sign-In)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Firebase Client SDK (for Google Sign-In)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

### 4. Seed the Database

```bash
cd backend
npm run seed
```

This creates sample data including:
- Default admin account: `admin@campus.edu` / `admin123456`
- 8 rooms across 3 buildings
- 4 upcoming events
- 6 resources, 3 announcements, 2 courses, and more

### 5. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev    # Runs on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev    # Runs on http://localhost:3000
```

---

## 📡 API Endpoints

| Module            | Base Path             | Methods                     |
|-------------------|-----------------------|-----------------------------|
| Authentication    | `/api/auth`           | POST login, register, google; GET me |
| Rooms             | `/api/rooms`          | CRUD + availability, booking |
| Events            | `/api/events`         | CRUD + registration         |
| Faculty           | `/api/faculty`        | CRUD + availability status  |
| Users             | `/api/users`          | GET, PUT (profile)          |
| Resources         | `/api/resources`      | CRUD + reserve, status      |
| Announcements     | `/api/announcements`  | CRUD                        |
| Notifications     | `/api/notifications`  | GET, PATCH (read), DELETE   |
| Courses           | `/api/courses`        | CRUD + enroll               |
| Attendance        | `/api/attendance`     | CRUD + mark                 |
| Grades            | `/api/grades`         | CRUD + publish              |
| Study Groups      | `/api/study-groups`   | CRUD + join, leave          |
| Cafeteria         | `/api/cafeteria`      | GET menu, POST/GET orders   |
| Transportation    | `/api/transportation` | GET routes, vehicles        |
| Maintenance       | `/api/maintenance`    | CRUD + assign               |
| Emergency         | `/api/emergency`      | CRUD + acknowledge          |
| Lost & Found      | `/api/lost-found`     | CRUD + claim                |
| Feedback          | `/api/feedback`       | CRUD + helpful              |
| QR Codes          | `/api/qr-codes`       | Generate, scan              |
| Directory         | `/api/directory`      | GET (search)                |
| Analytics         | `/api/analytics`      | GET                         |

---

## 🔑 User Roles

| Role        | Capabilities                                                         |
|-------------|----------------------------------------------------------------------|
| **Student** | View rooms/events, enroll in courses, view grades/attendance, join study groups, order food |
| **Faculty** | All student features + create events, manage attendance, publish grades, update availability |
| **Admin**   | Full access + manage all users, rooms, announcements, view analytics, maintenance assignments |

---

## 🌐 Deployment

### Backend (Render / Railway / VPS)
1. Set environment variables in the deployment platform
2. Set `MONGODB_URI` to your MongoDB Atlas connection string
3. Set `FRONTEND_URL` to your deployed frontend URL
4. Deploy with `npm start`

### Frontend (Vercel / Netlify)
1. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
2. Set `NEXT_PUBLIC_SOCKET_URL` to your deployed backend URL
3. Build command: `npm run build`
4. Output directory: `.next`

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Harsh Pariya** — [GitHub](https://github.com/HarshPariya)
