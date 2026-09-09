import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('gym_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // If a superadmin is currently "managing" a gym, scope every request to
  // that gym automatically (the backend reads ?company=<id> for superadmin
  // requests on company-scoped routes).
  const managingCompanyId = sessionStorage.getItem('gym_managing_company_id');
  if (managingCompanyId) {
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
    return Promise.reject(err);
  }
);

export default axiosClient;