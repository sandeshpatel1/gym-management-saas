import axiosClient from './axiosClient';

export const getMembersApi = (params) => axiosClient.get('/members', { params }).then((r) => r.data);
export const searchMembersApi = (q) =>
  axiosClient.get('/members/search', { params: { q } }).then((r) => r.data);
export const getMemberByIdApi = (id) => axiosClient.get(`/members/${id}`).then((r) => r.data);
export const createMemberApi = (payload) =>
  axiosClient.post('/members', payload).then((r) => r.data);
export const updateMemberApi = (id, payload) =>
  axiosClient.put(`/members/${id}`, payload).then((r) => r.data);
export const renewMembershipApi = (id, payload) =>
  axiosClient.post(`/members/${id}/renew`, payload).then((r) => r.data);
export const getMemberQrCodeApi = (id) =>
  axiosClient.get(`/members/${id}/qrcode`, { responseType: 'blob' }).then((r) => r.data);