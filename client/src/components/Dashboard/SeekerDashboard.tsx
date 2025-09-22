import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CardActions,
} from '@mui/material';
import {
  Add,
  Work,
  People,
  AttachMoney,
  Schedule,
  MoreVert,
  Message,
  Star,
  LocationOn,
  Visibility,
} from '@mui/icons-material';

import { RootState, AppDispatch } from '../../store/store';
import { fetchMyJobs } from '../../store/slices/jobsSlice';
import { fetchPopularCategories } from '../../store/slices/categoriesSlice';

const SeekerDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { myJobs, isLoading } = useSelector((state: RootState) => state.jobs);
  const { popularCategories } = useSelector((state: RootState) => state.categories);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  useEffect(() => {
    dispatch(fetchMyJobs({ page: 1, limit: 5 }));
    dispatch(fetchPopularCategories(6));
  }, [dispatch]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Mock data for demonstration
  const mockStats = {
    totalJobsPosted: 5,
    activeJobs: 2,
    completedJobs: 3,
    totalSpent: 2850,
    averageBudget: 570,
  };

  const mockRecentActivity = [
    {
      id: 1,
      type: 'quote_received',
      title: 'New quote for Kitchen Repair',
      description: 'John Smith submitted a quote for $250',
      time: '1 hour ago',
      status: 'info',
    },
    {
      id: 2,
      type: 'job_completed',
      title: 'Bathroom Renovation Completed',
      description: 'Project completed successfully',
      time: '2 days ago',
      status: 'success',
    },
    {
      id: 3,
      type: 'provider_message',
      title: 'Message from Sarah Johnson',
      description: 'Regarding your electrical work request',
      time: '3 days ago',
      status: 'info',
    },
  ];

  const mockFeaturedProviders = [
    {
      id: 1,
      name: 'John Smith',
      category: 'Plumbing',
      rating: 4.9,
      reviews: 24,
      location: 'Downtown',
      hourlyRate: 85,
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      category: 'Electrical',
      rating: 4.8,
      reviews: 31,
      location: 'River Heights',
      hourlyRate: 95,
    },
    {
      id: 3,
      name: 'Mike Thompson',
      category: 'HVAC',
      rating: 4.7,
      reviews: 18,
      location: 'St. Vital',
      hourlyRate: 90,
    },
  ];

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'in_progress': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        {!user?.isProfileComplete && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Complete your profile to get better matches and faster responses.
            <Button component={RouterLink} to="/profile" sx={{ ml: 2 }}>
              Complete Profile
            </Button>
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Box>
                  <Typography variant="h6">{mockStats.totalJobsPosted}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Jobs Posted
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h6">{mockStats.activeJobs}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Jobs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h6">{mockStats.completedJobs}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h6">${mockStats.totalSpent}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Spent
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Jobs */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">My Jobs</Typography>
              <Button
                component={RouterLink}
                to="/jobs/create"
                variant="contained"
                startIcon={<Add />}
                size="small"
              >
                Post New Job
              </Button>
            </Box>

            {isLoading ? (
              <LinearProgress />
            ) : myJobs.length > 0 ? (
              <List>
                {myJobs.slice(0, 5).map((job, index) => (
                  <React.Fragment key={job._id}>
                    <ListItem
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={job.status}
                            color={getJobStatusColor(job.status) as any}
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {job.quotes.length} quotes
                          </Typography>
                          <IconButton onClick={handleMenuClick}>
                            <MoreVert />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={job.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {job.budget.type === 'fixed' && `$${job.budget.amount}`}
                              {job.budget.type === 'range' && `$${job.budget.range?.min} - $${job.budget.range?.max}`}
                              {job.budget.type === 'hourly' && `$${job.budget.hourlyRate}/hr`}
                              {' • '}{job.category}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Posted {new Date(job.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < myJobs.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No jobs posted yet
                </Typography>
                <Button
                  component={RouterLink}
                  to="/jobs/create"
                  variant="contained"
                  startIcon={<Add />}
                >
                  Post Your First Job
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            
            <List dense>
              {mockRecentActivity.map((activity) => (
                <ListItem key={activity.id} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: activity.status === 'success' ? 'success.main' : 'info.main',
                        width: 32,
                        height: 32,
                      }}
                    >
                      {activity.type === 'quote_received' && <Work />}
                      {activity.type === 'job_completed' && <Star />}
                      {activity.type === 'provider_message' && <Message />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={500}>
                        {activity.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Popular Categories */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Popular Services
            </Typography>
            <Grid container spacing={2}>
              {popularCategories.slice(0, 6).map((category) => (
                <Grid item xs={6} sm={4} key={category._id}>
                  <Card 
                    component={RouterLink}
                    to={`/jobs?category=${encodeURIComponent(category.name)}`}
                    sx={{ 
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': { transform: 'translateY(-2px)' },
                      transition: 'transform 0.2s',
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {category.icon || '🔧'}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {category.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Featured Providers */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Top Providers</Typography>
              <Button
                component={RouterLink}
                to="/providers"
                variant="outlined"
                size="small"
              >
                View All
              </Button>
            </Box>
            
            <List>
              {mockFeaturedProviders.map((provider, index) => (
                <React.Fragment key={provider.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {provider.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {provider.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                            <Typography variant="caption">
                              {provider.rating}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {provider.category} • ${provider.hourlyRate}/hr
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <LocationOn sx={{ fontSize: 12, mr: 0.5 }} />
                            <Typography variant="caption" color="text.secondary">
                              {provider.location}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Button
                      component={RouterLink}
                      to={`/providers/${provider.id}`}
                      size="small"
                      startIcon={<Visibility />}
                    >
                      View
                    </Button>
                  </ListItem>
                  {index < mockFeaturedProviders.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  component={RouterLink}
                  to="/jobs/create"
                  variant="outlined"
                  fullWidth
                  startIcon={<Add />}
                  sx={{ py: 1.5 }}
                >
                  Post New Job
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  component={RouterLink}
                  to="/providers"
                  variant="outlined"
                  fullWidth
                  startIcon={<People />}
                  sx={{ py: 1.5 }}
                >
                  Browse Providers
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  component={RouterLink}
                  to="/messages"
                  variant="outlined"
                  fullWidth
                  startIcon={<Message />}
                  sx={{ py: 1.5 }}
                >
                  Messages
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  component={RouterLink}
                  to="/profile"
                  variant="outlined"
                  fullWidth
                  startIcon={<Star />}
                  sx={{ py: 1.5 }}
                >
                  My Profile
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Menu for job actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
        <MenuItem onClick={handleMenuClose}>Edit Job</MenuItem>
        <MenuItem onClick={handleMenuClose}>View Quotes</MenuItem>
        <MenuItem onClick={handleMenuClose}>Close Job</MenuItem>
      </Menu>
    </Box>
  );
};

export default SeekerDashboard;
