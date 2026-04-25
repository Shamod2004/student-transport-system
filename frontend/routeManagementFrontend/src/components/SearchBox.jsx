import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaCalendarAlt, FaExchangeAlt, FaSearch, FaSpinner } from 'react-icons/fa';

const SearchBox = ({ variant = 'home' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Form states
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [date, setDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  
  // Dropdown states
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromSearchTerm, setFromSearchTerm] = useState('');
  const [toSearchTerm, setToSearchTerm] = useState('');
  
  // Validation
  const [validationError, setValidationError] = useState('');
  
  const dropdownRef = useRef(null);

  // Fetch routes from API
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${apiBase}/api/routes`);
        const result = await response.json();
        
        // Extract data from API response
        let data = [];
        if (result && result.success && result.data && result.data.routes && Array.isArray(result.data.routes)) {
          data = result.data.routes;
        } else if (result && result.success && Array.isArray(result.data)) {
          data = result.data;
        } else if (Array.isArray(result)) {
          data = result;
        } else {
          console.error('API response structure:', result);
          data = [];
        }
        
        setRoutes(data);
      } catch (error) {
        console.error('Error fetching routes:', error);
        // Ensure routes is always an array
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  // Extract unique locations
  const uniqueDepartureLocations = useMemo(() => {
    if (!Array.isArray(routes)) return [];
    const locations = [...new Set(routes.map(route => route.departureLocation))];
    return locations.filter(Boolean).sort();
  }, [routes]);

  const uniqueArrivalLocations = useMemo(() => {
    if (!Array.isArray(routes)) return [];
    const locations = [...new Set(routes.map(route => route.arrivalLocation))];
    return locations.filter(Boolean).sort();
  }, [routes]);

  // Filter locations based on search terms
  const filteredFromLocations = useMemo(() => {
    return uniqueDepartureLocations.filter(location =>
      location.toLowerCase().includes(fromSearchTerm.toLowerCase())
    );
  }, [uniqueDepartureLocations, fromSearchTerm]);

  const filteredToLocations = useMemo(() => {
    return uniqueArrivalLocations.filter(location =>
      location.toLowerCase().includes(toSearchTerm.toLowerCase())
    );
  }, [uniqueArrivalLocations, toSearchTerm]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFromDropdown(false);
        setShowToDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Swap locations
  const handleSwap = () => {
    const tempFrom = from;
    setFrom(to);
    setTo(tempFrom);
    setValidationError('');
  };

  // Handle search
  const handleSearch = async () => {
    // Validation
    if (!from || !to || !date) {
      setValidationError('Please fill in all fields');
      return;
    }

    if (from === to) {
      setValidationError('From and To locations cannot be the same');
      return;
    }

    setValidationError('');
    setSearchLoading(true);

    // Navigate to journey page with query parameters
    const params = new URLSearchParams({
      from,
      to,
      date: date
    });

    navigate(`/journey?${params.toString()}`);

    // Reset loading after navigation
    setTimeout(() => setSearchLoading(false), 1000);
  };

  // Handle location selection
  const handleFromSelect = (location) => {
    setFrom(location);
    setShowFromDropdown(false);
    setFromSearchTerm('');
    setValidationError('');
  };

  const handleToSelect = (location) => {
    setTo(location);
    setShowToDropdown(false);
    setToSearchTerm('');
    setValidationError('');
  };

  // Check if search button should be disabled
  const isSearchDisabled = !from || !to || !date || searchLoading;

  return (
    <div className={`${variant === 'home' ? 'max-w-4xl' : 'max-w-5xl'} mx-auto px-4`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 w-full bg-white/30 border border-white/20 rounded-2xl shadow-2xl p-6"
        ref={dropdownRef}
      >
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
          {/* From Input */}
          <div className="relative flex-1 min-w-0 w-full">
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
              <input
                type="text"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setFromSearchTerm(e.target.value);
                  setShowFromDropdown(true);
                  setValidationError('');
                }}
                onFocus={() => setShowFromDropdown(true)}
                placeholder="From"
                className="w-full pl-10 pr-4 h-12 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-800"
              />
            </div>
            
            {/* From Dropdown */}
            <AnimatePresence>
              {showFromDropdown && filteredFromLocations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 max-h-60 overflow-y-auto z-[9999]"
                  style={{ 
                    scrollbarWidth: 'thin', 
                    scrollbarColor: '#cbd5e1 #f1f5f9'
                  }}
                >
                  {filteredFromLocations.map((location, index) => (
                    <div
                      key={index}
                      onClick={() => handleFromSelect(location)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-200 flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <FaMapMarkerAlt className="text-blue-500 flex-shrink-0" />
                      <span className="text-gray-800">{location}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Swap Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleSwap}
              className="bg-white/30 hover:bg-white/40 text-white p-3 rounded-xl transition-all duration-300 hover:scale-110"
              title="Swap locations"
            >
              <FaExchangeAlt className="text-lg" />
            </button>
          </div>

          {/* To Input */}
          <div className="relative flex-1 min-w-0 w-full">
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
              <input
                type="text"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setToSearchTerm(e.target.value);
                  setShowToDropdown(true);
                  setValidationError('');
                }}
                onFocus={() => setShowToDropdown(true)}
                placeholder="To"
                className="w-full pl-10 pr-4 h-12 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-800"
              />
            </div>
            
            {/* To Dropdown */}
            <AnimatePresence>
              {showToDropdown && filteredToLocations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 max-h-60 overflow-y-auto z-[9999]"
                  style={{ 
                    scrollbarWidth: 'thin', 
                    scrollbarColor: '#cbd5e1 #f1f5f9'
                  }}
                >
                  {filteredToLocations.map((location, index) => (
                    <div
                      key={index}
                      onClick={() => handleToSelect(location)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-200 flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <FaMapMarkerAlt className="text-blue-500 flex-shrink-0" />
                      <span className="text-gray-800">{location}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Date Input */}
          <div className="relative flex-1 min-w-0 w-full">
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 h-12 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-800"
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearchDisabled}
            className={`h-12 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 whitespace-nowrap flex-shrink-0 relative z-50 cursor-pointer ${
              isSearchDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'
            }`}
          >
            {searchLoading ? (
              <FaSpinner className="animate-spin text-lg" />
            ) : (
              <FaSearch className="text-lg" />
            )}
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Validation Error */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 text-center text-red-300 text-sm"
            >
              {validationError}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SearchBox;
