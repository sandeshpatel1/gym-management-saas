import axiosClient from './axiosClient';

export const getCompaniesApi = () => axiosClient.get('/companies').then((r) => r.data);
export const createCompanyApi = (payload) =>
  axiosClient.post('/companies', payload).then((r) => r.data);
export const updateCompanyApi = (id, payload) =>
  axiosClient.put(`/companies/${id}`, payload).then((r) => r.data);
export const setCompanyStatusApi = (id, isActive) =>
  axiosClient.patch(`/companies/${id}/status`, { isActive }).then((r) => r.data);
