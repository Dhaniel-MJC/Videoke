import { create } from 'zustand';
import axios from 'axios';

interface RoomMember {
  user_id: number;
  username: string;
  avatar_url?: string;
}

interface Room {
  id: number;
  name: string;
  created_by: number;
  max_participants: number;
  is_active: boolean;
  created_at: string;
  members?: RoomMember[];
}

interface RoomStore {
  rooms: Room[];
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;

  fetchRooms: () => Promise<void>;
  createRoom: (name: string, maxParticipants?: number) => Promise<Room>;
  joinRoom: (roomId: number) => Promise<void>;
  leaveRoom: () => void;
  setCurrentRoom: (room: Room | null) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useRoomStore = create<RoomStore>((set) => ({
  rooms: [],
  currentRoom: null,
  isLoading: false,
  error: null,

  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      set({ rooms: response.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao buscar salas';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createRoom: async (name: string, maxParticipants?: number) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/rooms`,
        { name, maxParticipants },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const newRoom = response.data;
      set((state) => ({
        rooms: [...state.rooms, newRoom],
        isLoading: false,
      }));
      return newRoom;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao criar sala';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  joinRoom: async (roomId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/rooms/${roomId}`);
      set({ currentRoom: response.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao entrar na sala';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  leaveRoom: () => {
    set({ currentRoom: null });
  },

  setCurrentRoom: (room: Room | null) => {
    set({ currentRoom: room });
  },
}));
