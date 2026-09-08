import axiosClient from './axiosClient';

export const startKioskSessionApi = () =>
  axiosClient.post('/kiosk/session').then((r) => r.data);

export const getKioskQrCodeApi = (token) =>
  axiosClient.get(`/kiosk/qrcode/${token}`, { responseType: 'blob' }).then((r) => r.data);

export const verifyKioskSessionApi = (token) =>
  axiosClient.get(`/kiosk/session/${token}`).then((r) => r.data);

export const kioskCheckInApi = (token, identifier) =>
  axiosClient.post('/kiosk/checkin', { token, identifier }).then((r) => r.data);