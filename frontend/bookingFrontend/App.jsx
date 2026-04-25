import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import RegistrationManagement from "./pages/RegistrationManagement";
import AdminBookingManagement from "./pages/AdminBookingManagement";
import AdminPaymentManagement from "./pages/AdminPaymentManagement";
import RequireAdminAuth from "./components/RequireAdminAuth";
import PageErrorBoundary from "./components/PageErrorBoundary";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  const showBookingHeader = location.pathname === "/" || location.pathname === "/booking";

  return (
    <>
      {showBookingHeader && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <PageErrorBoundary>
              <Index />
            </PageErrorBoundary>
          }
        />
        <Route
          path="/booking"
          element={
            <PageErrorBoundary>
              <Index />
            </PageErrorBoundary>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/admin/dashboard"
          element={
            <RequireAdminAuth>
              <AdminDashboard />
            </RequireAdminAuth>
          }
        />
        <Route
          path="/admin/students"
          element={
            <RequireAdminAuth>
              <RegistrationManagement />
            </RequireAdminAuth>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <RequireAdminAuth>
              <AdminBookingManagement />
            </RequireAdminAuth>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <RequireAdminAuth>
              <AdminPaymentManagement />
            </RequireAdminAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner position="top-center" closeButton expand visibleToasts={4} offset={20} />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
