import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaBus, FaClock, FaMapMarkerAlt, FaCalendar, FaRuler } from 'react-icons/fa';

const RouteModal = ({ isOpen, onClose, route }) => {
  const [loading, setLoading] = useState(false);

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

  const handleBookNow = () => {
    setLoading(true);
    const bookingAppUrl = import.meta.env.VITE_BOOKING_APP_URL || `${window.location.origin}/booking`;
    const bookingUrl = new URL(bookingAppUrl);
    bookingUrl.searchParams.set('from', route?.departureLocation || route?.from || '');
    bookingUrl.searchParams.set('to', route?.arrivalLocation || route?.to || '');

    setTimeout(() => {
      setLoading(false);
      window.location.href = bookingUrl.toString();
    }, 350);
  };

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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Route Details</h2>
                  <p className="text-primary-100">{route.routeName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Route Image */}
              <div className="mb-6">
                <img
                  src={route.busImageUrl || 'https://images.unsplash.com/photo-1574360124751-22bd6c2427a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'}
                  alt={route.routeName}
                  className="w-full h-48 object-cover rounded-xl"
                />
              </div>

              {/* Route Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="text-primary-600 text-xl" />
                    <div>
                      <div className="text-sm text-gray-500">From</div>
                      <div className="font-semibold">{route.from}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="text-primary-600 text-xl" />
                    <div>
                      <div className="text-sm text-gray-500">To</div>
                      <div className="font-semibold">{route.to}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FaCalendar className="text-primary-600 text-xl" />
                    <div>
                      <div className="text-sm text-gray-500">Date</div>
                      <div className="font-semibold">
                        {route.departureDate ? new Date(route.departureDate).toLocaleDateString('en-LK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Flexible'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaClock className="text-primary-600 text-xl" />
                    <div>
                      <div className="text-sm text-gray-500">Departure</div>
                      <div className="font-semibold">{formatTime(route.departureTime)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FaClock className="text-primary-600 text-xl" />
                    <div>
                      <div className="text-sm text-gray-500">Arrival</div>
                      <div className="font-semibold">{formatTime(route.arrivalTime)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FaBus className="text-primary-600 text-xl" />
                    <div>
                      <div className="text-sm text-gray-500">Bus Type</div>
                      <div className="font-semibold">{route.busType || 'AC'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-primary-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <div className="font-semibold text-primary-700">
                    {route.status || 'Certified'}
                  </div>
                </div>
                <div className="bg-primary-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">Price</div>
                  <div className="font-semibold text-primary-700">
                    {formatPrice(route.price || 1350)}
                  </div>
                </div>
                <div className="bg-primary-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">Rating</div>
                  <div className="font-semibold text-primary-700">
                    {route.rating ? `${route.rating} ⭐` : '4.5 ⭐'}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Departure Location:</span>
                    <span className="ml-2 font-medium">{route.departureLocation || route.from}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Arrival Location:</span>
                    <span className="ml-2 font-medium">{route.arrivalLocation || route.to}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Bus ID:</span>
                    <span className="ml-2 font-medium">{route.busId || 'AUTO-ASSIGNED'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">
                      {route.duration || 'Calculated at booking'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleBookNow}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-300 hover:shadow-soft hover:shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    'Book Now'
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RouteModal;