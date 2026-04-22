import axios from 'axios';

const SERVER_PORT = 3001;
const STORAGE_KEY = 'cinelocal_server_ip';

const api = axios.create();

api.interceptors.request.use((config) => {
  const ip = localStorage.getItem(STORAGE_KEY);
  if (ip) {
    config.baseURL = `http://${ip}:${SERVER_PORT}`;
  }
  return config;
});

export function getServerIp() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setServerIp(ip) {
  const trimmed = ip.trim();
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
  else localStorage.removeItem(STORAGE_KEY);
}

export function getServerUrl() {
  const ip = getServerIp();
  return ip ? `http://${ip}:${SERVER_PORT}` : '';
}

export function getStreamUrl(movieId) {
  const ip = getServerIp();
  return ip ? `http://${ip}:${SERVER_PORT}/api/stream/${movieId}` : `/api/stream/${movieId}`;
}

export default api;
