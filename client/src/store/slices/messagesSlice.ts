import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messagesAPI } from '../../services/api';

export interface Message {
  _id: string;
  chatId: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: { url: string };
  };
  receiver: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: { url: string };
  };
  job?: {
    _id: string;
    title: string;
    category: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'document' | 'system';
  attachments?: Array<{
    type: 'image' | 'document' | 'link';
    url: string;
    filename: string;
    size: number;
  }>;
  isRead: boolean;
  readAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  systemData?: {
    type: string;
    data: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  participant: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: { url: string };
    isActive: boolean;
    lastActive: string;
  };
  job?: {
    _id: string;
    title: string;
    category: string;
    status: string;
  };
  lastMessage: Message;
  lastMessageTime: string;
  lastMessageContent: string;
  lastMessageType: string;
  unreadCount: number;
}

interface MessagesState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  currentChatId: string | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  chats: [],
  currentChat: null,
  messages: [],
  currentChatId: null,
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// Async thunks
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (messageData: {
    receiver: string;
    content: string;
    job?: string;
    quote?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.sendMessage(messageData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const fetchChats = createAsyncThunk(
  'messages/fetchChats',
  async (params: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.getChats(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chats');
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  'messages/fetchChatMessages',
  async (params: { chatId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.getChatMessages(params.chatId, {
        page: params.page,
        limit: params.limit,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  'messages/markMessageAsRead',
  async (messageId: string, { rejectWithValue }) => {
    try {
      await messagesAPI.markAsRead(messageId);
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark message as read');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async (messageId: string, { rejectWithValue }) => {
    try {
      await messagesAPI.deleteMessage(messageId);
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete message');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'messages/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.getUnreadCount();
      return response.count;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const startChat = createAsyncThunk(
  'messages/startChat',
  async (params: {
    userId: string;
    jobId?: string;
    initialMessage?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.startChat(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start chat');
    }
  }
);

export const searchMessages = createAsyncThunk(
  'messages/searchMessages',
  async (params: {
    query: string;
    chatId?: string;
    limit?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.searchMessages(params);
      return response.messages;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search messages');
    }
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setCurrentChatId: (state, action) => {
      state.currentChatId = action.payload;
      state.currentChat = state.chats.find(chat => chat._id === action.payload) || null;
    },
    clearCurrentChat: (state) => {
      state.currentChat = null;
      state.currentChatId = null;
      state.messages = [];
    },
    addMessage: (state, action) => {
      const message = action.payload;
      
      // Add to messages if it's for the current chat
      if (state.currentChatId === message.chatId) {
        state.messages.push(message);
      }
      
      // Update chat list
      const chatIndex = state.chats.findIndex(chat => chat._id === message.chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        state.chats[chatIndex].lastMessageTime = message.createdAt;
        state.chats[chatIndex].lastMessageContent = message.content;
        state.chats[chatIndex].lastMessageType = message.messageType;
        
        // Move chat to top
        const chat = state.chats.splice(chatIndex, 1)[0];
        state.chats.unshift(chat);
      }
    },
    markChatAsRead: (state, action) => {
      const chatId = action.payload;
      const chatIndex = state.chats.findIndex(chat => chat._id === chatId);
      if (chatIndex !== -1) {
        const previousUnreadCount = state.chats[chatIndex].unreadCount;
        state.chats[chatIndex].unreadCount = 0;
        state.unreadCount = Math.max(0, state.unreadCount - previousUnreadCount);
      }
      
      // Mark messages as read in current chat
      if (state.currentChatId === chatId) {
        state.messages.forEach(message => {
          if (!message.isRead) {
            message.isRead = true;
            message.readAt = new Date().toISOString();
          }
        });
      }
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        
        // Add to current chat messages
        if (state.currentChatId === message.chatId) {
          state.messages.push(message);
        }
        
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Fetch chats
    builder
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload.chats;
        
        // Calculate total unread count
        state.unreadCount = action.payload.chats.reduce(
          (total: number, chat: Chat) => total + chat.unreadCount, 
          0
        );
        
        state.error = null;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch chat messages
    builder
      .addCase(fetchChatMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload.messages;
        
        if (action.payload.participant) {
          // Update current chat info
          const chatIndex = state.chats.findIndex(chat => 
            chat.participant._id === action.payload.participant._id
          );
          if (chatIndex !== -1) {
            state.currentChat = state.chats[chatIndex];
          }
        }
        
        state.error = null;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark message as read
    builder
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const messageId = action.payload;
        const messageIndex = state.messages.findIndex(msg => msg._id === messageId);
        if (messageIndex !== -1) {
          state.messages[messageIndex].isRead = true;
          state.messages[messageIndex].readAt = new Date().toISOString();
        }
      });

    // Delete message
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        state.messages = state.messages.filter(msg => msg._id !== messageId);
      });

    // Fetch unread count
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });

    // Start chat
    builder
      .addCase(startChat.fulfilled, (state, action) => {
        const { chatId, participant, job } = action.payload;
        
        // Check if chat already exists
        const existingChatIndex = state.chats.findIndex(chat => chat._id === chatId);
        
        if (existingChatIndex === -1) {
          // Create new chat entry
          const newChat: Chat = {
            _id: chatId,
            participant,
            job,
            lastMessage: {} as Message,
            lastMessageTime: new Date().toISOString(),
            lastMessageContent: '',
            lastMessageType: 'text',
            unreadCount: 0,
          };
          
          state.chats.unshift(newChat);
        }
        
        // Set as current chat
        state.currentChatId = chatId;
        state.currentChat = state.chats.find(chat => chat._id === chatId) || null;
      });

    // Search messages
    builder
      .addCase(searchMessages.fulfilled, (state, action) => {
        // Store search results separately or update messages
        // For now, we'll just clear any errors
        state.error = null;
      });
  },
});

export const {
  setCurrentChatId,
  clearCurrentChat,
  addMessage,
  markChatAsRead,
  updateUnreadCount,
  clearError,
} = messagesSlice.actions;

export default messagesSlice.reducer;
