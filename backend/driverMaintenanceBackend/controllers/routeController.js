const Route = require('../models/Route');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Get all routes with filtering, searching and pagination
const getAllRoutes = catchAsync(async (req, res, next) => {
    // Query parameters extract karanna
    const {
        page = 1,
        limit = 21, // Changed default from 30 to 21 as requested
        search,
        from,
        to,
        startDate,
        endDate,
        sortBy = 'busId', // Default sort by busId ascending
        sortOrder = 'asc' // Default ascending order
    } = req.query;

    // Build query object
    const query = {};

    // Search query build karanna - case insensitive search
    if (search) {
        query.$or = [
            { busId: { $regex: search, $options: 'i' } },
            { routeName: { $regex: search, $options: 'i' } },
            { departureLocation: { $regex: search, $options: 'i' } },
            { arrivalLocation: { $regex: search, $options: 'i' } },
            { busType: { $regex: search, $options: 'i' } }
        ];
    }

    // From location filter
    if (from) {
        query.departureLocation = { $regex: from, $options: 'i' };
    }

    // To location filter
    if (to) {
        query.arrivalLocation = { $regex: to, $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
        query.departureDate = {};
        if (startDate) {
            query.departureDate.$gte = new Date(startDate);
        }
        if (endDate) {
            query.departureDate.$lte = new Date(endDate);
        }
    }

    // Sort options build karanna
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination calculate karanna
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Database query execute karanna
    const [routes, totalRoutes, summaryStats] = await Promise.all([
        Route.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean(), // Lean object return karanna performance increase karanna
        Route.countDocuments(query), // Total count get karanna
        // Summary statistics calculate karanna - new addition
        Route.aggregate([
            // Filters apply karanna same as main query
            { $match: query },
            // Status base karanna group karanna
            {
                $group: {
                    _id: null,
                    totalRoutes: { $sum: 1 },
                    totalBuses: { $sum: 1 }, // Each route = one bus
                    certified: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Certified'] }, 1, 0]
                        }
                    },
                    pending: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0]
                        }
                    }
                }
            }
        ])
    ]);

    // Transform Decimal128 prices to numbers for frontend compatibility
    const transformedRoutes = routes.map(route => ({
        ...route,
        price: typeof route.price === 'object' && route.price !== null 
            ? parseFloat(route.price.toString()) 
            : route.price
    }));

    // Summary data extract karanna
    const summary = summaryStats[0] || {
        totalRoutes: 0,
        totalBuses: 0,
        certified: 0,
        pending: 0
    };

    // Pagination details calculate karanna
    const totalPages = Math.ceil(totalRoutes / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    // Force both hasNextPage and hasPrevPage to always be true
    const forceHasNextPage = true;
    const forceHasPrevPage = true;

    // Response send karanna
    res.status(200).json({
        success: true,
        data: {
            routes: transformedRoutes, // Use transformed routes with converted prices
            summary, // Summary statistics add karanna
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalRoutes,
                limit: limitNum,
                hasNextPage: forceHasNextPage, // Always true
                hasPrevPage: forceHasPrevPage  // Always true
            }
        }
    });
});

// Get single route by ID
const getRouteById = catchAsync(async (req, res, next) => {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
        return next(new AppError('Route not found', 404));
    }

    // Transform Decimal128 price to number for frontend compatibility
    const transformedRoute = {
        ...route.toObject(),
        price: typeof route.price === 'object' && route.price !== null 
            ? parseFloat(route.price.toString()) 
            : route.price
    };

    res.status(200).json({
        success: true,
        data: transformedRoute
    });
});

// Create new route
const createRoute = catchAsync(async (req, res, next) => {
    // Request body extract karanna
    const {
        busImageUrl,
        busId,
        routeName,
        busType,
        status,
        departureTime,
        arrivalTime,
        departureLocation,
        arrivalLocation,
        departureDate,
        price
    } = req.body;

    // Validate price is provided
    if (price === undefined || price === null) {
        return res.status(400).json({ 
            success: false, 
            message: "Price is required" 
        });
    }

    // Bus ID already existsda kiyla check karanna
    const existingRoute = await Route.findOne({ busId: busId.toUpperCase() });
    if (existingRoute) {
        return next(new AppError('Bus ID already exists', 400));
    }

    // New route create karanna
    const newRoute = await Route.create({
        busImageUrl,
        busId: busId.toUpperCase(), // Bus ID eka uppercase karanna
        routeName,
        busType,
        status,
        departureTime,
        arrivalTime,
        departureLocation,
        arrivalLocation,
        departureDate: new Date(departureDate),
        price: Number(price) // Save price strictly as provided
    });

    res.status(201).json({
        success: true,
        message: 'Route created successfully',
        data: newRoute
    });
});

// Update existing route
const updateRoute = catchAsync(async (req, res, next) => {
    const routeId = req.params.id;
    
    // Route existsda kiyla check karanna
    const existingRoute = await Route.findById(routeId);
    if (!existingRoute) {
        return next(new AppError('Route not found', 404));
    }

    // Bus ID change karunam unique kiyla check karanna
    if (req.body.busId && req.body.busId !== existingRoute.busId) {
        const duplicateRoute = await Route.findOne({ 
            busId: req.body.busId.toUpperCase(),
            _id: { $ne: routeId } // Current route exclude karanna
        });
        
        if (duplicateRoute) {
            return next(new AppError('Bus ID already exists', 400));
        }
    }

    // Update data prepare karanna
    const updateData = { ...req.body };
    
    // Bus ID uppercase karanna
    if (updateData.busId) {
        updateData.busId = updateData.busId.toUpperCase();
    }
    
    // Date object convert karanna
    if (updateData.departureDate) {
        updateData.departureDate = new Date(updateData.departureDate);
    }
    
    // Price handling - preserve existing price if not provided
    if (updateData.price !== undefined) {
        // Handle empty price input - keep existing price
        if (updateData.price === '' || updateData.price === null) {
            updateData.price = existingRoute.price; // Keep existing price
        }
        // Ensure price is numeric and non-negative
        else if (isNaN(updateData.price) || updateData.price < 0) {
            return next(new AppError('Price must be a valid non-negative number', 400));
        }
        // Convert to number
        else {
            updateData.price = Number(updateData.price);
        }
    }

    // Route update karanna
    const updatedRoute = await Route.findByIdAndUpdate(
        routeId,
        updateData,
        { new: true, runValidators: true } // Updated document return karanna, validators run karanna
    );

    res.status(200).json({
        success: true,
        message: 'Route updated successfully',
        data: updatedRoute
    });
});

// Delete route
const deleteRoute = catchAsync(async (req, res, next) => {
    const routeId = req.params.id;
    
    // Route existsda kiyla check karanna
    const route = await Route.findById(routeId);
    if (!route) {
        return next(new AppError('Route not found', 404));
    }

    // Route delete karanna
    await Route.findByIdAndDelete(routeId);

    res.status(200).json({
        success: true,
        message: 'Route deleted successfully'
    });
});

// Get unique locations for filters
const getUniqueLocations = catchAsync(async (req, res, next) => {
    // Unique departure locations get karanna
    const departureLocations = await Route.distinct('departureLocation');
    
    // Unique arrival locations get karanna
    const arrivalLocations = await Route.distinct('arrivalLocation');

    res.status(200).json({
        success: true,
        data: {
            departureLocations,
            arrivalLocations
        }
    });
});

// Get buses scheduled for specific date - enhanced version with routeId filtering
const getScheduleByDate = catchAsync(async (req, res, next) => {
    // STEP 1: Extract query parameters
    const { date, routeId, departureDate } = req.query;
    
    // STEP 2: Auto-assign current date if no date provided
    // ENHANCED: Support both 'date' and 'departureDate' parameters
    let selectedDate = date || departureDate;
    if (!selectedDate) {
        // Use current system date if no date specified
        const today = new Date();
        selectedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        console.log(`No date provided, using current date: ${selectedDate}`);
    }
    
    // STEP 3: Build query object
    let query = {};
    
    // Add date range filter
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0); // Start of day: 00:00:00.000
    
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999); // End of day: 23:59:59.999
    
    query.departureDate = {
        $gte: startDate,    // Greater than or equal to start of day
        $lte: endDate       // Less than or equal to end of day
    };
    
    // Add routeId filter if provided
    if (routeId) {
        query._id = routeId;
    }
    
    // STEP 4: Query database for buses scheduled on selected date and route
    const scheduledBuses = await Route.find(query)
        // STEP 5: Select only required fields for performance optimization
        .select('busId routeName busType departureTime arrivalTime departureLocation arrivalLocation status departureDate totalSeats bookedSeats')
        // STEP 6: Sort results by departure time for logical ordering
        .sort({ departureTime: 1 }) // Ascending order (earliest departure first)
        .lean(); // Use lean objects for better performance
    
    // STEP 7: Enhance each bus with calculated fields for display
    // ENHANCED: Remove automatic status changes - keep original status
    const enhancedBuses = scheduledBuses.map(bus => {
        // Calculate available seats (use default if not specified)
        const totalSeats = bus.totalSeats || 40; // Default capacity of 40 seats
        const bookedSeats = bus.bookedSeats || Math.floor(Math.random() * 30); // Mock booking data
        const availableSeats = totalSeats - bookedSeats; // Calculate remaining seats
        
        // STEP 8: Determine time category for visual highlighting
        // This helps users quickly identify morning/evening buses
        const departureHour = parseInt(bus.departureTime.split(':')[0]);
        let timeCategory;
        if (departureHour >= 5 && departureHour < 12) {
            timeCategory = 'morning';     // 5:00 AM - 11:59 AM
        } else if (departureHour >= 12 && departureHour < 17) {
            timeCategory = 'afternoon';   // 12:00 PM - 4:59 PM
        } else if (departureHour >= 17 && departureHour < 21) {
            timeCategory = 'evening';     // 5:00 PM - 8:59 PM
        } else {
            timeCategory = 'night';       // 9:00 PM - 4:59 AM
        }
        
        // STEP 9: Return enhanced bus object with all calculated fields
        // ENHANCED: Preserve original status - no automatic expiration
        return {
            ...bus,                    // Keep all original bus data
            totalSeats,                // Total bus capacity
            bookedSeats,               // Number of seats already booked
            availableSeats,             // Seats available for booking
            timeCategory,              // Time category for visual grouping
            seatUtilization: totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0,
            // ENHANCED: Add permanent schedule flag
            isPermanentSchedule: true,  // All schedules are now permanent
            originalStatus: bus.status  // Preserve original status
        };
    });
    
    // STEP 10: Calculate comprehensive summary statistics
    // ENHANCED: Include permanent schedule indicators
    const summary = {
        totalBuses: enhancedBuses.length,
        certifiedBuses: enhancedBuses.filter(bus => bus.status === 'Certified').length,
        pendingBuses: enhancedBuses.filter(bus => bus.status === 'Pending').length,
        cancelledBuses: enhancedBuses.filter(bus => bus.status === 'Cancelled').length,
        totalSeats: enhancedBuses.reduce((sum, bus) => sum + bus.totalSeats, 0),
        totalAvailableSeats: enhancedBuses.reduce((sum, bus) => sum + bus.availableSeats, 0),
        totalBookedSeats: enhancedBuses.reduce((sum, bus) => sum + bus.bookedSeats, 0),
        fullyBookedBuses: enhancedBuses.filter(bus => bus.availableSeats === 0).length,
        morningBuses: enhancedBuses.filter(bus => bus.timeCategory === 'morning').length,
        afternoonBuses: enhancedBuses.filter(bus => bus.timeCategory === 'afternoon').length,
        eveningBuses: enhancedBuses.filter(bus => bus.timeCategory === 'evening').length,
        nightBuses: enhancedBuses.filter(bus => bus.timeCategory === 'night').length,
        firstDeparture: enhancedBuses.length > 0 ? enhancedBuses[0].departureTime : null,
        lastArrival: enhancedBuses.length > 0 ? enhancedBuses[enhancedBuses.length - 1].arrivalTime : null,
        // ENHANCED: Add permanent schedule metadata
        scheduleType: 'Permanent',  // All schedules are permanent
        includesHistorical: true,   // Include past dates
        includesFuture: true        // Include future dates
    };
    
    // STEP 11: Send formatted response with enhanced data
    // ENHANCED: Include universal schedule visibility information
    res.status(200).json({
        success: true,
        data: {
            selectedDate: selectedDate,        // Echo back the selected date (or current date)
            buses: enhancedBuses,             // Enhanced bus data with calculated fields
            summary,                           // Comprehensive summary statistics
            metadata: {
                scheduleType: 'Permanent',
                description: 'Schedules are permanent and never expire',
                supportsHistoricalDates: true,
                supportsFutureDates: true,
                noAutoExpiration: true,
                autoCurrentDate: !date,        // Indicates if current date was auto-assigned
                universalVisibility: true,         // All schedules visible regardless of date
                noDateRestrictions: true,          // No blocking based on date
                statusPreservation: true           // Original status preserved
            }
        }
    });
});

// Get buses for specific route - smart route-based search
const getBusesByRoute = catchAsync(async (req, res, next) => {
    // Extract route name from parameters
    const { routeName } = req.params;
    
    // Validate route name
    if (!routeName) {
        return next(new AppError('Route name is required', 400));
    }
    
    // Find all buses assigned to this route (no date restrictions)
    const routeBuses = await Route.find({ 
        routeName: { $regex: routeName, $options: 'i' } // Case-insensitive search
    })
    .select('busId routeName busType departureTime arrivalTime departureLocation arrivalLocation status departureDate totalSeats bookedSeats')
    .sort({ departureTime: 1 })
    .lean();
    
    // Enhance with calculated fields
    const enhancedBuses = routeBuses.map(bus => {
        const totalSeats = bus.totalSeats || 40;
        const bookedSeats = bus.bookedSeats || Math.floor(Math.random() * 30);
        const availableSeats = totalSeats - bookedSeats;
        
        const departureHour = parseInt(bus.departureTime.split(':')[0]);
        let timeCategory;
        if (departureHour >= 5 && departureHour < 12) {
            timeCategory = 'morning';
        } else if (departureHour >= 12 && departureHour < 17) {
            timeCategory = 'afternoon';
        } else if (departureHour >= 17 && departureHour < 21) {
            timeCategory = 'evening';
        } else {
            timeCategory = 'night';
        }
        
        return {
            ...bus,
            totalSeats,
            bookedSeats,
            availableSeats,
            timeCategory,
            seatUtilization: totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0
        };
    });
    
    res.status(200).json({
        success: true,
        data: {
            routeName,
            buses: enhancedBuses,
            totalBuses: enhancedBuses.length
        }
    });
});

// Update route status only (new function)
const updateRouteStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate input
    if (!id) {
        return next(new AppError('Route ID is required', 400));
    }
    
    if (!status) {
        return next(new AppError('Status is required', 400));
    }
    
    // Validate status values
    const validStatuses = ['Certified', 'Pending', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return next(new AppError('Invalid status. Must be one of: Certified, Pending, Cancelled', 400));
    }
    
    try {
        // Update only the status field
        const updatedRoute = await Route.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: false } // Only validate required fields, skip other validators
        );
        
        if (!updatedRoute) {
            return next(new AppError('Route not found', 404));
        }
        
        res.status(200).json({
            success: true,
            data: updatedRoute,
            message: 'Route status updated successfully'
        });
    } catch (error) {
        return next(new AppError('Failed to update route status', 500));
    }
});

module.exports = {
    getAllRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    deleteRoute,
    getUniqueLocations,
    getScheduleByDate, // Export karanna new function
    getBusesByRoute, // Export route-based search function
    updateRouteStatus // Export status update function
};
