import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        const payload = parseJwt(token);
        if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
          setUser({ 
            loggedIn: true, 
            id: payload.user_id,
            employee_id: payload.employee_id,
            role: payload.role || 'TEACHING', 
            username: payload.username || localStorage.getItem('username') 
          });
        } else {
          // Token expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_role');
          localStorage.removeItem('username');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const response = await api.post('token/', { username, password });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    localStorage.setItem('user_role', response.data.role);
    localStorage.setItem('username', response.data.username);

    const payload = parseJwt(response.data.access);
    const verifiedRole = payload?.role || response.data.role;
    const verifiedUsername = payload?.username || response.data.username;
    const verifiedId = payload?.user_id || response.data.id;
    const verifiedEmployeeId = payload?.employee_id || response.data.employee_id;

    setUser({ 
      loggedIn: true, 
      id: verifiedId, 
      employee_id: verifiedEmployeeId, 
      role: verifiedRole, 
      username: verifiedUsername 
    });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
