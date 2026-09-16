import { create } from 'zustand'

// Phase 2: active chat list + open conversation state.
export const useChatStore = create((set) => ({
  chats: [],
  activeChatId: null,
  messagesByChat: {},
  setChats: (chats) => set({ chats }),
  setActiveChat: (chatId) => set({ activeChatId: chatId }),
}))
