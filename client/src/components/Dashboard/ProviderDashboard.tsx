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
} from '@mui/material';
import {
  TrendingUp,
  Work,
  Star,
  AttachMoney,
  Notifications,
  MoreVert,
  Add,
  Message,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';

import { RootState, AppDispatch } from '../../store/store';
import { fetchMyQuotes } from '../../store/slices/quotesSlice';

const ProviderDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { myQuotes, stats, isLoading } = useSelector((state: RootState) => state.quotes);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  useEffect(() => {
    dispatch(fetchMyQuotes({ page: 1, limit: 5 }));
  }, [dispatch]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Mock data for demonstration
  const mockStats = {
    totalQuotes: 12,
    acceptedQuotes: 8,
    pendingQuotes: 3,
    rejectedQuotes: 1,
    totalEarnings: 4250,
    pendingEarnings: 1200,
    averageRating: user?.rating?.average || 4.8,
    totalReviews: user?.rating?.count || 15,
  };

  const mockRecentActivity = [
    {
      id: 1,
      type: 'quote_accepted',
      title: 'Kitchen Sink Repair',
      description: 'Your quote of $250 was accepted',
      time: '2 hours ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'new_job',
      title: 'Bathroom Renovation',
      description: 'New job matching your skills',
      time: '5 hours ago',
      status: 'info',
    },
    {
      id: 3,
      type: 'review_received',
      title: 'New 5-star review',
      description: 'Great work on the plumbing repair!',
      time: '1 day ago',
      status: 'success',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        {!user?.isProfileComplete && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Complete your profile to start receiving job opportunities.
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
                  <Typography variant="h6">{mockStats.totalQuotes}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Quotes
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
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h6">{mockStats.acceptedQuotes}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accepted Quotes
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
                  <Typography variant="h6">${mockStats.totalEarnings}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Earnings
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
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h6">{mockStats.averageRating}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Rating ({mockStats.totalReviews})
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Quotes */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Quotes</Typography>
              <Button
                component={RouterLink}
                to="/quotes"
                variant="outlined"
                size="small"
              >
                View All
              </Button>
            </Box>

            {isLoading ? (
              <LinearProgress />
            ) : myQuotes.length > 0 ? (
              <List>
                {myQuotes.slice(0, 5).map((quote, index) => (
                  <React.Fragment key={quote._id}>
                    <ListItem
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={quote.status}
                            color={getStatusColor(quote.status) as any}
                            size="small"
                          />
                          <IconButton onClick={handleMenuClick}>
                            <MoreVert />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={quote.job.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              ${quote.price.amount} • {quote.job.category}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Submitted {new Date(quote.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < myQuotes.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No quotes submitted yet
                </Typography>
                <Button
                  component={RouterLink}
                  to="/jobs"
                  variant="contained"
                  startIcon={<Add />}
                >
                  Browse Jobs
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
                      {activity.type === 'quote_accepted' && <CheckCircle />}
                      {activity.type === 'new_job' && <Work />}
                      {activity.type === 'review_received' && <Star />}
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
                  to="/jobs"
                  variant="outlined"
                  fullWidth
                  startIcon={<Work />}
                  sx={{ py: 1.5 }}
                >
                  Browse Jobs
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  component={RouterLink}
                  to="/profile"
                  variant="outlined"
                  fullWidth
                  startIcon={<TrendingUp />}
                  sx={{ py: 1.5 }}
                >
                  Update Profile
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
                  to="/schedule"
                  variant="outlined"
                  fullWidth
                  startIcon={<Schedule />}
                  sx={{ py: 1.5 }}
                >
                  Schedule
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Menu for quote actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
        <MenuItem onClick={handleMenuClose}>Edit Quote</MenuItem>
        <MenuItem onClick={handleMenuClose}>Withdraw</MenuItem>
      </Menu>
    </Box>
  );
};

export default ProviderDashboard;
