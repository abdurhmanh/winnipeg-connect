import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Rating,
  Paper,
} from '@mui/material';
import {
  Search,
  Handshake,
  Security,
  Speed,
  Star,
  LocationOn,
} from '@mui/icons-material';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Search color="primary" sx={{ fontSize: 40 }} />,
      title: 'Find Local Experts',
      description: 'Browse verified service providers in Winnipeg with ratings, reviews, and portfolios.',
    },
    {
      icon: <Security color="primary" sx={{ fontSize: 40 }} />,
      title: 'Secure Payments',
      description: 'Escrow payment system ensures your money is safe until the job is completed to your satisfaction.',
    },
    {
      icon: <Handshake color="primary" sx={{ fontSize: 40 }} />,
      title: 'Quality Guaranteed',
      description: 'All providers are vetted and jobs come with our quality guarantee and dispute resolution.',
    },
    {
      icon: <Speed color="primary" sx={{ fontSize: 40 }} />,
      title: 'Fast & Reliable',
      description: 'Get quotes quickly and track project progress with built-in communication tools.',
    },
  ];

  const popularCategories = [
    { name: 'Plumbing', jobs: '124 jobs', icon: '🔧' },
    { name: 'Electrical', jobs: '89 jobs', icon: '⚡' },
    { name: 'HVAC', jobs: '67 jobs', icon: '🌡️' },
    { name: 'Landscaping', jobs: '156 jobs', icon: '🌱' },
    { name: 'Snow Removal', jobs: '203 jobs', icon: '❄️' },
    { name: 'House Cleaning', jobs: '98 jobs', icon: '🧹' },
  ];

  const featuredProviders = [
    {
      name: 'John Smith',
      category: 'Plumbing',
      rating: 4.9,
      reviews: 24,
      image: '/api/placeholder/60/60',
      location: 'Downtown',
    },
    {
      name: 'Sarah Johnson',
      category: 'Electrical',
      rating: 4.8,
      reviews: 31,
      image: '/api/placeholder/60/60',
      location: 'River Heights',
    },
    {
      name: 'Mike Thompson',
      category: 'HVAC',
      rating: 4.7,
      reviews: 18,
      image: '/api/placeholder/60/60',
      location: 'St. Vital',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
          >
            Find Trusted Service Providers in Winnipeg
          </Typography>
          <Typography
            variant="h5"
            sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
          >
            Connect with verified local professionals for all your home and business needs
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/register"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': { backgroundColor: 'grey.100' },
                px: 4,
                py: 1.5,
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/jobs"
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                px: 4,
                py: 1.5,
              }}
            >
              Browse Jobs
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          fontWeight="bold"
        >
          Why Choose Winnipeg Connect?
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          Built specifically for Winnipeg's unique needs and weather conditions
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Popular Categories */}
      <Box sx={{ backgroundColor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            fontWeight="bold"
          >
            Popular Services
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            From seasonal snow removal to year-round home maintenance
          </Typography>
          
          <Grid container spacing={3}>
            {popularCategories.map((category, index) => (
              <Grid item xs={6} md={4} lg={2} key={index}>
                <Paper
                  component={RouterLink}
                  to={`/jobs?category=${encodeURIComponent(category.name)}`}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {category.icon}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.jobs}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Featured Providers */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          fontWeight="bold"
        >
          Top-Rated Providers
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          Trusted professionals with proven track records
        </Typography>
        
        <Grid container spacing={4}>
          {featuredProviders.map((provider, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={provider.image}
                    sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                  >
                    {provider.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {provider.name}
                  </Typography>
                  <Chip
                    label={provider.category}
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Rating value={provider.rating} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {provider.rating} ({provider.reviews} reviews)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {provider.location}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    variant="outlined"
                    component={RouterLink}
                    to={`/providers/${index + 1}`}
                  >
                    View Profile
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of satisfied customers and service providers in Winnipeg
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/register?role=seeker"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': { backgroundColor: 'grey.100' },
                px: 4,
                py: 1.5,
              }}
            >
              Find Services
            </Button>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/register?role=provider"
              sx={{
                backgroundColor: 'secondary.main',
                '&:hover': { backgroundColor: 'secondary.dark' },
                px: 4,
                py: 1.5,
              }}
            >
              Offer Services
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
