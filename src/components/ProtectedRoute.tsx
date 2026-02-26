import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div className="p-4 text-red-600">Access Denied: You do not have permission to view this page.</div>;
  }

  // Check permissions based on current path
  // Admins have full access, so we skip the permission check for them
  if (user.role !== 'admin' && user.permissions && Array.isArray(user.permissions)) {
    const currentPath = location.pathname;
    const hasPermission = user.permissions.includes('*') || 
                          user.permissions.some((p: string) => currentPath.startsWith(p));
    
    if (!hasPermission) {
      return <div className="p-4 text-red-600">Access Denied: You do not have permission to view this page.</div>;
    }
  }

  return <>{children}</>;
}
