# Student Transport Management System

A full-stack web application for managing student transport seat bookings with an admin dashboard.

## Project Structure

```
student-transport-system/
├── backend/
│   └── bookingBackend/          # Backend API server
│       ├── config/              # Database configuration
│       ├── controllers/         # API controllers
│       ├── models/              # MongoDB models
│       ├── routes/              # API routes
│       ├── server.js            # Entry point
│       ├── package.json         # Backend dependencies
│       └── .env                 # Environment variables
│
└── frontend/
    └── bookingFrontend/         # React admin dashboard
        ├── AdminDashboard.jsx   # Main dashboard component
        ├── AdminDashboard.css   # Dashboard styles
        ├── App.jsx              # Root component
        ├── main.jsx             # Entry point
        ├── index.html           # HTML template
        ├── vite.config.js       # Vite configuration
        ├── package.json         # Frontend dependencies
        └── README.md            # Frontend documentation
```

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- CORS enabled
- dotenv for environment variables

### Frontend
- React 18
- Vite (build tool)
- Axios (HTTP client)
- CSS3

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend/bookingBackend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
PORT=5001
MONGO_URI=your_mongodb_connection_string
```

4. Start the server:
```bash
npm start
# or for development with auto-restart
npm run dev
```

Backend will run on `http://localhost:5001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend/bookingFrontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Endpoints

- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create a new booking
- `PUT /api/bookings/:id` - Update a booking
- `DELETE /api/bookings/:id` - Delete a booking

## Features

- View all seat bookings in a table
- Edit booking details (seat number, status)
- Delete bookings with confirmation
- Real-time data refresh
- Responsive admin dashboard
- Error handling and loading states

## License

ISC

