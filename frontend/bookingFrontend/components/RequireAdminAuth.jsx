import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const RequireAdminAuth = ({ children }) => {
  const { admin, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated || !isAdmin || !admin) {
      navigate("/login");
    }
  }, [isAuthenticated, isAdmin, admin, navigate]);

  if (!isAuthenticated || !isAdmin || !admin) {
    return null;
  }

  return children;
};

export default RequireAdminAuth;
