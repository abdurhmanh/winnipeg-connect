import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, AppBar, Toolbar, Button } from '@mui/material';

// Create a simple theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

// Simple Landing Page
const LandingPage = () => (
  <Box sx={{ flexGrow: 1, p: 4 }}>
    <Typography variant="h3" component="h1" gutterBottom align="center">
      🏠 Winnipeg Connect
    </Typography>
    <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
      Connecting Service Providers & Seekers
    </Typography>
    
    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
      <Button variant="contained" size="large">
        Find Services
      </Button>
      <Button variant="outlined" size="large">
        Post a Job
      </Button>
    </Box>

    <Box sx={{ mt: 6, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Features:
      </Typography>
      <Typography component="ul">
        <li>✅ User Registration & Authentication</li>
        <li>✅ Job Posting & Browsing</li>
        <li>✅ Service Provider Profiles</li>
        <li>✅ Real-time Messaging</li>
        <li>✅ Payment Integration</li>
        <li>✅ Review & Rating System</li>
      </Typography>
      
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Backend API:</strong> <a href="http://localhost:5001/api/health" target="_blank" rel="noopener noreferrer">http://localhost:5001/api/health</a>
        </Typography>
      </Box>
    </Box>
  </Box>
);

// Simple Login Page
const LoginPage = () => (
  <Box sx={{ flexGrow: 1, p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
    <Typography variant="h4" component="h1" gutterBottom align="center">
      Login
    </Typography>
    <Box sx={{ mt: 3 }}>
      <Button variant="contained" fullWidth size="large" sx={{ mb: 2 }}>
        Login as Service Seeker
      </Button>
      <Button variant="outlined" fullWidth size="large" sx={{ mb: 2 }}>
        Login as Service Provider
      </Button>
      <Button variant="text" fullWidth>
        Don't have an account? Register
      </Button>
    </Box>
  </Box>
);

// Main App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Winnipeg Connect
              </Typography>
              <Button color="inherit">Login</Button>
              <Button color="inherit">Register</Button>
            </Toolbar>
          </AppBar>
          
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
