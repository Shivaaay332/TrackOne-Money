const STORAGE_KEY = 'trackone_ai_chat_history';
const MAX_MESSAGES = 100;

export const ChatStorage = {
  getMessages: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Failed to load chat history", e);
      return null;
    }
  },
  
  saveMessages: (messages) => {
    try {
      // Keep only the last MAX_MESSAGES
      const trimmed = messages.slice(-MAX_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  },

  clearMessages: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};