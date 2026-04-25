import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaPaperPlane, FaHeadset, FaBuilding, FaUsers } from 'react-icons/fa';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    subject: ''
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Validation functions
  const validateName = (name) => {
    if (name.length < 2) {
      return 'Name should contain only letters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return 'Name should contain only letters';
    }
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Enter a valid email address';
    }
    return '';
  };

  const validatePhone = (phone) => {
    if (phone.length > 0 && phone.length !== 10) {
      return 'Phone number must be exactly 10 digits';
    }
    return '';
  };

  const validateSubject = (subject) => {
    if (subject.length < 3) {
      return 'Subject should contain only letters';
    }
    if (!/^[a-zA-Z\s]+$/.test(subject)) {
      return 'Subject should contain only letters';
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    let error = '';
    switch (name) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'subject':
        error = validateSubject(value);
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handlePhoneChange = (e) => {
    const { value } = e.target;
    
    // Only allow digits
    const numericValue = value.replace(/\D/g, '');
    
    // Update form data with numeric value
    setFormData(prev => ({
      ...prev,
      phone: numericValue
    }));
    
    // Validate phone number
    const error = validatePhone(numericValue);
    setErrors(prev => ({
      ...prev,
      phone: error
    }));
  };

  const handlePhoneBlur = () => {
    const error = validatePhone(formData.phone);
    setErrors(prev => ({
      ...prev,
      phone: error
    }));
  };

  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      subject: validateSubject(formData.subject)
    };

    setErrors(newErrors);

    // Check if any field has an error
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setErrors({ // Clear all errors on successful submission
        name: '',
        email: '',
        phone: '',
        subject: ''
      });
      setIsSubmitting(false);
      
      // Reset status after 3 seconds
      setTimeout(() => setSubmitStatus(''), 3000);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: FaMapMarkerAlt,
      title: 'Head Office',
      details: ['123 Galle Road, Colombo 03', 'Sri Lanka'],
      color: 'from-red-500 to-red-600'
    },
    {
      icon: FaPhone,
      title: 'Phone Support',
      details: ['+94 11 234 5678', '+94 77 123 4567'],
      color: 'from-green-500 to-green-600'
    },
    {
      icon: FaEnvelope,
      title: 'Email Support',
      details: ['info@waygo.lk', 'support@waygo.lk'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: FaClock,
      title: 'Working Hours',
      details: ['Mon-Fri: 6:00 AM - 10:00 PM', 'Sat-Sun: 7:00 AM - 11:00 PM'],
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const departments = [
    {
      icon: FaHeadset,
      title: 'Customer Support',
      email: 'support@waygo.lk',
      phone: '+94 11 234 5678',
      description: 'For booking issues, refunds, and general inquiries'
    },
    {
      icon: FaBuilding,
      title: 'Corporate Office',
      email: 'corporate@waygo.lk',
      phone: '+94 11 234 5679',
      description: 'For business partnerships and corporate bookings'
    },
    {
      icon: FaUsers,
      title: 'HR Department',
      email: 'hr@waygo.lk',
      phone: '+94 11 234 5680',
      description: 'For career opportunities and employee matters'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        {/* Background Image - NO overlays */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.pexels.com/photos/15614670/pexels-photo-15614670.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "transparent"
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl font-black mb-6 leading-tight" 
                style={{
                  textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)',
                  letterSpacing: '-0.02em',
                  fontWeight: '900'
                }}>
              Get in Touch
            </h1>
            <p className="text-2xl font-medium max-w-4xl mx-auto leading-relaxed" 
               style={{
                 textShadow: '0 3px 8px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)',
                 letterSpacing: '0.01em',
                 lineHeight: '1.6'
               }}>
              We're here to help! Reach out to us for any questions, support, or feedback
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all duration-300"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${info.color} rounded-2xl flex items-center justify-center mb-4 relative shadow-lg hover:shadow-xl transition-all duration-300`} 
                     style={{
                       boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                       background: `linear-gradient(135deg, ${info.color.includes('red') ? '#ef4444' : info.color.includes('green') ? '#10b981' : info.color.includes('blue') ? '#3b82f6' : '#a855f7'} 0%, ${info.color.includes('red') ? '#dc2626' : info.color.includes('green') ? '#059669' : info.color.includes('blue') ? '#2563eb' : '#9333ea'} 100%)`,
                       transform: 'translateZ(0)',
                       willChange: 'transform'
                     }}>
                  <div className="absolute inset-0 rounded-2xl bg-white opacity-20" 
                       style={{
                         background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)'
                       }} />
                  <info.icon className="text-white text-2xl relative z-10 drop-shadow-md" 
                           style={{
                             filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                             transform: 'translateZ(10px)'
                           }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{info.title}</h3>
                <div className="space-y-1">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600 text-sm">{detail}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Send us a <span className="text-primary-600">Message</span>
              </h2>
              
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6"
                >
                  Thank you for your message! We'll get back to you soon.
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={() => setErrors(prev => ({ ...prev, name: validateName(formData.name) }))}
                      required
                      className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'} focus:outline-none focus:border-transparent`}
                      placeholder="Your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={() => setErrors(prev => ({ ...prev, email: validateEmail(formData.email) }))}
                      required
                      className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'} focus:outline-none focus:border-transparent`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      onBlur={handlePhoneBlur}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'} focus:outline-none focus:border-transparent`}
                      placeholder="+94 XX XXX XXXX"
                      maxLength="10"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      onBlur={() => setErrors(prev => ({ ...prev, subject: validateSubject(formData.subject) }))}
                      required
                      className={`w-full px-4 py-3 rounded-lg border ${errors.subject ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'} focus:outline-none focus:border-transparent`}
                      placeholder="How can we help?"
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.subject}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 hover:shadow-soft hover:shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full min-h-[500px] bg-gray-100 rounded-2xl overflow-hidden shadow-soft"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.770123456789!2d79.86124341477065!3d6.927079095007094!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMDAnNTYuNiTiOcKwNTInMjUuOCJF!5e0!3m2!1sen!2slk!4v1234567890!5m2!1sen!2slk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
                title="WayGo Office Location"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Contact Our <span className="text-primary-600">Departments</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Reach out to the right department for faster assistance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <motion.div
                key={dept.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <dept.icon className="text-primary-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{dept.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{dept.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaEnvelope className="text-primary-600" />
                    <span>{dept.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaPhone className="text-primary-600" />
                    <span>{dept.phone}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Contact */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Need Immediate Assistance?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Our customer support team is available 24/7 to help you with any urgent matters
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <FaPhone />
                Call Now: +94 11 234 5678
              </button>
              <button className="bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-400 transition-colors border border-primary-400">
                Start Live Chat
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
