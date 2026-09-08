import axiosClient from './axiosClient';

export const loginApi = (email, password) =>
  axiosClient.post('/auth/login', { email, password }).then((r) => r.data);

export const registerCompanyApi = (payload) =>
  axiosClient.post('/auth/register-company', payload).then((r) => r.data);

export const getMeApi = () => axiosClient.get('/auth/me').then((r) => r.data);

export const updateMeApi = (payload) =>
  axiosClient.put('/auth/me', payload).then((r) => r.data);