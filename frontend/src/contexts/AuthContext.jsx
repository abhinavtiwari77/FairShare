import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/auth/me')
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/v1/auth/login', { email, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (fullName, email, password) => {
    const res = await api.post('/api/v1/auth/register', { fullName, email, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await api.post('/api/v1/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
