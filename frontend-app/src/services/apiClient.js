import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
