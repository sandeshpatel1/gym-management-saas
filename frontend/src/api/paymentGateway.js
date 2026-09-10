import axiosClient from './axiosClient';

export const getPlatformGatewayProvidersApi = () =>
  axiosClient.get('/platform-settings/gateway-providers').then((r) => r.data);

export const updatePlatformGatewayProvidersApi = (gatewayProviders) =>
  axiosClient.put('/platform-settings/gateway-providers', { gatewayProviders }).then((r) => r.data);

export const getGatewaySettingsApi = (companyId) =>
  axiosClient.get(`/companies/${companyId}/gateway-settings`).then((r) => r.data);

export const updateGatewaySettingsApi = (companyId, payload) =>
  axiosClient.put(`/companies/${companyId}/gateway-settings`, payload).then((r) => r.data);

export const createGatewayOrderApi = (payload) =>
  axiosClient.post('/payments/gateway/create-order', payload).then((r) => r.data);

export const verifyGatewayPaymentApi = (payload) =>
  axiosClient.post('/payments/gateway/verify', payload).then((r) => r.data);