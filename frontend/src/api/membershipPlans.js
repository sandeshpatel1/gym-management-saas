import axiosClient from './axiosClient';

export const getPlansApi = () => axiosClient.get('/membership-plans').then((r) => r.data);
export const createPlanApi = (payload) =>
  axiosClient.post('/membership-plans', payload).then((r) => r.data);
export const updatePlanApi = (id, payload) =>
  axiosClient.put(`/membership-plans/${id}`, payload).then((r) => r.data);
export const deletePlanApi = (id) =>
  axiosClient.delete(`/membership-plans/${id}`).then((r) => r.data);
