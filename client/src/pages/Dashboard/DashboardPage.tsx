import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';

import { RootState } from '../../store/store';
import ProviderDashboard from '../../components/Dashboard/ProviderDashboard';
import SeekerDashboard from '../../components/Dashboard/SeekerDashboard';

const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Typography variant="h6">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {user.role === 'provider' 
            ? 'Manage your services and connect with clients'
            : 'Find trusted service providers for your projects'
          }
        </Typography>
      </Box>

      {user.role === 'provider' ? <ProviderDashboard /> : <SeekerDashboard />}
    </Container>
  );
};

export default DashboardPage;
