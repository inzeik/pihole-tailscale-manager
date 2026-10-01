import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000/api`;

export const getPiHoleStats = async () => {
  const response = await axios.get(`${API_BASE}/stats`);
  return response.data;
};

export const getTailscaleDevices = async () => {
  const response = await axios.get(`${API_BASE}/tailscale/devices`);
  return response.data;
};

export const getLiveQueries = async () => {
  const response = await axios.get(`${API_BASE}/queries/live`);
  return response.data;
};

export const getHistory = async () => {
  const response = await axios.get(`${API_BASE}/history`);
  return response.data;
};

export const getTopBlocked = async () => {
  const response = await axios.get(`${API_BASE}/top-blocked`);
  return response.data;
};

export const toggleBlocking = async (enable) => {
  const response = await axios.post(`${API_BASE}/blocking/toggle`, null, {
    params: { enable }
  });
  return response.data;
};

export const getInfo = async () => {
  const response = await axios.get(`${API_BASE}/info`);
  return response.data;
};