const express = require('express');
const {
    getAllRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    deleteRoute,
    getUniqueLocations,
    getScheduleByDate,
    updateRouteStatus
} = require('../controllers/routeController');

// Router instance eka create karanna
const router = express.Router();

// GET /api/routes - All routes ganna (with filtering, searching, pagination)
// Query parameters: page, limit, search, from, to, startDate, endDate, sortBy, sortOrder
router.get('/', getAllRoutes);

// GET /api/routes/locations - Unique locations ganna filter dropdown walata
router.get('/locations', getUniqueLocations);

// GET /api/routes/schedule - Date base karanna schedule ganna (new feature)
// Query parameter: date (YYYY-MM-DD format)
router.get('/schedule', getScheduleByDate);

// GET /api/routes/:routeName/buses - Get buses for specific route
// Query parameter: routeName
router.get('/:routeName/buses', require('../controllers/routeController').getBusesByRoute);

// GET /api/routes/:id - Specific route eka ganna ID eken
router.get('/:id', getRouteById);

// POST /api/routes - New route eka create karanna
router.post('/', createRoute);

// PUT /api/routes/:id - Existing route eka update karanna
router.put('/:id', updateRoute);

// PUT /api/routes/:id/status - Update route status only
router.put('/:id/status', updateRouteStatus);

// DELETE /api/routes/:id - Route eka delete karanna
router.delete('/:id', deleteRoute);

module.exports = router;
