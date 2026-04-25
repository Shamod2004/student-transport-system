# Student Transport Management System - Frontend Architecture

## Overview

The STMS frontend is now a single application:

1. **bookingFrontend** (Port 8081) - Student booking + admin dashboard

---

## Architecture

### BookingFrontend (Port 8081)

**Purpose**: Student bus seat booking, authentication, and admin management.

**Key Areas**:
- Student booking UI: seat selection, passenger info, checkout
- Student auth: login/signup
- Admin dashboard: student registrations + booking management

**Key Files**:
- `pages/Index.jsx` - Main booking page with seat selection
- `pages/Login.jsx` - Student/admin login entry
- `pages/SignUp.jsx` - Student registration
- `pages/AdminDashboard.jsx` - Admin landing page
- `pages/AdminStudentRegistrations.jsx` - Admin CRUD for students
- `pages/AdminBookingManagement.jsx` - Admin CRUD for bookings
- `components/RequireAdminAuth.jsx` - Admin route protection
- `components/Header.jsx` - Navigation with auth status
- `context/AuthContext.jsx` - Shared auth state
- `components/ui/` - shadcn/UI components

**Port**: `http://localhost:8081`

---

## Authentication Flow

### Student Login

1. User navigates to `http://localhost:8081`
2. User clicks "Login"
3. Credentials are sent to `POST /api/auth/login`
4. On success, auth is stored in localStorage (`stms_auth`)
5. User returns to booking page

### Admin Login

1. User navigates to `http://localhost:8081/login`
2. Admin credentials are detected (email contains "admin" or password is "admin123")
3. Credentials are sent to `POST /api/auth/admin/login`
4. On success, admin auth is stored in localStorage (`stms_auth`)
5. User is routed to `/admin/dashboard`

### Checkout Protection

1. User selects seats on booking page
2. User clicks "Proceed To Checkout"
3. Code checks `isAuthenticated`
4. If not logged in, user is routed to `/login`

---

## Shared Authentication Context

The app uses one localStorage key: `stms_auth`

**Storage Format**:
```javascript
{
  token: "jwt_token_or_session_id",
  user: {
    id: "user_id",
    name: "Student/Admin Name",
    email: "user@domain.com",
    role: "student" | "admin"
  }
}
```

---

## Styling & Design

**Framework**: Tailwind CSS 3.4.17
**UI Components**: shadcn/UI
**Responsive**: Mobile-first design

---

## Development Setup

### Prerequisites
- Node.js 16+
- npm 8+

### Installation

```bash
cd frontend/bookingFrontend
npm install
npm run dev  # Runs on http://localhost:8081
```

### Environment Variables

**BookingFrontend** `.env`:
```
VITE_API_BASE_URL=http://localhost:5001
```

---

## Backend Integration

Frontend talks to `http://localhost:5001`:

### Auth Endpoints
- `POST /api/auth/login` - Student login
- `POST /api/auth/register` - Student registration
- `POST /api/auth/admin/login` - Admin login

### Admin Endpoints
- `GET/POST/PUT/DELETE /api/admin/students`
- `GET/POST/PUT/DELETE /api/admin/bookings`
- `GET /api/admin/bookings/stats`

---

## File Structure

```
frontend/
└── bookingFrontend/
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
    ├── hooks/
    │   ├── use-toast.js
    │   └── use-mobile.jsx
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.ts
```

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Student Login/Signup | ✅ Complete | Backend ready at localhost:5001 |
| Booking UI | ✅ Complete | Seat selection and checkout |
| Admin Dashboard | ✅ Complete | Students + bookings CRUD |
| Auth Protection | ✅ Complete | Admin routes guarded |

---

## Troubleshooting

### Login not persisting after refresh
- Verify localStorage is not cleared by browser settings
- Check localStorage key: `stms_auth`
- Verify `AuthContext.jsx` reads stored auth on mount

### Admin routes redirect to login
- Ensure admin login succeeded
- Verify stored user role is `admin`
- Check `RequireAdminAuth.jsx`

---

## Support

For issues or questions, contact the development team.
