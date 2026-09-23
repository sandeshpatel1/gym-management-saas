import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginApi, getMeApi } from '../api/auth';
import { getMyBranchesApi } from '../api/companies';
import { startImpersonationApi, endImpersonationApi } from '../api/impersonation';

const AuthContext = createContext(null);
const MANAGING_ID_KEY = 'gym_managing_company_id';
const MANAGING_OBJ_KEY = 'gym_managing_company';

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
  const [managingCompany, setManagingCompanyState] = useState(() => {
    const raw = sessionStorage.getItem(MANAGING_OBJ_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  // Branch list lives HERE (app root, never remounts on navigation) rather
  // than in a per-component hook - Sidebar/BranchSwitcher get remounted on
  // every route change since each page wraps its own <DashboardLayout>, so
  // a hook-local fetch there re-runs (and briefly empties out) on every nav.
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const loadBranches = useCallback(async (role) => {
    if (role !== 'owner') {
      setBranches([]);
      return;
    }
    setBranchesLoading(true);
    try {
      const { data } = await getMyBranchesApi();
      setBranches(data);
    } catch {
      /* switcher/rollup just won't populate - everything else keeps working */
    } finally {
      setBranchesLoading(false);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem('gym_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { user: me } = await getMeApi();
      setUser(me);
      const raw = sessionStorage.getItem(MANAGING_OBJ_KEY);
      const managing = raw ? JSON.parse(raw) : null;
      applyBranding(managing?.branding || me?.company?.branding);
      await loadBranches(me?.role);
    } catch {
      localStorage.removeItem('gym_token');
      localStorage.removeItem('gym_user');
    } finally {
      setLoading(false);
    }
  }, [loadBranches]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    localStorage.setItem('gym_token', data.token);
    localStorage.setItem('gym_user', JSON.stringify(data.user));
    sessionStorage.removeItem(MANAGING_ID_KEY);
    sessionStorage.removeItem(MANAGING_OBJ_KEY);
    setManagingCompanyState(null);
    setUser(data.user);
    applyBranding(data.user?.company?.branding);
    await loadBranches(data.user?.role);
    return data.user;
  };

  const logout = () => {
    // If a superadmin logs out while still "managing" a gym, that's an
    // implicit end of the impersonation session - log it before clearing
    // the state that identifies which gym it was.
    if (user?.role === 'superadmin' && managingCompany?.id) {
      endImpersonationApi(managingCompany.id).catch(() => {});
    }
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    sessionStorage.removeItem(MANAGING_ID_KEY);
    sessionStorage.removeItem(MANAGING_OBJ_KEY);
    setManagingCompanyState(null);
    setUser(null);
    setBranches([]);
    applyBranding(null);
  };

  // --- Superadmin "manage this gym" impersonation-lite ---
  const startManaging = (company) => {
    const normalized = {
      id: company.id || company._id,
      name: company.name,
      code: company.code,
      branding: company.branding,
    };
    sessionStorage.setItem(MANAGING_ID_KEY, normalized.id);
    sessionStorage.setItem(MANAGING_OBJ_KEY, JSON.stringify(normalized));
    setManagingCompanyState(normalized);
    applyBranding(normalized.branding);

    // Only superadmin's "Manage this gym" is impersonation worth
    // auditing - an owner switching between their own branches isn't
    // accessing anyone else's data, so this is skipped for owners.
    // Fire-and-forget: a logging hiccup should never block navigation.
    if (user?.role === 'superadmin') {
      startImpersonationApi(normalized.id).catch(() => {});
    }
  };

  const stopManaging = () => {
    if (user?.role === 'superadmin' && managingCompany?.id) {
      endImpersonationApi(managingCompany.id).catch(() => {});
    }
    sessionStorage.removeItem(MANAGING_ID_KEY);
    sessionStorage.removeItem(MANAGING_OBJ_KEY);
    setManagingCompanyState(null);
    applyBranding(user?.company?.branding);
  };

  // The company whose data the current screen should show:
  // - normal staff -> their own company
  // - superadmin actively managing a gym -> that gym
  const effectiveCompany = managingCompany || user?.company || null;

  // True whenever the current session has owner-level rights on the
  // effectiveCompany (a real owner, OR a superadmin managing a gym).
  const isEffectiveOwner = user?.role === 'owner' || (user?.role === 'superadmin' && !!managingCompany);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
        managingCompany,
        startManaging,
        stopManaging,
        effectiveCompany,
        isEffectiveOwner,
        branches,
        branchesLoading,
        reloadBranches: () => loadBranches(user?.role),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);