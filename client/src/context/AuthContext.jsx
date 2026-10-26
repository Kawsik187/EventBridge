import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
        try {
          // Revalidate user and permissions with server to prevent stale browser roles
          const freshUser = await authService.getMe();
          if (freshUser) {
            const updated = { ...storedUser, ...freshUser };
            localStorage.setItem('eventbridge_user', JSON.stringify(updated));
            setUser(updated);
          }
        } catch (err) {
          // If server reports unauthorized, invalid token, or deactivated, reset session safely
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            authService.logout();
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data);
    return data;
  };

  const registerHost = async (hostData) => {
    const data = await authService.registerHost(hostData);
    setUser(data);
    return data;
  };

  const googleLogin = async (credentialData) => {
    const data = await authService.googleLogin(credentialData);
    setUser(data);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (data) => {
    const updated = await authService.updateProfile(data);
    setUser(updated);
    return updated;
  };

  const isHostApproved =
    user?.isHostApproved === true ||
    user?.hostDetails?.isHostApproved === true ||
    user?.role === 'admin' ||
    user?.role === 'super_admin';

  const isCollegeAdmin = user?.role === 'college_admin';

  const isEaswariStudent = (() => {
    if (!user) return false;
    const email = (user.email || '').toLowerCase().trim();
    const college = (user.collegeName || user.college || user.academicProfile?.universityName || '').toLowerCase().trim();
    return email.endsWith('@srmeaswari.ac.in') || email.includes('srmeaswari.ac.in') || college.includes('easwari') || /\beec\b/i.test(college);
  })();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        registerHost,
        googleLogin,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isStudent: user?.role === 'student' || user?.role === 'participant',
        isCollegeAdmin,
        isHostApproved,
        isEaswariStudent,
        isOrganizer:
          (user?.role === 'organizer' && ['approved', 'active'].includes(user?.organizerStatus)) ||
          (isCollegeAdmin && isHostApproved) ||
          user?.role === 'admin' ||
          user?.role === 'super_admin',
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
        isSuperAdmin: user?.role === 'super_admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
