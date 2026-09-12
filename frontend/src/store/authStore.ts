import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
      });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao registrar';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao fazer login';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token });
    }
  },
}));
