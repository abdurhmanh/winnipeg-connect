import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const ProviderDetailsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Provider Details
      </Typography>
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Provider details page coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default ProviderDetailsPage;
