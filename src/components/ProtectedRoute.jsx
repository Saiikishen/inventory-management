
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />; // Or a dedicated "unauthorized" page
  }

  return <Outlet />;
};

export default ProtectedRoute;
