import axiosClient from './axiosClient';

export const getPlatformPaymentMethodsApi = () =>
  axiosClient.get('/platform-settings/payment-methods').then((r) => r.data);

export const updatePlatformPaymentMethodsApi = (paymentMethods) =>
  axiosClient.put('/platform-settings/payment-methods', { paymentMethods }).then((r) => r.data);