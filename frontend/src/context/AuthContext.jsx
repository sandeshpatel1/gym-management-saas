import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginApi, getMeApi } from '../api/auth';

const AuthContext = createContext(null);

/** Applies the logged-in company's brand color to CSS variables, so every
 * button/link/accent across the dashboard instantly reflects that gym's identity. */
const applyBranding = (branding) => {
  const root = document.documentElement;
  if (branding?.primaryColor) {
    root.style.setProperty('--brand-color', branding.primaryColor);
    root.style.setProperty('--brand-color-dark', shadeColor(branding.primaryColor, -15));
  } else {
    root.style.setProperty('--brand-color', '#0A84FF');
    root.style.setProperty('--brand-color-dark', '#0060DF');
  }
};

function shadeColor(hex, percent) {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  } catch {
    return hex;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem('gym_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { user: me } = await getMeApi();
      setUser(me);
      applyBranding(me?.company?.branding);
    } catch {
      localStorage.removeItem('gym_token');
      localStorage.removeItem('gym_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    localStorage.setItem('gym_token', data.token);
    localStorage.setItem('gym_user', JSON.stringify(data.user));
    setUser(data.user);
    applyBranding(data.user?.company?.branding);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    setUser(null);
    applyBranding(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
