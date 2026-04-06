// =====================================
// PROTECTED ROUTE COMPONENT
// =====================================

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { authLoading, isAuthenticated, user } = useAuth();

  // If no token → redirect to login
  if (authLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  // If logged in → allow access
  return children;
}
