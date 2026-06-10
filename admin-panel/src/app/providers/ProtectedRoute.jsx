// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Cookies from "js-cookie";

const ProtectedRoute = () => {
  const token = Cookies.get("admin_auth_token");
  

  if (!token) {
  
    return <Navigate to="/auth" replace />;
  }


  return <Outlet />;
};

export default ProtectedRoute;