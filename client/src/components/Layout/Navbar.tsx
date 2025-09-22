import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Badge,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Work,
  People,
  Message,
  Person,
  Logout,
  Home,
  Login,
  PersonAdd,
} from '@mui/icons-material';

import { RootState, AppDispatch } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import SearchBar from '../UI/SearchBar';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { unreadCount } = useSelector((state: RootState) => state.messages);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleProfileMenuClose();
    navigate('/');
  };

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/', showWhen: 'always' },
    { text: 'Find Jobs', icon: <Work />, path: '/jobs', showWhen: 'always' },
    { text: 'Find Providers', icon: <People />, path: '/providers', showWhen: 'always' },
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', showWhen: 'authenticated' },
    { text: 'Messages', icon: <Message />, path: '/messages', showWhen: 'authenticated' },
    { text: 'Profile', icon: <Person />, path: '/profile', showWhen: 'authenticated' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.showWhen === 'always') return true;
    if (item.showWhen === 'authenticated') return isAuthenticated;
    return false;
  });

  const MobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={handleDrawerToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 250,
          pt: 2,
        },
      }}
    >
      <Box sx={{ px: 2, mb: 2 }}>
        <Typography variant="h6" color="primary" fontWeight="bold">
          Winnipeg Connect
        </Typography>
      </Box>
      
      <Divider />
      
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem
            key={item.text}
            component={RouterLink}
            to={item.path}
            onClick={handleDrawerToggle}
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              backgroundColor: location.pathname === item.path ? 'action.selected' : 'transparent',
            }}
          >
            <ListItemIcon>
              {item.text === 'Messages' && unreadCount > 0 ? (
                <Badge badgeContent={unreadCount} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>

      {!isAuthenticated && (
        <>
          <Divider sx={{ my: 1 }} />
          <List>
            <ListItem
              component={RouterLink}
              to="/login"
              onClick={handleDrawerToggle}
              sx={{ color: 'inherit', textDecoration: 'none' }}
            >
              <ListItemIcon>
                <Login />
              </ListItemIcon>
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem
              component={RouterLink}
              to="/register"
              onClick={handleDrawerToggle}
              sx={{ color: 'inherit', textDecoration: 'none' }}
            >
              <ListItemIcon>
                <PersonAdd />
              </ListItemIcon>
              <ListItemText primary="Sign Up" />
            </ListItem>
          </List>
        </>
      )}

      {isAuthenticated && (
        <>
          <Divider sx={{ my: 1 }} />
          <List>
            <ListItem onClick={handleLogout} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </>
      )}
    </Drawer>
  );

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={1}
        sx={{ 
          backgroundColor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: isMobile ? 1 : 0,
              fontWeight: 'bold',
              color: 'primary.main',
              textDecoration: 'none',
              mr: 4,
            }}
          >
            Winnipeg Connect
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && (
            <>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                {filteredMenuItems.slice(0, 3).map((item) => (
                  <Button
                    key={item.text}
                    component={RouterLink}
                    to={item.path}
                    color={location.pathname === item.path ? 'primary' : 'inherit'}
                    sx={{ mr: 2 }}
                  >
                    {item.text === 'Messages' && unreadCount > 0 ? (
                      <Badge badgeContent={unreadCount} color="error">
                        {item.text}
                      </Badge>
                    ) : (
                      item.text
                    )}
                  </Button>
                ))}
                
                {/* Search Bar */}
                <Box sx={{ flexGrow: 1, maxWidth: 400, mx: 2 }}>
                  <SearchBar />
                </Box>
              </Box>

              {/* User Menu or Auth Buttons */}
              {isAuthenticated ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {/* Dashboard and Messages for authenticated users */}
                  <Button
                    component={RouterLink}
                    to="/dashboard"
                    color={location.pathname === '/dashboard' ? 'primary' : 'inherit'}
                    startIcon={<Dashboard />}
                  >
                    Dashboard
                  </Button>
                  
                  <IconButton
                    component={RouterLink}
                    to="/messages"
                    color={location.pathname.startsWith('/messages') ? 'primary' : 'inherit'}
                  >
                    <Badge badgeContent={unreadCount} color="error">
                      <Message />
                    </Badge>
                  </IconButton>

                  <IconButton onClick={handleProfileMenuOpen}>
                    <Avatar
                      src={user?.avatar?.url}
                      sx={{ width: 32, height: 32 }}
                    >
                      {user?.firstName?.charAt(0)}
                    </Avatar>
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    component={RouterLink}
                    to="/login"
                    color="inherit"
                  >
                    Login
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/register"
                    variant="contained"
                    color="primary"
                  >
                    Sign Up
                  </Button>
                </Box>
              )}
            </>
          )}

          {/* Mobile User Avatar */}
          {isMobile && isAuthenticated && (
            <IconButton onClick={handleProfileMenuOpen}>
              <Avatar
                src={user?.avatar?.url}
                sx={{ width: 32, height: 32 }}
              >
                {user?.firstName?.charAt(0)}
              </Avatar>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <MobileDrawer />

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          component={RouterLink}
          to="/profile"
          onClick={handleProfileMenuClose}
        >
          <Person sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <MenuItem
          component={RouterLink}
          to="/dashboard"
          onClick={handleProfileMenuClose}
        >
          <Dashboard sx={{ mr: 1 }} />
          Dashboard
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default Navbar;
