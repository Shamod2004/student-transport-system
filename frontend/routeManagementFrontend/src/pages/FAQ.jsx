import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQuestionCircle, FaChevronDown, FaChevronUp, FaBus, FaTicketAlt, FaCreditCard, FaClock, FaShieldAlt, FaUser } from 'react-icons/fa';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Categories', icon: FaQuestionCircle },
    { id: 'booking', name: 'Booking', icon: FaTicketAlt },
    { id: 'payment', name: 'Payment', icon: FaCreditCard },
    { id: 'travel', name: 'Travel', icon: FaBus },
    { id: 'account', name: 'Account', icon: FaUser },
    { id: 'safety', name: 'Safety', icon: FaShieldAlt },
    { id: 'timing', name: 'Timing', icon: FaClock }
  ];

  const faqs = [
    {
      id: 1,
      category: 'booking',
      question: 'How do I book a ticket with WayGo?',
      answer: 'Booking with WayGo is simple! Visit our website or mobile app, select your departure and destination cities, choose your travel date, browse available buses, select your preferred seat, and complete the payment. You\'ll receive a confirmation email with your e-ticket.',
      icon: FaTicketAlt
    },
    {
      id: 2,
      category: 'booking',
      question: 'Can I cancel or reschedule my booking?',
      answer: 'Yes, you can cancel or reschedule your booking up to 2 hours before departure. Cancellation charges may apply based on the time of cancellation. You can manage your bookings through your account on our website or app.',
      icon: FaTicketAlt
    },
    {
      id: 3,
      category: 'payment',
      question: 'What payment methods are accepted?',
      answer: 'We accept various payment methods including credit/debit cards (Visa, Mastercard, American Express), mobile banking, online banking transfers, and digital wallets. All transactions are secure and encrypted.',
      icon: FaCreditCard
    },
    {
      id: 4,
      category: 'payment',
      question: 'Is my payment information secure?',
      answer: 'Absolutely! We use industry-standard SSL encryption to protect your payment information. We are PCI DSS compliant and never store your card details on our servers. Your security is our top priority.',
      icon: FaShieldAlt
    },
    {
      id: 5,
      category: 'travel',
      question: 'What amenities are available on WayGo buses?',
      answer: 'Our luxury buses feature comfortable reclining seats, air conditioning, WiFi, charging ports, entertainment systems, and clean restrooms. AC buses have basic amenities while normal buses provide essential comfort features.',
      icon: FaBus
    },
    {
      id: 6,
      category: 'travel',
      question: 'Can I bring luggage on the bus?',
      answer: 'Yes, each passenger is allowed one piece of luggage (up to 20kg) and one carry-on bag. Additional luggage may incur extra charges. Please ensure your luggage is properly tagged and secured.',
      icon: FaBus
    },
    {
      id: 7,
      category: 'account',
      question: 'How do I create a WayGo account?',
      answer: 'Creating an account is easy! Click on the "Sign Up" button on our website or app, provide your name, email, phone number, and create a password. You\'ll receive a verification email to activate your account.',
      icon: FaUser
    },
    {
      id: 8,
      category: 'account',
      question: 'What are the benefits of having a WayGo account?',
      answer: 'Account holders enjoy faster booking, access to booking history, exclusive discounts, loyalty rewards, and the ability to save favorite routes. You can also manage your profile and preferences easily.',
      icon: FaUser
    },
    {
      id: 9,
      category: 'safety',
      question: 'How does WayGo ensure passenger safety?',
      answer: 'We prioritize safety through regular vehicle maintenance, experienced and certified drivers, GPS tracking, CCTV monitoring, and adherence to all traffic regulations. All buses undergo daily safety checks.',
      icon: FaShieldAlt
    },
    {
      id: 10,
      category: 'safety',
      question: 'What safety measures are in place during COVID-19?',
      answer: 'We follow all health guidelines including regular sanitization, mandatory masks for passengers and staff, temperature checks, reduced capacity for social distancing, and hand sanitizer availability on all buses.',
      icon: FaShieldAlt
    },
    {
      id: 11,
      category: 'timing',
      question: 'How early should I arrive at the boarding point?',
      answer: 'We recommend arriving at least 15-20 minutes before departure. This gives you enough time to locate your bus, show your ticket, and board comfortably. Late arrivals may miss the bus without refund.',
      icon: FaClock
    },
    {
      id: 12,
      category: 'timing',
      question: 'What happens if my bus is delayed?',
      answer: 'In case of delays, we provide real-time updates via SMS and app notifications. For significant delays, we offer alternatives or refunds. You can track your bus location in real-time through our app.',
      icon: FaClock
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Find answers to common questions about WayGo's services
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 pl-12 rounded-2xl bg-white shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder-gray-500"
                />
                <FaQuestionCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-600 text-xl" />
              </div>
            </motion.div>

            {/* Category Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-12"
            >
              <div className="flex flex-wrap gap-3 justify-center">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-primary-600 text-white shadow-soft shadow-primary-200'
                        : 'bg-white text-gray-700 hover:bg-gray-100 shadow-soft'
                    }`}
                  >
                    <category.icon className="text-sm" />
                    {category.name}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFAQs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <FaQuestionCircle className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs Found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search or filter criteria
                  </p>
                </motion.div>
              ) : (
                filteredFAQs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-soft-lg transition-all duration-300">
                      <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <faq.icon className="text-primary-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {faq.question}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {categories.find(c => c.id === faq.category)?.name}
                          </span>
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            {activeIndex === index ? (
                              <FaChevronUp className="text-primary-600 text-sm" />
                            ) : (
                              <FaChevronDown className="text-primary-600 text-sm" />
                            )}
                          </div>
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {activeIndex === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-4">
                              <div className="pl-13 text-gray-600 leading-relaxed">
                                {faq.answer}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Still Need Help Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-16 text-center"
            >
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Still Need Help?
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Can't find what you're looking for? Our customer support team is here to help you 24/7.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                    Contact Support
                  </button>
                  <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors border border-primary-200">
                    Call +94 11 234 5678
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
