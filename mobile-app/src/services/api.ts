import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://3.84.94.77:8000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', 
      new URLSearchParams({ username: email, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    if (response.data.access_token) {
      await AsyncStorage.setItem('authToken', response.data.access_token);
    }
    return response.data;
  },
  
  register: async (email: string, username: string, password: string, fullName?: string) => {
    const response = await api.post('/auth/register', {
      email,
      username,
      password,
      full_name: fullName || null
    });
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
  },
  
  checkSession: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return false;
      await api.get('/auth/me');
      return true;
    } catch {
      await AsyncStorage.removeItem('authToken');
      return false;
    }
  }
};

// Face Swap API
export const swapAPI = {
  swapImage: async (sourceUri: string, targetUri: string) => {
    const formData = new FormData();
    
    formData.append('source', {
      uri: sourceUri,
      type: 'image/jpeg',
      name: 'source.jpg'
    } as any);
    
    formData.append('target', {
      uri: targetUri,
      type: 'image/jpeg',
      name: 'target.jpg'
    } as any);
    
    const response = await api.post('/faceswap/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  swapVideo: async (sourceUri: string, targetUri: string) => {
    const formData = new FormData();
    
    formData.append('source', {
      uri: sourceUri,
      type: 'image/jpeg',
      name: 'source.jpg'
    } as any);
    
    formData.append('target', {
      uri: targetUri,
      type: 'video/mp4',
      name: 'target.mp4'
    } as any);
    
    const response = await api.post('/faceswap/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000 // 5 minutes for video
    });
    return response.data;
  },
  
  getHistory: async (page = 1) => {
    const response = await api.get(`/faceswap/history?page=${page}`);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/faceswap/${id}`);
    return response.data;
  }
};

export default api;
