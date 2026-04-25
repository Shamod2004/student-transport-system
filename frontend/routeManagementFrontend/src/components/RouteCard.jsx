import React from 'react';
import { motion } from 'framer-motion';
import { FaBus, FaMapMarkerAlt, FaClock, FaStar, FaShieldAlt, FaArrowRight } from 'react-icons/fa';

const RouteCard = ({ route, onSelectRoute, onBookNow }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatTime = (time) => {
    if (!time) return 'Not specified';
    return new Date(time).toLocaleTimeString('en-LK', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'certified':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getBusTypeColor = (busType) => {
    switch (busType?.toLowerCase()) {
      case 'luxury':
        return 'bg-purple-100 text-purple-800';
      case 'ac':
        return 'bg-blue-100 text-blue-800';
      case 'normal':
        return 'bg-gray-100 text-gray-800';
      case 'non-ac':
        return 'bg-orange-100 text-orange-800';
      case 'semi-luxury':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        y: -8, 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        scale: 1.02
      }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl"
    >
      {/* Bus Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={route.busImageUrl || 'https://images.unsplash.com/photo-1574360124751-22bd6c2427a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'}
          alt={route.routeName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Status Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(route.status)}`}>
            <FaShieldAlt className="mr-1" />
            {route.status || 'Certified'}
          </span>
          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getBusTypeColor(route.busType)}`}>
            <FaBus className="mr-1" />
            {route.busType || 'AC'}
          </span>
        </div>

        {/* Rating */}
        {route.rating && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
            <FaStar className="text-yellow-500 text-sm" />
            <span className="text-sm font-semibold text-gray-900">{route.rating}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Route Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-1">
          {route.routeName}
        </h3>

        {/* Route Details */}
        <div className="space-y-3 mb-4">
          {/* From → To */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <FaMapMarkerAlt className="text-blue-600" />
              <span className="text-sm font-medium line-clamp-1">{route.departureLocation}</span>
            </div>
            <FaArrowRight className="text-gray-400" />
            <div className="flex items-center gap-2 text-gray-600">
              <FaMapMarkerAlt className="text-blue-600" />
              <span className="text-sm font-medium line-clamp-1">{route.arrivalLocation}</span>
            </div>
          </div>

          {/* Time Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <FaClock className="text-blue-600" />
              <span className="text-sm">{formatTime(route.departureTime)}</span>
            </div>
            <div className="text-xs text-gray-500">to</div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaClock className="text-blue-600" />
              <span className="text-sm">{formatTime(route.arrivalTime)}</span>
            </div>
          </div>

          {/* Duration */}
          {route.duration && (
            <div className="text-sm text-gray-500 text-center">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                <FaClock className="text-xs" />
                {route.duration}
              </span>
            </div>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(route.price || 1350)}
            </div>
            <div className="text-xs text-gray-500">per person</div>
          </div>
          <div className="flex gap-2">
            {/* View Route Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectRoute(route)}
              className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
            >
              <FaArrowRight className="text-sm" />
              View Route
            </motion.button>
            
            {/* Book Now Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onBookNow(route)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:shadow-lg flex items-center gap-2"
            >
              Book Now
              <FaArrowRight className="text-sm" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RouteCard;
