import axios from 'axios';

const api = axios.create();

api.interceptors.request.use((config) => {
  const serverUrl = localStorage.getItem('cinelocal_server_url');
  if (serverUrl) {
    config.baseURL = serverUrl.replace(/\/$/, '');
  }
  return config;
});

export function getServerUrl() {
  return localStorage.getItem('cinelocal_server_url') || '';
}

export function setServerUrl(url) {
  const trimmed = url.trim().replace(/\/$/, '');
  if (trimmed) localStorage.setItem('cinelocal_server_url', trimmed);
  else localStorage.removeItem('cinelocal_server_url');
}

export function getStreamUrl(movieId) {
  const base = getServerUrl();
  return base ? `${base}/api/stream/${movieId}` : `/api/stream/${movieId}`;
}

export default api;
