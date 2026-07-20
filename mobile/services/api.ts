import axios from 'axios';
import { API_URL } from '@/constants/config';
import { tokenStorage } from './token';

export const api = axios.create({ baseURL: API_URL, timeout: 15_000 });

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
