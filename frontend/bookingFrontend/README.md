# Student Transport Booking Frontend

Single React app for student seat booking and admin management.

## Features

- Student login and signup
- Seat selection and checkout flow
- Admin dashboard with student registrations CRUD
- Admin dashboard with booking management CRUD
- Role-based route protection

## Prerequisites

- Node.js (v16 or higher)
- npm
- Backend server running on port 5001

## Installation

```bash
cd frontend/bookingFrontend
npm install
```

## Running the Application

1. Start the backend server (default: http://localhost:5001)
2. Start the frontend:
```bash
npm run dev
```
3. Open `http://localhost:8081`

## Admin Access

- Use an email containing "admin" or password "admin123" on the login page
- You will be redirected to `/admin/dashboard`

## API Endpoints Used

Auth:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/admin/login`

Admin:
- `GET/POST/PUT/DELETE /api/admin/students`
- `GET/POST/PUT/DELETE /api/admin/bookings`
- `GET /api/admin/bookings/stats`

## Project Structure

```
frontend/bookingFrontend/
├── pages/
│   ├── Index.jsx
│   ├── Login.jsx
│   ├── SignUp.jsx
│   ├── AdminDashboard.jsx
│   ├── AdminStudentRegistrations.jsx
│   ├── AdminBookingManagement.jsx
│   └── NotFound.jsx
├── components/
│   ├── Header.jsx
│   ├── BookingSummary.jsx
│   ├── SeatMap.jsx
│   ├── RequireAdminAuth.jsx
│   └── ui/ (shadcn components)
├── context/
│   └── AuthContext.jsx
└── App.jsx
```
