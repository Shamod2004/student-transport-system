import React, { Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ErrorBoundary from './components/ErrorBoundary'
import RequireRouteAdmin from './components/RequireRouteAdmin'

// Lazy load pages for performance
const Home = React.lazy(() => import('./pages/Home'))
const Journey = React.lazy(() => import('./pages/Journey'))
const About = React.lazy(() => import('./pages/About'))
const FAQ = React.lazy(() => import('./pages/FAQ'))
const Contact = React.lazy(() => import('./pages/Contact'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

// Animated wrapper for pages
const AnimatedPage = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 34, scale: 0.985 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -28, scale: 0.99 }}
    transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
)

// Main App component with animated routes
function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAdminRoute ? <Navbar /> : null}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Main routes with lazy loading and animations */}
          <Route path="/" element={
            <Suspense fallback={<PageLoader />}>
              <AnimatedPage>
                <Home />
              </AnimatedPage>
            </Suspense>
          } />
          <Route path="/journey" element={
            <Suspense fallback={<PageLoader />}>
              <AnimatedPage>
                <ErrorBoundary>
                  <Journey />
                </ErrorBoundary>
              </AnimatedPage>
            </Suspense>
          } />
          <Route path="/about" element={
            <Suspense fallback={<PageLoader />}>
              <AnimatedPage>
                <About />
              </AnimatedPage>
            </Suspense>
          } />
          <Route path="/faq" element={
            <Suspense fallback={<PageLoader />}>
              <AnimatedPage>
                <FAQ />
              </AnimatedPage>
            </Suspense>
          } />
          <Route path="/faqs" element={
            <Suspense fallback={<PageLoader />}>
              <AnimatedPage>
                <FAQ />
              </AnimatedPage>
            </Suspense>
          } />
          <Route path="/contact" element={
            <Suspense fallback={<PageLoader />}>
              <AnimatedPage>
                <Contact />
              </AnimatedPage>
            </Suspense>
          } />
          <Route path="/admin/dashboard" element={
            <RequireRouteAdmin>
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </AnimatedPage>
              </Suspense>
            </RequireRouteAdmin>
          } />
        </Routes>
      </AnimatePresence>
      {!isAdminRoute ? <Footer /> : null}
      <ScrollToTop />
    </div>
  )
}

export default App
