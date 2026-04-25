import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaExchangeAlt, FaCalendarAlt, FaBus } from 'react-icons/fa';

const JourneySearchBar = ({ 
  routes, 
  filters, 
  onFilterChange, 
  onSearch, 
  onSwapLocations 
}) => {
  // Extract unique locations for dropdowns
  const getUniqueLocations = (field) => {
    const locations = [...new Set(routes.map(route => route[field]))];
    return locations.filter(Boolean).sort();
  };

  const departureLocations = getUniqueLocations('departureLocation');
  const arrivalLocations = getUniqueLocations('arrivalLocation');

  const busTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'AC', label: 'AC Bus' },
    { value: 'Non-AC', label: 'Non-AC Bus' },
    { value: 'Luxury', label: 'Luxury Bus' },
    { value: 'Semi-Luxury', label: 'Semi-Luxury Bus' },
    { value: 'Normal', label: 'Normal Bus' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl mx-auto px-4"
    >
      {/* Glassmorphism Search Box */}
      <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* From Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-white mb-2">From</label>
            <select
              value={filters.from}
              onChange={(e) => onFilterChange('from', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
            >
              <option value="">Select departure</option>
              {departureLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex items-end justify-center">
            <button
              onClick={onSwapLocations}
              className="bg-white/30 hover:bg-white/40 text-white p-3 rounded-lg transition-all duration-300 hover:scale-110"
              title="Swap locations"
            >
              <FaExchangeAlt className="text-lg" />
            </button>
          </div>

          {/* To Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-white mb-2">To</label>
            <select
              value={filters.to}
              onChange={(e) => onFilterChange('to', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
            >
              <option value="">Select destination</option>
              {arrivalLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="relative">
            <label className="block text-sm font-medium text-white mb-2">Date</label>
            <div className="relative">
              <input
                type="date"
                value={filters.date}
                onChange={(e) => onFilterChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
              />
              <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Bus Type Filter */}
          <div className="relative">
            <label className="block text-sm font-medium text-white mb-2">Bus Type</label>
            <div className="relative">
              <select
                value={filters.busType}
                onChange={(e) => onFilterChange('busType', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all appearance-none"
              >
                {busTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <FaBus className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="mt-6 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSearch}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 hover:shadow-soft hover:shadow-primary-200 flex items-center gap-3 mx-auto"
          >
            <FaSearch className="text-lg" />
            Search Routes
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default JourneySearchBar;
