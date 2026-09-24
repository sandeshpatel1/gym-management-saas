import axios from 'axios';
import { notifyDeactivatedGym } from '../utils/deactivatedGymBus';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('gym_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // If a superadmin/owner is currently "managing" a gym, scope every
  // request to that gym automatically - UNLESS the caller already passed
  // an explicit `company` param (e.g. the owner's "All Branches" rollup
  // page, which needs to query several branches in one screen regardless
  // of which one is currently active in the sidebar).
  const managingCompanyId = sessionStorage.getItem('gym_managing_company_id');
  if (managingCompanyId && !config.params?.company) {
    config.params = { ...(config.params || {}), company: managingCompanyId };
  }

  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gym_token');
      localStorage.removeItem('gym_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // A gym/branch was deactivated - possibly mid-session, by superadmin,
    // while this login was already inside it. Surface a blocking "contact
    // admin" popup instead of a toast that's easy to miss. The calling
    // page's own .catch still runs normally afterwards (any extra toast it
    // shows is harmless alongside this).
    const message = err.response?.data?.message;
    if (err.response?.status === 403 && /deactivated/i.test(message || '')) {
      notifyDeactivatedGym(message);
    }

    return Promise.reject(err);
  }
);

export default axiosClient;