import React from 'react';
import { motion } from 'framer-motion';
import SearchBox from '../components/SearchBox';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Fullscreen Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.pexels.com/photos/15942803/pexels-photo-15942803.jpeg')", /*images.unsplash.com/photo-1735455861269-25f2963fe0bd?q=80&w=1025&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D*/
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#0b1220"
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-wide mb-6" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              BOOK NOW
              <br />
              FOR A SEAMLESS JOURNEY
            </h1>

            {/* Subheading */}
            <p className="text-lg text-gray-200 mb-12">
              Effortless travel starts with our trusted service
            </p>

            {/* Modern Search Box */}
            <SearchBox variant="home" />

            {/* Bottom Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-gray-300 text-center mt-8"
            >
              Convenient payments with all major cards and methods.
            </motion.p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
