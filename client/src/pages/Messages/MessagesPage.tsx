import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Divider,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar,
  Container,
} from '@mui/material';
import {
  Send,
  Search,
  Menu as MenuIcon,
  ArrowBack,
  MoreVert,
  AttachFile,
  EmojiEmotions,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import io from 'socket.io-client';

import { RootState, AppDispatch } from '../../store/store';
import {
  fetchChats,
  fetchChatMessages,
  sendMessage,
  setCurrentChatId,
  clearCurrentChat,
  addMessage,
  markChatAsRead,
} from '../../store/slices/messagesSlice';

interface MessageFormData {
  content: string;
}

const MessagesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();

  const { chats, messages, currentChat, currentChatId, isLoading, error } = useSelector(
    (state: RootState) => state.messages
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [socket, setSocket] = useState<any>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { control, handleSubmit, reset, watch } = useForm<MessageFormData>({
    defaultValues: { content: '' },
  });

  const messageContent = watch('content');

  // Initialize Socket.io connection
  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.NODE_ENV === 'production' 
        ? 'https://your-api-domain.com' 
        : 'http://localhost:5000'
      );

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
      });

      newSocket.on('receive_message', (data: any) => {
        dispatch(addMessage(data.message));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, dispatch]);

  // Load chats on component mount
  useEffect(() => {
    if (user) {
      dispatch(fetchChats({ page: 1, limit: 50 }));
    }
  }, [dispatch, user]);

  // Handle URL chat parameter
  useEffect(() => {
    const chatParam = searchParams.get('chat');
    if (chatParam && chatParam !== currentChatId) {
      dispatch(setCurrentChatId(chatParam));
      dispatch(fetchChatMessages({ chatId: chatParam, page: 1, limit: 50 }));
      
      // Join chat room
      if (socket) {
        socket.emit('join_chat', chatParam);
      }
    }
  }, [searchParams, dispatch, currentChatId, socket]);

  // Join chat room when currentChatId changes
  useEffect(() => {
    if (currentChatId && socket) {
      socket.emit('join_chat', currentChatId);
    }
  }, [currentChatId, socket]);

  const handleChatSelect = (chatId: string) => {
    dispatch(setCurrentChatId(chatId));
    dispatch(fetchChatMessages({ chatId, page: 1, limit: 50 }));
    dispatch(markChatAsRead(chatId));
    
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const onSendMessage = async (data: MessageFormData) => {
    if (!currentChat || !data.content.trim()) return;

    try {
      const messageData = {
        receiver: currentChat.participant._id,
        content: data.content.trim(),
        job: currentChat.job?._id,
      };

      await dispatch(sendMessage(messageData)).unwrap();
      
      // Emit via socket for real-time delivery
      if (socket && currentChatId) {
        socket.emit('send_message', {
          chatId: currentChatId,
          ...messageData,
          sender: user,
        });
      }

      reset();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const filteredChats = chats.filter(chat =>
    searchQuery === '' ||
    `${chat.participant.firstName} ${chat.participant.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    chat.job?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ChatList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Divider />

      {/* Chat List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredChats.length > 0 ? (
          <List sx={{ p: 0 }}>
            {filteredChats.map((chat) => (
              <React.Fragment key={chat._id}>
                <ListItem
                  button
                  onClick={() => handleChatSelect(chat._id)}
                  selected={currentChatId === chat._id}
                  sx={{
                    py: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={chat.unreadCount}
                      color="error"
                      invisible={chat.unreadCount === 0}
                    >
                      <Avatar src={chat.participant.avatar?.url}>
                        {chat.participant.firstName[0]}{chat.participant.lastName[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {chat.participant.firstName} {chat.participant.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatMessageTime(chat.lastMessageTime)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        {chat.job && (
                          <Typography variant="caption" color="primary" display="block">
                            Re: {chat.job.title}
                          </Typography>
                        )}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: chat.unreadCount > 0 ? 'bold' : 'normal',
                          }}
                        >
                          {chat.lastMessageContent}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No conversations yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start a conversation by contacting a service provider
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  const ChatWindow = () => {
    if (!currentChat) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
          }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              Select a conversation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose a conversation from the list to start messaging
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isMobile && (
                <IconButton
                  onClick={() => setMobileDrawerOpen(true)}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              
              <Avatar
                src={currentChat.participant.avatar?.url}
                sx={{ mr: 2 }}
              >
                {currentChat.participant.firstName[0]}{currentChat.participant.lastName[0]}
              </Avatar>
              
              <Box>
                <Typography variant="h6">
                  {currentChat.participant.firstName} {currentChat.participant.lastName}
                </Typography>
                {currentChat.job && (
                  <Typography variant="body2" color="primary">
                    Re: {currentChat.job.title}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {currentChat.participant.isActive ? 'Active now' : `Last seen ${formatMessageTime(currentChat.participant.lastActive)}`}
                </Typography>
              </Box>
            </Box>

            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {messages.map((message) => {
            const isOwn = message.sender._id === user?._id;
            
            return (
              <Box
                key={message._id}
                sx={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '70%',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: isOwn ? 'primary.main' : 'grey.100',
                    color: isOwn ? 'white' : 'text.primary',
                  }}
                >
                  {message.messageType === 'system' ? (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                      {message.content}
                    </Typography>
                  ) : (
                    <>
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          opacity: 0.7,
                          textAlign: 'right',
                        }}
                      >
                        {formatMessageTime(message.createdAt)}
                        {isOwn && message.isRead && ' • Read'}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Message Input */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <form onSubmit={handleSubmit(onSendMessage)}>
            <Controller
              name="content"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  placeholder="Type a message..."
                  multiline
                  maxRows={4}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="submit"
                          disabled={!messageContent?.trim()}
                          color="primary"
                        >
                          <Send />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(onSendMessage)();
                    }
                  }}
                />
              )}
            />
          </form>
        </Box>
      </Box>
    );
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Please log in to access messages.
        </Alert>
      </Container>
    );
  }

  if (isMobile) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile Chat List */}
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          variant={currentChatId ? 'temporary' : 'permanent'}
          sx={{
            '& .MuiDrawer-paper': {
              width: '100%',
              position: 'relative',
            },
          }}
        >
          <Box sx={{ height: '100vh' }}>
            <AppBar position="static" elevation={0}>
              <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Messages
                </Typography>
              </Toolbar>
            </AppBar>
            <ChatList />
          </Box>
        </Drawer>

        {/* Mobile Chat Window */}
        {currentChatId && (
          <Box sx={{ height: '100vh' }}>
            <ChatWindow />
          </Box>
        )}

        {!currentChatId && !mobileDrawerOpen && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<MenuIcon />}
              onClick={() => setMobileDrawerOpen(true)}
            >
              View Conversations
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // Desktop Layout
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 200px)' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Messages
      </Typography>

      <Paper sx={{ height: '80vh', display: 'flex' }}>
        {/* Chat List Sidebar */}
        <Box
          sx={{
            width: 350,
            borderRight: 1,
            borderColor: 'divider',
            height: '100%',
          }}
        >
          <ChatList />
        </Box>

        {/* Chat Window */}
        <Box sx={{ flex: 1, height: '100%' }}>
          <ChatWindow />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default MessagesPage;
