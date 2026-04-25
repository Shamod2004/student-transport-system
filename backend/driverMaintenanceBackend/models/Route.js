const mongoose = require('mongoose');

// Route schema eka define karanna - student transport system eke route data store karanna
const routeSchema = new mongoose.Schema({
    // Bus image URL eka store karanna
    busImageUrl: {
        type: String,
        required: [true, 'Bus image URL ekak danna one'], // Required field ekak
        trim: true
    },
    
    // Bus ID eka unique ekak widiyata store karanna
    busId: {
        type: String,
        required: [true, 'Bus ID ekak danna one'],
        unique: true, // Duplicate bus ID prevent karanna
        trim: true,
        uppercase: true // Bus ID eka capital letters karanna
    },
    
    // Route name eka store karanna
    routeName: {
        type: String,
        required: [true, 'Route name ekak danna one'],
        trim: true
    },
    
    // Bus type eka store karanna (ex: AC, Non-AC, Luxury)
    busType: {
        type: String,
        required: [true, 'Bus type ekak danna one'],
        trim: true
    },
    
    // Route eke status eka store karanna
    status: {
        type: String,
        enum: ['Certified', 'Pending', 'Cancelled'], // Only these values allow karanna
        default: 'Certified' // Default value 'Certified'
    },
    
    // Departure time eka store karanna (HH:MM format)
    departureTime: {
        type: String,
        required: [true, 'Departure time ekak danna one'],
        validate: {
            validator: function(time) {
                // Time format validate karanna (HH:MM)
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
            },
            message: 'Time format eka HH:MM wenna one'
        }
    },
    
    // Arrival time eka store karanna (HH:MM format)
    arrivalTime: {
        type: String,
        required: [true, 'Arrival time ekak danna one'],
        validate: {
            validator: function(time) {
                // Time format validate karanna (HH:MM)
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
            },
            message: 'Time format eka HH:MM wenna one'
        }
    },
    
    // Departure location eka store karanna
    departureLocation: {
        type: String,
        required: [true, 'Departure location ekak danna one'],
        trim: true
    },
    
    // Arrival location eka store karanna
    arrivalLocation: {
        type: String,
        required: [true, 'Arrival location ekak danna one'],
        trim: true
    },
    
    // Departure date eka store karanna
    departureDate: {
        type: Date,
        required: [true, 'Departure date ekak danna one']
    },
    
    // Bus price eka store karanna (per passenger)
    price: {
        type: mongoose.Schema.Types.Decimal128, // Double precision for price
        required: false, // Optional field
        min: [0, 'Price eka 0 ya wadi wenna one'], // Non-negative validation
        validate: {
            validator: function(price) {
                // Numeric validation for Decimal128
                return price === null || price === undefined || !isNaN(price) && price >= 0;
            },
            message: 'Price eka valid number ekak wenna one'
        }
    }
}, {
    // Timestamps auto add karanna
    timestamps: true
});

// Virtual field ekak - duration auto calculate karanna
routeSchema.virtual('duration').get(function() {
    // Departure time aur arrival time difference eka calculate karanna
    const [depHours, depMinutes] = this.departureTime.split(':').map(Number);
    const [arrHours, arrMinutes] = this.arrivalTime.split(':').map(Number);
    
    // Minutes convert karanna
    const depTotalMinutes = depHours * 60 + depMinutes;
    let arrTotalMinutes = arrHours * 60 + arrMinutes;
    
    // Next day wena route walata handle karanna
    if (arrTotalMinutes < depTotalMinutes) {
        arrTotalMinutes += 24 * 60; // 24 hours add karanna
    }
    
    // Duration eka calculate karanna
    const durationMinutes = arrTotalMinutes - depTotalMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    // Duration eka format karanna (ex: "2h 30m")
    return `${hours}h ${minutes}m`;
});

// Pre-save middleware - departure time < arrival time kiyla check karanna
routeSchema.pre('save', function(next) {
    const [depHours, depMinutes] = this.departureTime.split(':').map(Number);
    const [arrHours, arrMinutes] = this.arrivalTime.split(':').map(Number);
    
    const depTotalMinutes = depHours * 60 + depMinutes;
    let arrTotalMinutes = arrHours * 60 + arrMinutes;
    
    // Next day wena route walata handle karanna
    if (arrTotalMinutes < depTotalMinutes) {
        arrTotalMinutes += 24 * 60;
    }
    
    // Departure time arrival time ekata pahala nam error ekak throw karanna
    if (depTotalMinutes >= arrTotalMinutes && this.arrivalTime !== this.departureTime) {
        const error = new Error('Departure time arrival time ekata pahala wenna one');
        return next(error);
    }
    
    next();
});

// JSON convert karanna virtual fields include karanna
routeSchema.set('toJSON', { virtuals: true });
routeSchema.set('toObject', { virtuals: true });

// Index add karanna search efficiency increase karanna
routeSchema.index({ routeName: 1 });
routeSchema.index({ departureLocation: 1 });
routeSchema.index({ arrivalLocation: 1 });
routeSchema.index({ departureDate: -1 }); // Latest first

module.exports = mongoose.model('Route', routeSchema);
