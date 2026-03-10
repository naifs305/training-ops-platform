import { createContext, useState, useContext, useEffect } from 'react';
import Router from 'next/router';
import api from '../lib/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        const res = await api.get('/users/me');
        setUser(res.data);

        const savedRole = localStorage.getItem('activeRole') || sessionStorage.getItem('activeRole');

        if (savedRole && res.data.roles.includes(savedRole)) {
          setActiveRole(savedRole);
        } else if (res.data.roles.includes('MANAGER')) {
          setActiveRole('MANAGER');
          localStorage.setItem('activeRole', 'MANAGER');
        } else {
          setActiveRole('EMPLOYEE');
          localStorage.setItem('activeRole', 'EMPLOYEE');
        }
      }
    } catch (error) {
      console.error('Session invalid - AuthContext.js:36', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe) => {
    const res = await api.post('/auth/login', { email, password });

    if (rememberMe) {
      localStorage.setItem('token', res.data.access_token);
    } else {
      sessionStorage.setItem('token', res.data.access_token);
    }

    setUser(res.data.user);

    const defaultRole = res.data.user.roles.includes('MANAGER') ? 'MANAGER' : 'EMPLOYEE';
    setActiveRole(defaultRole);

    if (rememberMe) {
      localStorage.setItem('activeRole', defaultRole);
    } else {
      sessionStorage.setItem('activeRole', defaultRole);
    }

    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('token', res.data.access_token);
    localStorage.setItem('activeRole', 'EMPLOYEE');
    setUser(res.data.user);
    setActiveRole('EMPLOYEE');
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('activeRole');
    sessionStorage.removeItem('activeRole');
    setUser(null);
    setActiveRole(null);
    Router.push('/login');
  };

  const switchRole = (role) => {
    if (user && user.roles.includes(role)) {
      setActiveRole(role);
      localStorage.setItem('activeRole', role);
      sessionStorage.setItem('activeRole', role);
      Router.push('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, login, register, logout, switchRole, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default useAuth;