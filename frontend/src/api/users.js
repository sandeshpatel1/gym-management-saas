import axiosClient from './axiosClient';

export const getUsersApi = (params) => axiosClient.get('/users', { params }).then((r) => r.data);
export const createUserApi = (payload) => axiosClient.post('/users', payload).then((r) => r.data);
export const updateUserApi = (id, payload) =>
  axiosClient.put(`/users/${id}`, payload).then((r) => r.data);
export const deleteUserApi = (id) => axiosClient.delete(`/users/${id}`).then((r) => r.data);