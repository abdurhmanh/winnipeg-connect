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
  Slider,
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
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  AttachMoney,
  Schedule,
  Visibility,
  BookmarkBorder,
  Bookmark,
  Sort,
  TuneRounded,
} from '@mui/icons-material';

import { RootState, AppDispatch } from '../../store/store';
import { fetchJobs, setFilters, saveJob } from '../../store/slices/jobsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';

const JobsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  const { jobs, pagination, filters, isLoading, error } = useSelector((state: RootState) => state.jobs);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { user } = useSelector((state: RootState) => state.auth);

  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minBudget: parseInt(searchParams.get('minBudget') || '0') || 0,
    maxBudget: parseInt(searchParams.get('maxBudget') || '5000') || 5000,
    priority: searchParams.get('priority') || '',
    sort: searchParams.get('sort') || 'newest',
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    // Load jobs based on current filters
    const params = {
      page: 1,
      limit: 12,
      filters: {
        search: localFilters.search || undefined,
        category: localFilters.category || undefined,
        minBudget: localFilters.minBudget > 0 ? localFilters.minBudget : undefined,
        maxBudget: localFilters.maxBudget < 5000 ? localFilters.maxBudget : undefined,
        priority: localFilters.priority || undefined,
      },
      sort: localFilters.sort,
    };

    dispatch(fetchJobs(params));
    dispatch(setFilters(params.filters));
  }, [dispatch, localFilters]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    // Update URL params
    const newParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== '' && v !== 0 && v !== 5000) {
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
    dispatch(fetchJobs(params));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveJob = async (jobId: string) => {
    if (!user) return;
    try {
      await dispatch(saveJob(jobId)).unwrap();
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const handleSortChange = (sortOption: string) => {
    handleFilterChange('sort', sortOption);
    setSortMenuAnchor(null);
  };

  const formatBudget = (job: any) => {
    switch (job.budget.type) {
      case 'fixed':
        return `$${job.budget.amount}`;
      case 'hourly':
        return `$${job.budget.hourlyRate}/hr`;
      case 'range':
        return `$${job.budget.range.min} - $${job.budget.range.max}`;
      default:
        return 'Budget TBD';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'budget_high', label: 'Highest Budget' },
    { value: 'budget_low', label: 'Lowest Budget' },
    { value: 'urgent', label: 'Most Urgent' },
  ];

  const FilterPanel = () => (
    <Box sx={{ p: isMobile ? 2 : 0 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>

      {/* Search */}
      <TextField
        fullWidth
        label="Search jobs"
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

      {/* Budget Range */}
      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Budget Range</Typography>
        <Slider
          value={[localFilters.minBudget, localFilters.maxBudget]}
          onChange={(e, newValue) => {
            const [min, max] = newValue as number[];
            handleFilterChange('minBudget', min);
            handleFilterChange('maxBudget', max);
          }}
          valueLabelDisplay="auto"
          min={0}
          max={5000}
          step={50}
          marks={[
            { value: 0, label: '$0' },
            { value: 1000, label: '$1K' },
            { value: 2500, label: '$2.5K' },
            { value: 5000, label: '$5K+' },
          ]}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2">${localFilters.minBudget}</Typography>
          <Typography variant="body2">${localFilters.maxBudget}</Typography>
        </Box>
      </Box>

      {/* Priority */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Priority</InputLabel>
        <Select
          value={localFilters.priority}
          label="Priority"
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <MenuItem value="">All Priorities</MenuItem>
          <MenuItem value="urgent">Urgent</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
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
            minBudget: 0,
            maxBudget: 5000,
            priority: '',
            sort: 'newest',
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
          Find Jobs in Winnipeg
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse available service jobs and submit your quotes
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
              {pagination.total} jobs found
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

          {/* Jobs Grid */}
          {!isLoading && (
            <>
              <Grid container spacing={3}>
                {jobs.map((job) => (
                  <Grid item xs={12} sm={6} lg={4} key={job._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" component="h3" gutterBottom>
                              {job.title}
                            </Typography>
                            <Chip
                              label={job.category}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mb: 1 }}
                            />
                          </Box>
                          
                          {user?.role === 'provider' && (
                            <IconButton
                              size="small"
                              onClick={() => handleSaveJob(job._id)}
                              color={job.isSaved ? 'primary' : 'default'}
                            >
                              {job.isSaved ? <Bookmark /> : <BookmarkBorder />}
                            </IconButton>
                          )}
                        </Box>

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
                          {job.description}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AttachMoney sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="body2" fontWeight={500}>
                              {formatBudget(job)}
                            </Typography>
                          </Box>
                          
                          <Chip
                            label={job.priority}
                            size="small"
                            color={getPriorityColor(job.priority) as any}
                            variant="outlined"
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {job.location.address.suburb}, Winnipeg
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              src={job.postedBy.avatar?.url}
                              sx={{ width: 24, height: 24, mr: 1 }}
                            >
                              {job.postedBy.firstName[0]}
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              {job.postedBy.firstName} {job.postedBy.lastName}
                            </Typography>
                          </Box>
                          
                          <Typography variant="caption" color="text.secondary">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </CardContent>

                      <Divider />
                      
                      <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                        <Button
                          component={RouterLink}
                          to={`/jobs/${job._id}`}
                          size="small"
                          startIcon={<Visibility />}
                        >
                          View Details
                        </Button>
                        
                        {user?.role === 'provider' && job.canApply && (
                          <Button
                            component={RouterLink}
                            to={`/jobs/${job._id}?action=quote`}
                            variant="contained"
                            size="small"
                          >
                            Submit Quote
                          </Button>
                        )}

                        <Typography variant="caption" color="text.secondary">
                          {job.quotes.length} quotes
                        </Typography>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Empty State */}
              {jobs.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" gutterBottom>
                    No jobs found
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
                        minBudget: 0,
                        maxBudget: 5000,
                        priority: '',
                        sort: 'newest',
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

export default JobsPage;
