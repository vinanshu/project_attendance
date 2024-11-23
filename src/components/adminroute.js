import React from "react";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ user, isAdmin, children }) => {
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default AdminRoute;
