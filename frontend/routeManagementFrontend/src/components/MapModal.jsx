import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMapMarkerAlt, FaRoute, FaClock, FaRuler } from 'react-icons/fa';

const MapModal = ({ isOpen, onClose, route }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(true);

  // Google Maps API key should be in environment variables
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Check if API key is available and valid
  const isValidApiKey = GOOGLE_MAPS_API_KEY && 
    GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY_HERE' && 
    GOOGLE_MAPS_API_KEY.length > 10;

  // Log warning only once
  useEffect(() => {
    if (!isValidApiKey) {
      console.warn('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
    }
  }, [isValidApiKey]);

  // Geocode city names to coordinates (Sri Lanka bias)
  const geocodeAddress = (address) => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { 
          address: address + ', Sri Lanka',
          componentRestrictions: { country: 'LK' }
        },
        (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0].geometry.location);
          } else {
            reject(new Error('Geocoding failed: ' + status));
          }
        }
      );
    });
  };

  useEffect(() => {
    if (!isOpen || !route) return;

    // Check if API key is available and valid
    if (!isValidApiKey) {
      setLoading(false);
      return;
    }

    const loadGoogleMaps = async () => {
      try {
        // Load Google Maps script if not already loaded
        if (!window.google || !window.google.maps) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&callback=initGoogleMaps`;
          script.async = true;
          script.defer = true;
          
          window.initGoogleMaps = () => {
            initializeMap();
          };
          
          document.head.appendChild(script);
        } else {
          initializeMap();
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setLoading(false);
      }
    };

    const initializeMap = async () => {
      try {
        // Initialize map centered on Sri Lanka
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: 7.8731, lng: 80.7718 }, // Sri Lanka center
          zoom: 8,
          styles: [
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e9e9e9" }, { lightness: 17 }]
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#f5f5f5" }, { lightness: 20 }]
            }
          ]
        });

        setMap(mapInstance);

        // Initialize directions service and renderer
        const directionsServiceInstance = new window.google.maps.DirectionsService();
        const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
          map: mapInstance,
          polylineOptions: {
            strokeColor: '#3B82F6', // Blue color for route
            strokeWeight: 4,
            strokeOpacity: 0.8
          },
          markerOptions: {
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="#3B82F6"/>
                  <circle cx="16" cy="16" r="6" fill="white"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32)
            }
          }
        });

        setDirectionsService(directionsServiceInstance);
        setDirectionsRenderer(directionsRendererInstance);

        // Calculate and display route
        if (route.departureLocation && route.arrivalLocation) {
          await calculateRoute(directionsServiceInstance, directionsRendererInstance);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setLoading(false);
      }
    };

    const calculateRoute = async (service, renderer) => {
      try {
        // Geocode departure and arrival locations
        const origin = await geocodeAddress(route.departureLocation);
        const destination = await geocodeAddress(route.arrivalLocation);

        // Calculate route
        const result = await new Promise((resolve, reject) => {
          service.route(
            {
              origin: origin,
              destination: destination,
              travelMode: window.google.maps.TravelMode.DRIVING,
              unitSystem: window.google.maps.UnitSystem.METRIC,
              region: 'LK'
            },
            (result, status) => {
              if (status === 'OK') {
                resolve(result);
              } else {
                reject(new Error('Directions request failed: ' + status));
              }
            }
          );
        });

        // Display route on map
        renderer.setDirections(result);

        // Extract distance and duration
        if (result.routes[0] && result.routes[0].legs[0]) {
          const leg = result.routes[0].legs[0];
          setDistance(leg.distance.text);
          setDuration(leg.duration.text);
        }

        // Fit map to show entire route
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        map.fitBounds(bounds);

      } catch (error) {
        console.error('Error calculating route:', error);
      }
    };

    loadGoogleMaps();

    // Cleanup
    return () => {
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps;
      }
    };
  }, [isOpen, route, isValidApiKey]);

  if (!isOpen || !route) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Route Map</h2>
                  <div className="flex items-center gap-2 text-primary-100">
                    <FaMapMarkerAlt className="text-sm" />
                    <span>{route.departureLocation} → {route.arrivalLocation}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Map Container */}
            <div className="relative">
              <div 
                ref={mapRef} 
                className="w-full h-96 bg-gray-100"
                style={{ minHeight: '400px' }}
              />
              
              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}

              {/* API Key Missing Overlay */}
              {!isValidApiKey ? (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Maps API Key Required</h3>
                    <p className="text-gray-600 mb-4">
                      To view the interactive map, please configure your Google Maps API key.
                    </p>
                    <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
                      <p className="font-mono mb-2">Set environment variable:</p>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded">VITE_GOOGLE_MAPS_API_KEY=your_api_key_here</code>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Route Information */}
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Distance */}
                <div className="bg-white rounded-lg p-4 text-center">
                  <FaRuler className="text-primary-600 text-2xl mx-auto mb-2" />
                  <div className="text-sm text-gray-600 mb-1">Distance</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {distance || 'Calculating...'}
                  </div>
                </div>

                {/* Duration */}
                <div className="bg-white rounded-lg p-4 text-center">
                  <FaClock className="text-primary-600 text-2xl mx-auto mb-2" />
                  <div className="text-sm text-gray-600 mb-1">Estimated Duration</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {duration || 'Calculating...'}
                  </div>
                </div>

                {/* Route Type */}
                <div className="bg-white rounded-lg p-4 text-center">
                  <FaRoute className="text-primary-600 text-2xl mx-auto mb-2" />
                  <div className="text-sm text-gray-600 mb-1">Route Type</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {route.busType || 'Standard'}
                  </div>
                </div>
              </div>

              {/* Additional Route Info */}
              <div className="mt-4 bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Route Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-primary-600" />
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{route.departureLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-primary-600" />
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{route.arrivalLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-primary-600" />
                    <span className="text-gray-600">Departure:</span>
                    <span className="font-medium">{route.departureTime || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-primary-600" />
                    <span className="text-gray-600">Arrival:</span>
                    <span className="font-medium">{route.arrivalTime || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-300"
              >
                Close Map
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MapModal;
