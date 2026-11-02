import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [organization, setOrganization] = useState(() => {
    const saved = localStorage.getItem('stockflow_org');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('stockflow_token'));
  const [loading, setLoading] = useState(true);

  // Sync session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('stockflow_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          setOrganization(res.data.organization);
          localStorage.setItem('stockflow_user', JSON.stringify(res.data.user));
          localStorage.setItem('stockflow_org', JSON.stringify(res.data.organization));
        } catch (err) {
          console.error('Session restore failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser, organization: newOrg } = res.data;

    setToken(newToken);
    setUser(newUser);
    setOrganization(newOrg);

    localStorage.setItem('stockflow_token', newToken);
    localStorage.setItem('stockflow_user', JSON.stringify(newUser));
    localStorage.setItem('stockflow_org', JSON.stringify(newOrg));

    return res.data;
  };

  const signup = async (payload) => {
    const res = await api.post('/auth/signup', payload);
    const { token: newToken, user: newUser, organization: newOrg } = res.data;

    setToken(newToken);
    setUser(newUser);
    setOrganization(newOrg);

    localStorage.setItem('stockflow_token', newToken);
    localStorage.setItem('stockflow_user', JSON.stringify(newUser));
    localStorage.setItem('stockflow_org', JSON.stringify(newOrg));

    return res.data;
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    setToken(null);
    localStorage.removeItem('stockflow_token');
    localStorage.removeItem('stockflow_user');
    localStorage.removeItem('stockflow_org');
  };

  const updateOrganizationState = (updatedOrg) => {
    setOrganization(updatedOrg);
    localStorage.setItem('stockflow_org', JSON.stringify(updatedOrg));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        signup,
        logout,
        updateOrganizationState,
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
