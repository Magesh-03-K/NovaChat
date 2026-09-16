import { create } from 'zustand'

// Phase 1: holds the current user + backend session token,
// persisted so refresh keeps the user logged in.
export const useAuthStore = create((set) => ({
  user: null,
  sessionToken: null,
  setSession: (user, sessionToken) => set({ user, sessionToken }),
  clearSession: () => set({ user: null, sessionToken: null }),
}))
