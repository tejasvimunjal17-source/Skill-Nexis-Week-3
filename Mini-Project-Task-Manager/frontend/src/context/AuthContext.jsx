// Context API: shares "who is logged in" with every page.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginUser, registerUser, storage } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (storage.getToken() ? storage.getUser() : null));

  const logout = useCallback(() => {
    storage.clearSession();
    setUser(null);
  }, []);

  // The API layer sends this event when the server rejects our token.
  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const login = async (email, password) => {
    const { data } = await loginUser({ email, password });
    storage.saveSession(data.token, data.data.user);
    setUser(data.data.user);
  };

  // Registering does not log in automatically (the backend only returns a token on login).
  const register = async (name, email, password) => {
    await registerUser({ name, email, password });
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: Boolean(user), login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
