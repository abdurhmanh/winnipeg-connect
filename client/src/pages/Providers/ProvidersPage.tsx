import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Pagination,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Drawer,
  useTheme,
  useMediaQuery,
  Badge,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Star,
  Message,
  Visibility,
  Sort,
  TuneRounded,
  Work,
  Verified,
  Schedule,
} from '@mui/icons-material';

import { RootState, AppDispatch } from '../../store/store';
import { fetchProviders, setFilters } from '../../store/slices/providersSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { startChat } from '../../store/slices/messagesSlice';

const ProvidersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  const { providers, pagination, filters, isLoading, error } = useSelector((state: RootState) => state.providers);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { user } = useSelector((state: RootState) => state.auth);

  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minRating: parseFloat(searchParams.get('minRating') || '0') || 0,
    sort: searchParams.get('sort') || 'rating',
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    // Load providers based on current filters
    const params = {
      page: 1,
      limit: 12,
      filters: {
        search: localFilters.search || undefined,
        category: localFilters.category || undefined,
        minRating: localFilters.minRating > 0 ? localFilters.minRating : undefined,
        sort: localFilters.sort,
      },
    };

    dispatch(fetchProviders(params));
    dispatch(setFilters(params.filters));
  }, [dispatch, localFilters]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    // Update URL params
    const newParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== '' && v !== 0) {
        newParams.set(k, v.toString());
      }
    });
    setSearchParams(newParams);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    const params = {
      page: value,
      limit: 12,
      filters,
      sort: localFilters.sort,
    };
    dispatch(fetchProviders(params));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactProvider = async (providerId: string) => {
    if (!user) return;
    
    try {
      const result = await dispatch(startChat({
        userId: providerId,
        initialMessage: 'Hi! I\'m interested in your services.',
      })).unwrap();
      
      // Navigate to chat
      window.location.href = `/messages?chat=${result.chatId}`;
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const handleSortChange = (sortOption: string) => {
    handleFilterChange('sort', sortOption);
    setSortMenuAnchor(null);
  };

  const formatRate = (provider: any) => {
    if (provider.rates?.hourly) {
      return `$${provider.rates.hourly}/hr`;
    }
    if (provider.rates?.fixed) {
      return `$${provider.rates.fixed.min} - $${provider.rates.fixed.max}`;
    }
    return 'Rate on request';
  };

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest Members' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'price_low', label: 'Lowest Price' },
    { value: 'price_high', label: 'Highest Price' },
  ];

  const FilterPanel = () => (
    <Box sx={{ p: isMobile ? 2 : 0 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>

      {/* Search */}
      <TextField
        fullWidth
        label="Search providers"
        value={localFilters.search}
        onChange={(e) => handleFilterChange('search', e.target.value)}
        InputProps={{
          startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
        }}
        sx={{ mb: 3 }}
      />

      {/* Category */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Category</InputLabel>
        <Select
          value={localFilters.category}
          label="Category"
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category._id} value={category.name}>
              {category.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Minimum Rating */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Minimum Rating</InputLabel>
        <Select
          value={localFilters.minRating}
          label="Minimum Rating"
          onChange={(e) => handleFilterChange('minRating', e.target.value)}
        >
          <MenuItem value={0}>Any Rating</MenuItem>
          <MenuItem value={3}>3+ Stars</MenuItem>
          <MenuItem value={4}>4+ Stars</MenuItem>
          <MenuItem value={4.5}>4.5+ Stars</MenuItem>
          <MenuItem value={4.8}>4.8+ Stars</MenuItem>
        </Select>
      </FormControl>

      {/* Clear Filters */}
      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          setLocalFilters({
            search: '',
            category: '',
            minRating: 0,
            sort: 'rating',
          });
          setSearchParams(new URLSearchParams());
        }}
      >
        Clear All Filters
      </Button>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Find Service Providers in Winnipeg
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse verified professionals for all your home and business needs
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Desktop Filters Sidebar */}
        {!isMobile && (
          <Grid item md={3}>
            <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
              <FilterPanel />
            </Paper>
          </Grid>
        )}

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {/* Controls Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {pagination.total} providers found
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {isMobile && (
                <Button
                  variant="outlined"
                  startIcon={<TuneRounded />}
                  onClick={() => setDrawerOpen(true)}
                >
                  Filters
                </Button>
              )}

              <Button
                variant="outlined"
                startIcon={<Sort />}
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
              >
                {sortOptions.find(opt => opt.value === localFilters.sort)?.label}
              </Button>
            </Box>
          </Box>

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Providers Grid */}
          {!isLoading && (
            <>
              <Grid container spacing={3}>
                {providers.map((provider) => (
                  <Grid item xs={12} sm={6} lg={4} key={provider._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flex: 1 }}>
                        {/* Provider Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            src={provider.avatar?.url}
                            sx={{ width: 60, height: 60, mr: 2 }}
                          >
                            {provider.firstName[0]}{provider.lastName[0]}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="bold">
                              {provider.firstName} {provider.lastName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Rating value={provider.rating.average} readOnly size="small" />
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {provider.rating.average.toFixed(1)} ({provider.rating.count} reviews)
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {provider.address.suburb}
                              </Typography>
                              {provider.distance && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                  • {provider.distance.toFixed(1)}km away
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>

                        {/* Categories */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {provider.categories.slice(0, 3).map((category, index) => (
                              <Chip
                                key={index}
                                label={category}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                            {provider.categories.length > 3 && (
                              <Chip
                                label={`+${provider.categories.length - 3} more`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Bio */}
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {provider.bio}
                        </Typography>

                        {/* Rate and Availability */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight={500}>
                            {formatRate(provider)}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: provider.isActive ? 'success.main' : 'grey.400',
                                mr: 1,
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {provider.isActive ? 'Available' : 'Busy'}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Skills */}
                        {provider.skills && provider.skills.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                              Skills:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {provider.skills.slice(0, 4).map((skill, index) => (
                                <Chip
                                  key={index}
                                  label={skill}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              ))}
                              {provider.skills.length > 4 && (
                                <Chip
                                  label={`+${provider.skills.length - 4}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* Certifications Badge */}
                        {provider.certifications && provider.certifications.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Chip
                              icon={<Verified />}
                              label={`${provider.certifications.length} Certification${provider.certifications.length > 1 ? 's' : ''}`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </CardContent>

                      <Divider />
                      
                      <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                        <Button
                          component={RouterLink}
                          to={`/providers/${provider._id}`}
                          size="small"
                          startIcon={<Visibility />}
                        >
                          View Profile
                        </Button>
                        
                        {user && user._id !== provider._id && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Message />}
                            onClick={() => handleContactProvider(provider._id)}
                          >
                            Contact
                          </Button>
                        )}

                        <Typography variant="caption" color="text.secondary">
                          Last active: {new Date(provider.lastActive).toLocaleDateString()}
                        </Typography>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Empty State */}
              {providers.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" gutterBottom>
                    No providers found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Try adjusting your filters or search terms
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setLocalFilters({
                        search: '',
                        category: '',
                        minRating: 0,
                        sort: 'rating',
                      });
                      setSearchParams(new URLSearchParams());
                    }}
                  >
                    Clear Filters
                  </Button>
                </Box>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={pagination.pages}
                    page={pagination.current}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* Mobile Filters Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            maxWidth: '80vw',
          },
        }}
      >
        <FilterPanel />
      </Drawer>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        {sortOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            selected={localFilters.sort === option.value}
          >
            <ListItemIcon>
              <Sort />
            </ListItemIcon>
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>
    </Container>
  );
};

export default ProvidersPage;
