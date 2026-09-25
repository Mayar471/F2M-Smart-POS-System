import { create } from 'zustand';
import type { UserRole } from '@/types';

interface SessionState {
  userId:   string | null;
  userName: string | null;
  role:     UserRole | null;
  setSession: (userId: string, userName: string, role: UserRole) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  userId:   null,
  userName: null,
  role:     null,
  setSession:   (userId, userName, role) => set({ userId, userName, role }),
  clearSession: () => set({ userId: null, userName: null, role: null }),
}));
