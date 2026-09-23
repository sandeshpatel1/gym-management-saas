import axiosClient from './axiosClient';

export const startImpersonationApi = (companyId) =>
  axiosClient.post(`/impersonation/${companyId}/start`).then((r) => r.data);

export const endImpersonationApi = (companyId) =>
  axiosClient.post(`/impersonation/${companyId}/end`).then((r) => r.data);

export const getImpersonationLogsApi = (params) =>
  axiosClient.get('/impersonation', { params }).then((r) => r.data);