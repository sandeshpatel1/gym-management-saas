import axiosClient from './axiosClient';

export const getPaymentsApi = (params) => axiosClient.get('/payments', { params }).then((r) => r.data);
export const createPaymentApi = (payload) =>
  axiosClient.post('/payments', payload).then((r) => r.data);
