import axiosClient from './axiosClient';

// Public, token-scoped — called from the phone's browser, no login required.
export const verifyPhotoSessionApi = (token) =>
  axiosClient.get(`/photo-sessions/${token}`).then((r) => r.data);

export const submitPhotoSessionApi = (token, photoData) =>
  axiosClient.post(`/photo-sessions/${token}`, { photoData }).then((r) => r.data);