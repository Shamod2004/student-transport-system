import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaArrowRight, FaUsers } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SearchBox from '../components/SearchBox';
import routesData from '../data/routes.json';

// Add these imports at the top of the file with your other imports:
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Then keep this block (same place in your code):
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icons for departure and arrival
const departureIcon = L.divIcon({
  html: `<div style="background-color: #10b981; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">D</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  className: 'custom-div-icon'
});

const arrivalIcon = L.divIcon({
  html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">A</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  className: 'custom-div-icon'
});

// Location coordinates for Sri Lankan cities
const coordinates = {
  'Rajagiriya': [6.9021, 79.9236],
  'SLIIT': [6.9147, 79.9718],
  'Borella': [6.9271, 79.8612],
  'Katunayake': [7.0168, 79.9501],
  'Gampaha': [7.0830, 79.9986],
  'Koswatta': [6.9512, 79.9424],
  'JaEla': [6.8486, 79.8859],
  'Panadura': [6.7274, 80.0115],
  'Negombo': [7.2088, 79.8981],
  'Pannipitiya': [6.8228, 80.0907],
  'Bambalapitiya': [6.9504, 80.3523]
};

const Journey = () => {
  const [searchParams] = useSearchParams();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null); // Selected route for filtering
  const [selectedFrom, setSelectedFrom] = useState(''); // NEW: From location state
  const [selectedTo, setSelectedTo] = useState(''); // NEW: To location state
  const [map, setMap] = useState(null);
  const [polylines, setPolylines] = useState([]);
  const [hoveredBus, setHoveredBus] = useState(null);
  const [displayedBuses, setDisplayedBuses] = useState(20);
  const [mapLayers, setMapLayers] = useState([]); // Map layer management
  const cardRefs = useRef({});
  const mapRef = useRef(null); // Map reference for bounds control

  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';
  const bookingAppUrl = import.meta.env.VITE_BOOKING_APP_URL || `${window.location.origin}/booking`;

  const redirectToBooking = (bus) => {
    const bookingUrl = new URL(bookingAppUrl);
    bookingUrl.searchParams.set('from', bus?.departureLocation || '');
    bookingUrl.searchParams.set('to', bus?.arrivalLocation || '');
    bookingUrl.searchParams.set('date', date || '');
    window.location.href = bookingUrl.toString();
  };

  // NEW: Initialize selectedFrom and selectedTo from URL params and handle changes
  useEffect(() => {
    setSelectedFrom(from);
    setSelectedTo(to);
  }, [from, to]);

  // NEW: Reset state when URL params are cleared
  useEffect(() => {
    if (!from && !to) {
      setSelectedFrom('');
      setSelectedTo('');
      setSelectedRoute(null);
    }
  }, [from, to]);

  // Helper functions - moved before useMemo to fix initialization error
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${suffix}`;
  };

  const getBusTypeColor = (type) => {
    // Apply conditional colors for specific bus types
    if (type === 'Non-AC') {
      return 'bg-pink-100 text-pink-800';
    }
    if (type === 'Normal') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (type === 'AC') {
      return 'bg-blue-100 text-blue-800';
    }
    if (type === 'Luxury') {
      return 'bg-purple-100 text-purple-800';
    }
    
    // Default colors for other bus types
    const colors = {
      'Semi-Luxury': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Certified': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Active': 'bg-green-100 text-green-800',
      'Inactive': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSeatsColor = (seats) => {
    if (seats <= 5) return 'bg-red-100 text-red-800';
    if (seats <= 15) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getDurationColor = (duration) => {
    const colors = {
      'Short': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Long': 'bg-red-100 text-red-800'
    };
    return colors[duration] || 'bg-gray-100 text-gray-800';
  };

  const filteredBuses = useMemo(() => {
    if (!Array.isArray(routes)) return [];

    let filtered = routes;

    // NEW: Intelligent From → To filtering
    if (selectedFrom && selectedTo) {
      // Both from and to selected - filter for exact route match
      filtered = filtered.filter(bus => {
        const fromMatch = bus.departureLocation.toLowerCase() === selectedFrom.toLowerCase() ||
                         bus.departureLocation.toLowerCase().includes(selectedFrom.toLowerCase()) ||
                         selectedFrom.toLowerCase().includes(bus.departureLocation.toLowerCase());
        const toMatch = bus.arrivalLocation.toLowerCase() === selectedTo.toLowerCase() ||
                       bus.arrivalLocation.toLowerCase().includes(selectedTo.toLowerCase()) ||
                       selectedTo.toLowerCase().includes(bus.arrivalLocation.toLowerCase());
        return fromMatch && toMatch;
      });
    } else if (selectedFrom) {
      // Only from selected - filter by departure location
      filtered = filtered.filter(bus => 
        bus.departureLocation.toLowerCase() === selectedFrom.toLowerCase() ||
        bus.departureLocation.toLowerCase().includes(selectedFrom.toLowerCase()) ||
        selectedFrom.toLowerCase().includes(bus.departureLocation.toLowerCase())
      );
    } else if (selectedTo) {
      // Only to selected - filter by arrival location
      filtered = filtered.filter(bus => 
        bus.arrivalLocation.toLowerCase() === selectedTo.toLowerCase() ||
        bus.arrivalLocation.toLowerCase().includes(selectedTo.toLowerCase()) ||
        selectedTo.toLowerCase().includes(bus.arrivalLocation.toLowerCase())
      );
    }

    // Apply URL param filters as fallback (for backward compatibility)
    if (!selectedFrom && from) {
      filtered = filtered.filter(bus =>
        bus.departureLocation.toLowerCase() === from.toLowerCase()
      );
    }

    if (!selectedTo && to) {
      filtered = filtered.filter(bus =>
        bus.arrivalLocation.toLowerCase() === to.toLowerCase()
      );
    }

    // Filter by selected route (card click)
    if (selectedRoute) {
      filtered = filtered.filter(bus => 
        bus.routeName === selectedRoute || 
        `${bus.departureLocation} to ${bus.arrivalLocation}` === selectedRoute
      );
    }

    // Limit to displayedBuses (default 20) when no specific filtering
    if (!selectedFrom && !selectedTo && !selectedRoute && filtered.length > displayedBuses) {
      filtered = filtered.slice(0, displayedBuses);
    }

    console.log('Filtered buses:', filtered.length, 'From:', selectedFrom, 'To:', selectedTo, 'Route:', selectedRoute);
    console.log('Loading state:', loading);

    return filtered;
  }, [routes, from, to, date, selectedFrom, selectedTo, selectedRoute, displayedBuses, loading]);

  // Generate route data for map visualization
  const generateRouteData = useMemo(() => {
    const routeData = [];
    const processedRoutes = new Set();
    
    // NEW: Intelligent map filtering based on selection state
    let busesForMap = routes;
    
    if (selectedRoute) {
      // Card click - show only selected route
      busesForMap = filteredBuses;
    } else if (selectedFrom || selectedTo) {
      // From/To selection - show matching routes
      busesForMap = filteredBuses;
    } else {
      // Default state - show all 20 routes
      busesForMap = routes.slice(0, 20);
    }
    
    busesForMap.forEach((bus, index) => {
      const routeKey = `${bus.departureLocation}-${bus.arrivalLocation}`;
      const routeName = bus.routeName || `${bus.departureLocation} to ${bus.arrivalLocation}`;
      
      // Avoid duplicate routes but allow multiple buses for same route
      const uniqueKey = `${routeKey}-${bus.busId}`;
      if (processedRoutes.has(uniqueKey)) return;
      processedRoutes.add(uniqueKey);
      
      const departureCoords = coordinates[bus.departureLocation];
      const arrivalCoords = coordinates[bus.arrivalLocation];
      
      if (departureCoords && arrivalCoords) {
        const isSelected = selectedRoute && (
          bus.routeName === selectedRoute || 
          routeName === selectedRoute
        );
        
        // NEW: Highlight based on From/To selection
        const isHighlighted = (selectedFrom && selectedTo) && (
          (bus.departureLocation.toLowerCase() === selectedFrom.toLowerCase() ||
           bus.departureLocation.toLowerCase().includes(selectedFrom.toLowerCase()) ||
           selectedFrom.toLowerCase().includes(bus.departureLocation.toLowerCase())) &&
          (bus.arrivalLocation.toLowerCase() === selectedTo.toLowerCase() ||
           bus.arrivalLocation.toLowerCase().includes(selectedTo.toLowerCase()) ||
           selectedTo.toLowerCase().includes(bus.arrivalLocation.toLowerCase()))
        );
        
        routeData.push({
          bus,
          routeNumber: index + 1, // Route number for labeling
          routeName,
          departureCoords,
          arrivalCoords,
          polyline: [departureCoords, arrivalCoords],
          color: isSelected ? '#3b82f6' : // Blue for selected route
                 isHighlighted ? '#10b981' : // Green for highlighted routes
                 getStatusColor(bus.status).includes('green') ? '#10b981' : 
                 getStatusColor(bus.status).includes('yellow') ? '#f59e0b' : '#ef4444',
          opacity: (selectedRoute && !isSelected) || ((selectedFrom || selectedTo) && !isHighlighted) ? 0.2 : 0.7, // Dim unselected routes
          weight: isSelected ? 5 : isHighlighted ? 4 : 3, // Thicker lines for selected/highlighted
          isSelected,
          isHighlighted
        });
      }
    });
    
    return routeData;
  }, [routes, filteredBuses, selectedRoute, selectedFrom, selectedTo]);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);

        let data = [];
        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || '';
          const response = await fetch(`${apiBase}/api/routes`);
          const result = await response.json();

          if (result && result.success && result.data && Array.isArray(result.data.routes)) {
            data = result.data.routes;
          } else if (result && result.success && Array.isArray(result.data)) {
            data = result.data;
          }
        } catch (apiError) {
          console.warn('Falling back to local route data:', apiError.message);
        }

        if (!Array.isArray(data) || data.length === 0) {
          if (routesData && routesData.success && routesData.data && routesData.data.routes && Array.isArray(routesData.data.routes)) {
            data = routesData.data.routes;
          } else if (routesData && routesData.success && Array.isArray(routesData.data)) {
            data = routesData.data;
          } else if (routesData && routesData.success && Array.isArray(routesData.routes)) {
            data = routesData.routes;
          } else if (Array.isArray(routesData)) {
            data = routesData;
          } else {
            console.error('JSON data structure:', routesData);
            data = [];
          }
        }

        setRoutes(data);
        console.log('Routes loaded:', data.length);
        console.log('Sample route:', data[0]);
      } catch (error) {
        console.error('Error loading routes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
  }, []);

  // Real-time seat availability updates
  const refreshAvailableSeats = async () => {
    try {
      const updatedRoutes = await Promise.all(
        routes.map(async (route) => {
          try {
            const response = await fetch(
              `http://localhost:5001/api/bookings/seat-summary?routeId=${encodeURIComponent(route._id || route.id || '')}&travelDate=${encodeURIComponent(route.departureDate || '')}&departureDate=${encodeURIComponent(route.departureDate || '')}`
            );

            if (!response.ok) return route;

            const payload = await response.json();
            const bookedCount = payload?.count || 0;
            
            // Use route's totalSeats if available, otherwise use bus capacity from route object,
            // or fallback to 40 (10 rows × 4 columns standard bus layout)
            const totalSeats = route.totalSeats || route.capacity || route.busCapacity || 40;
            const availableSeats = Math.max(0, totalSeats - bookedCount);

            return { ...route, availableSeats };
          } catch (error) {
            console.warn('Failed to fetch seat summary for route:', route._id, error);
            return route;
          }
        })
      );

      setRoutes(updatedRoutes);
    } catch (error) {
      console.warn('Error refreshing seat availability:', error);
    }
  };

  // Set up periodic refresh for available seats
  useEffect(() => {
    if (routes.length === 0) return;

    refreshAvailableSeats();
    const intervalId = setInterval(refreshAvailableSeats, 15000); // Refresh every 15 seconds

    return () => clearInterval(intervalId);
  }, [routes.length]);

  const formatPrice = (price) => {
    return `LKR ${price.toLocaleString()}`;
  };

  const handleMarkerClick = (bus) => {
    setSelectedBus(bus);
    
    // NEW: Select the route for this bus
    const routeName = bus.routeName || `${bus.departureLocation} to ${bus.arrivalLocation}`;
    setSelectedRoute(routeName);
    
    if (cardRefs.current[bus._id]) {
      cardRefs.current[bus._id].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  const handleCardHover = (bus) => {
    setHoveredBus(bus);
  };

  const handleCardLeave = () => {
    setHoveredBus(null);
  };

  // NEW: Handle From location selection
  const handleFromSelect = (fromLocation) => {
    setSelectedFrom(fromLocation);
    // Clear route selection when changing from/to
    setSelectedRoute(null);
  };

  // NEW: Handle To location selection
  const handleToSelect = (toLocation) => {
    setSelectedTo(toLocation);
    // Clear route selection when changing from/to
    setSelectedRoute(null);
  };

  // NEW: Clear From → To selection
  const clearFromToSelection = () => {
    setSelectedFrom('');
    setSelectedTo('');
    setSelectedRoute(null);
  };

  // NEW: Handle route selection
  const handleRouteSelect = (routeName) => {
    if (selectedRoute === routeName) {
      // Clear selection if clicking the same route
      setSelectedRoute(null);
    } else {
      setSelectedRoute(routeName);
    }
  };

  // NEW: Clear route selection
  const clearRouteSelection = () => {
    setSelectedRoute(null);
  };

  // NEW: Fit map to bounds
  const fitMapToBounds = (bounds) => {
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // NEW: Calculate bounds for routes
  const calculateBounds = (routeDataList) => {
    if (!routeDataList || routeDataList.length === 0) return null;
    
    const bounds = L.latLngBounds([]);
    routeDataList.forEach(route => {
      bounds.extend(route.departureCoords);
      bounds.extend(route.arrivalCoords);
    });
    return bounds;
  };

  // NEW: Update map bounds when selection changes
  useEffect(() => {
    if (generateRouteData.length > 0) {
      const bounds = calculateBounds(generateRouteData);
      if (bounds) {
        // Small delay to ensure map is ready
        setTimeout(() => fitMapToBounds(bounds), 100);
      }
    }
  }, [selectedRoute, selectedFrom, selectedTo, generateRouteData]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 lg:w-2/3 p-4">
          <SearchBox variant="journey" />
          

          {(from || to || date) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md p-4 mb-6 mt-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {from && `From: ${from}`}
                    {to && ` → To: ${to}`}
                    {date && ` on ${formatDate(date)}`}
                  </h3>
                </div>
                <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-blue-600">{filteredBuses.length}</span> buses
                  </div>
              </div>
            </motion.div>
          )}

          <div className="mt-16 md:mt-20">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading available routes...</p>
              </div>
            ) : filteredBuses.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FaUsers className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No buses found</h3>
                <p className="text-gray-500">Try adjusting your search criteria or check back later.</p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <p className="text-gray-600">
                    Showing <span className="font-semibold text-blue-600">{filteredBuses.length}</span> buses
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredBuses.slice(0, displayedBuses).map((bus, index) => (
                <motion.div
                  key={bus._id}
                  ref={(el) => cardRefs.current[bus._id] = el}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)" 
                  }}
                  onClick={() => handleCardClick(bus)}
                  onMouseEnter={() => handleCardHover(bus)}
                  onMouseLeave={handleCardLeave}
                  className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer ${
                    selectedBus && selectedBus._id === bus._id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="relative">
                    <img 
                      src={bus.busImageUrl} 
                      alt={bus.routeName}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://picsum.photos/400/200?random=' + bus._id;
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeatsColor(bus.availableSeats || 30)}`}>
                        {bus.availableSeats || 30} seats
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{bus.busId}</h3>
                        <p className="text-sm text-gray-600">{bus.routeName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">{formatPrice(bus.price)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getBusTypeColor(bus.busType)}`}>
                        {bus.busType}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(bus.status)}`}>
                        {bus.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                      <FaCalendarAlt className="text-blue-500" />
                      <span>{formatDate(bus.departureDate)}</span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-blue-500" />
                        <span>{formatTime(bus.departureTime)} - {formatTime(bus.arrivalTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-blue-500" />
                        <span>{bus.departureLocation}</span>
                        <FaArrowRight className="text-gray-400" />
                        <span>{bus.arrivalLocation}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                      <FaUsers className="text-blue-500" />
                      <span>{bus.availableSeats || 30} seats available</span>
                    </div>

                    <button
                      onClick={() => redirectToBooking(bus)}
                      className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <FaUsers className="text-sm" />
                      Book Now
                    </button>
                  </div>
                </motion.div>
                ))}
              </div>
              </>
            )}
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/3 p-4">
          <div className="bg-white rounded-xl shadow-md overflow-hidden h-[calc(100vh-8rem)] sticky top-20">
            {(selectedRoute || (selectedFrom && selectedTo)) && (
              <div className="bg-blue-50 border-b border-blue-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedRoute ? `Selected: ${selectedRoute}` : 
                     selectedFrom && selectedTo ? `${selectedFrom} → ${selectedTo}` : 
                     selectedFrom ? `From: ${selectedFrom}` : `To: ${selectedTo}`}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedRoute(null);
                      setSelectedFrom('');
                      setSelectedTo('');
                    }}
                    className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            <MapContainer
              center={[6.9271, 79.8612]}
              zoom={8}
              style={{ height: (selectedRoute || (selectedFrom && selectedTo)) ? 'calc(100% - 60px)' : '100%', width: '100%', minHeight: '400px' }}
              aria-label="Bus routes map"
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Render all routes with enhanced intelligent highlighting */}
              {generateRouteData.map((route, index) => (
                <div key={`${route.bus._id}-${index}`}>
                  {/* Route polyline with enhanced styling */}
                  <Polyline
                    positions={route.polyline}
                    color={route.color}
                    weight={route.weight}
                    opacity={route.opacity}
                    dashArray={route.isSelected ? "0" : route.isHighlighted ? "0" : "5, 10"}
                  />
                  
                  {/* Route number label */}
                  <div
                    style={{
                      position: 'absolute',
                      background: route.isSelected ? '#3b82f6' : 
                                 route.isHighlighted ? '#10b981' : '#6b7280',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      zIndex: 1000,
                      transform: 'translate(-50%, -50%)',
                      left: '50%',
                      top: '50%'
                    }}
                  >
                    {route.routeNumber}
                  </div>
                  
                  {/* Departure marker */}
                  <Marker
                    position={route.departureCoords}
                    icon={departureIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>Route {route.routeNumber}</strong><br/>
                        <strong>Departure:</strong> {route.bus.departureLocation}<br/>
                        <strong>Bus ID:</strong> {route.bus.busId}<br/>
                        <strong>Time:</strong> {route.bus.departureTime}<br/>
                        <strong>Status:</strong> {route.bus.status}
                        {route.routeName && <><br/><strong>Route:</strong> {route.routeName}</>}
                        {route.isHighlighted && <><br/><strong>✓ Matches Search</strong></>}
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Arrival marker */}
                  <Marker
                    position={route.arrivalCoords}
                    icon={arrivalIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>Route {route.routeNumber}</strong><br/>
                        <strong>Arrival:</strong> {route.bus.arrivalLocation}<br/>
                        <strong>Bus ID:</strong> {route.bus.busId}<br/>
                        <strong>Time:</strong> {route.bus.arrivalTime}<br/>
                        <strong>Status:</strong> {route.bus.status}
                        {route.routeName && <><br/><strong>Route:</strong> {route.routeName}</>}
                        {route.isHighlighted && <><br/><strong>✓ Matches Search</strong></>}
                      </div>
                    </Popup>
                  </Marker>
                </div>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="lg:hidden p-4">
          {(selectedRoute || (selectedFrom && selectedTo)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-t-lg p-3 mb-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  {selectedRoute ? `Selected: ${selectedRoute}` : 
                   selectedFrom && selectedTo ? `${selectedFrom} → ${selectedTo}` : 
                   selectedFrom ? `From: ${selectedFrom}` : `To: ${selectedTo}`}
                </span>
                <button
                  onClick={() => {
                    setSelectedRoute(null);
                    setSelectedFrom('');
                    setSelectedTo('');
                  }}
                  className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-md overflow-hidden h-96">
            <MapContainer
              center={[6.9271, 79.8612]}
              zoom={8}
              style={{ height: '100%', width: '100%', minHeight: '300px' }}
              aria-label="Bus routes map"
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Render all routes with enhanced intelligent highlighting */}
              {generateRouteData.map((route, index) => (
                <div key={`${route.bus._id}-${index}`}>
                  {/* Route polyline with enhanced styling */}
                  <Polyline
                    positions={route.polyline}
                    color={route.color}
                    weight={route.weight}
                    opacity={route.opacity}
                    dashArray={route.isSelected ? "0" : route.isHighlighted ? "0" : "5, 10"}
                  />
                  
                  {/* Departure marker */}
                  <Marker
                    position={route.departureCoords}
                    icon={departureIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>Route {route.routeNumber}</strong><br/>
                        <strong>Departure:</strong> {route.bus.departureLocation}<br/>
                        <strong>Bus ID:</strong> {route.bus.busId}<br/>
                        <strong>Time:</strong> {route.bus.departureTime}
                        {route.isHighlighted && <><br/><strong>✓ Matches Search</strong></>}
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Arrival marker */}
                  <Marker
                    position={route.arrivalCoords}
                    icon={arrivalIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>Route {route.routeNumber}</strong><br/>
                        <strong>Arrival:</strong> {route.bus.arrivalLocation}<br/>
                        <strong>Bus ID:</strong> {route.bus.busId}<br/>
                        <strong>Time:</strong> {route.bus.arrivalTime}
                        {route.isHighlighted && <><br/><strong>✓ Matches Search</strong></>}
                      </div>
                    </Popup>
                  </Marker>
                </div>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journey;
