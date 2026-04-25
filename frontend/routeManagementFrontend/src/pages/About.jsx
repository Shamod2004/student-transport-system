import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaBus, FaUsers, FaRoute, FaStar, FaShieldAlt, FaClock, FaAward, FaHandshake, FaGlobe } from 'react-icons/fa';

const About = () => {
  const [counters, setCounters] = useState({
    years: 0,
    routes: 0,
    customers: 0,
    buses: 0
  });

  useEffect(() => {
    const targetValues = {
      years: 15,
      routes: 150,
      customers: 50000,
      buses: 85
    };

    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setCounters({
        years: Math.floor(targetValues.years * progress),
        routes: Math.floor(targetValues.routes * progress),
        customers: Math.floor(targetValues.customers * progress),
        buses: Math.floor(targetValues.buses * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounters(targetValues);
      }
    }, increment);

    return () => clearInterval(timer);
  }, []);

  const milestones = [
    {
      year: '2009',
      title: 'WayGo Founded',
      description: 'Started with just 5 buses serving the Colombo-Kandy route',
      icon: FaBus
    },
    {
      year: '2014',
      title: 'Fleet Expansion',
      description: 'Expanded to 25 buses and introduced luxury AC coaches',
      icon: FaAward
    },
    {
      year: '2018',
      title: 'Digital Transformation',
      description: 'Launched online booking system and mobile app',
      icon: FaGlobe
    },
    {
      year: '2023',
      title: 'National Coverage',
      description: 'Now serving all major cities with 85+ certified buses',
      icon: FaRoute
    }
  ];

  const values = [
    {
      icon: FaShieldAlt,
      title: 'Safety First',
      description: 'We prioritize passenger safety with certified buses and experienced drivers',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: FaClock,
      title: 'Punctuality',
      description: '95% on-time performance with real-time tracking and updates',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: FaHandshake,
      title: 'Customer Service',
      description: '24/7 support with a commitment to excellent customer experience',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: FaStar,
      title: 'Quality',
      description: 'Maintaining highest standards in comfort, cleanliness, and service',
      color: 'from-yellow-500 to-yellow-600'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative h-96 flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1583368269063-334a66df10f4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "transparent",
          minHeight: "400px"
        }}
      >
        {/* Background Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            backgroundBlendMode: "overlay"
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold mb-4">About WayGo</h1>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              Sri Lanka's trusted transportation partner, serving millions of passengers with 
              comfort, safety, and reliability since 2009
            </p>
          </motion.div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Our <span className="text-primary-600">Story</span>
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Founded in 2009 with a vision to revolutionize public transportation in Sri Lanka, 
                  WayGo started as a small fleet of 5 buses serving the Colombo-Kandy route. 
                  Our commitment to quality and customer satisfaction quickly made us the preferred 
                  choice for travelers.
                </p>
                <p>
                  Over the years, we've grown exponentially while maintaining our core values 
                  of safety, punctuality, and exceptional service. Today, we operate 85+ certified 
                  buses across 150+ routes, connecting every major city in Sri Lanka.
                </p>
                <p>
                  Our journey has been marked by continuous innovation - from introducing luxury 
                  AC coaches to launching our state-of-the-art online booking system. We've 
                  embraced technology to make travel more convenient, comfortable, and accessible 
                  for everyone.
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1544623845-7368982c2759?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                alt="WayGo bus fleet"
                className="rounded-2xl shadow-soft-lg"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-soft-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FaAward className="text-primary-600 text-xl" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Award Winning</div>
                    <div className="text-sm text-gray-600">Best Transport Service 2023</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-primary-600">Achievements</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Numbers that reflect our commitment to excellence
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: counters.years, label: 'Years of Service', suffix: '+' },
              { value: counters.routes, label: 'Routes', suffix: '+' },
              { value: counters.customers, label: 'Happy Customers', suffix: '+' },
              { value: counters.buses, label: 'Certified Buses', suffix: '+' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all duration-300">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {stat.value.toLocaleString()}{stat.suffix}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-primary-900 mb-4">Our Mission</h3>
              <p className="text-primary-700 leading-relaxed">
                To provide safe, comfortable, and reliable transportation services that connect 
                communities and enable seamless travel experiences across Sri Lanka. We strive 
                to exceed customer expectations through innovation, quality service, and 
                unwavering commitment to excellence.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-purple-900 mb-4">Our Vision</h3>
              <p className="text-purple-700 leading-relaxed">
                To be Sri Lanka's leading transportation provider, setting the standard for 
                quality, safety, and customer satisfaction. We aim to transform public 
                transportation through technology, sustainability, and passenger-centric services.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-primary-600">Core Values</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all duration-300"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <value.icon className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-primary-600">Journey</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Key milestones in our growth story
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-primary-200"></div>

            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex items-center mb-12 ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-1"></div>
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center z-10">
                  <milestone.icon className="text-white text-xl" />
                </div>
                <div className="flex-1 px-8">
                  <div className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all duration-300">
                    <div className="text-primary-600 font-bold mb-2">{milestone.year}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
