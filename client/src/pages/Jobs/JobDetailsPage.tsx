import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  ImageList,
  ImageListItem,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Rating,
} from '@mui/material';
import {
  LocationOn,
  AttachMoney,
  Schedule,
  Person,
  Star,
  Bookmark,
  BookmarkBorder,
  Share,
  Report,
  Edit,
  Delete,
  Send,
  Image as ImageIcon,
  ArrowBack,
  NavigateNext,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';

import { RootState, AppDispatch } from '../../store/store';
import { fetchJobById, saveJob, clearCurrentJob } from '../../store/slices/jobsSlice';
import { createQuote } from '../../store/slices/quotesSlice';
import { addNotification } from '../../store/slices/uiSlice';

interface QuoteFormData {
  price: {
    amount: number;
    type: 'fixed' | 'hourly';
  };
  estimatedDuration: {
    value: number;
    unit: 'hours' | 'days' | 'weeks' | 'months';
  };
  message: string;
  startDate?: string;
  includesSupplies: boolean;
  warranty: {
    offered: boolean;
    duration?: string;
  };
}

const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { currentJob, isLoading, error } = useSelector((state: RootState) => state.jobs);
  const { user } = useSelector((state: RootState) => state.auth);
  const { isLoading: quotesLoading } = useSelector((state: RootState) => state.quotes);

  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const { control, handleSubmit, formState: { errors }, watch, reset } = useForm<QuoteFormData>({
    defaultValues: {
      price: {
        amount: 0,
        type: 'fixed',
      },
      estimatedDuration: {
        value: 1,
        unit: 'days',
      },
      message: '',
      includesSupplies: false,
      warranty: {
        offered: false,
      },
    },
  });

  const priceType = watch('price.type');
  const warrantyOffered = watch('warranty.offered');

  useEffect(() => {
    if (id) {
      dispatch(fetchJobById(id));
    }

    // Check if we should open quote dialog
    if (searchParams.get('action') === 'quote') {
      setQuoteDialogOpen(true);
    }

    return () => {
      dispatch(clearCurrentJob());
    };
  }, [id, dispatch, searchParams]);

  const handleSaveJob = async () => {
    if (!currentJob || !user) return;
    try {
      await dispatch(saveJob(currentJob._id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: currentJob.isSaved ? 'Job removed from saved' : 'Job saved successfully',
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to save job',
      }));
    }
  };

  const onSubmitQuote = async (data: QuoteFormData) => {
    if (!currentJob) return;

    try {
      await dispatch(createQuote({
        job: currentJob._id,
        ...data,
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        title: 'Quote submitted successfully',
        message: 'The job poster will be notified of your quote.',
      }));

      setQuoteDialogOpen(false);
      reset();
      
      // Refresh job details to show new quote
      dispatch(fetchJobById(currentJob._id));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to submit quote',
        message: error.message || 'Please try again.',
      }));
    }
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

  const canSubmitQuote = () => {
    return user?.role === 'provider' && 
           currentJob?.status === 'open' && 
           currentJob?.canApply &&
           currentJob?.postedBy._id !== user._id;
  };

  const isJobOwner = () => {
    return user && currentJob && currentJob.postedBy._id === user._id;
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!currentJob) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Job not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" onClick={() => navigate('/jobs')} sx={{ cursor: 'pointer' }}>
          Jobs
        </Link>
        <Link color="inherit" onClick={() => navigate(`/jobs?category=${encodeURIComponent(currentJob.category)}`)} sx={{ cursor: 'pointer' }}>
          {currentJob.category}
        </Link>
        <Typography color="text.primary">{currentJob.title}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {/* Job Header */}
          <Paper sx={{ p: 4, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {currentJob.title}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={currentJob.category}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={currentJob.priority}
                    color={getPriorityColor(currentJob.priority) as any}
                    variant="outlined"
                  />
                  <Chip
                    label={currentJob.status}
                    color={currentJob.status === 'open' ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {formatBudget(currentJob)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {currentJob.location.address.suburb}, Winnipeg, MB
                    </Typography>
                  </Box>
                </Box>

                {currentJob.timeline?.startDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      Start Date: {new Date(currentJob.timeline.startDate).toLocaleDateString()}
                    </Typography>
                    {currentJob.timeline.estimatedDuration && (
                      <Typography variant="body1" sx={{ ml: 2 }}>
                        Duration: {currentJob.timeline.estimatedDuration}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {user?.role === 'provider' && (
                  <Tooltip title={currentJob.isSaved ? 'Remove from saved' : 'Save job'}>
                    <IconButton onClick={handleSaveJob} color={currentJob.isSaved ? 'primary' : 'default'}>
                      {currentJob.isSaved ? <Bookmark /> : <BookmarkBorder />}
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title="Share job">
                  <IconButton>
                    <Share />
                  </IconButton>
                </Tooltip>
                
                {isJobOwner() && (
                  <>
                    <Tooltip title="Edit job">
                      <IconButton onClick={() => navigate(`/jobs/${currentJob._id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete job">
                      <IconButton color="error">
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Job Description */}
          <Paper sx={{ p: 4, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Description
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
              {currentJob.description}
            </Typography>

            {currentJob.subcategories && currentJob.subcategories.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Subcategories:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {currentJob.subcategories.map((sub, index) => (
                    <Chip key={index} label={sub} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>

          {/* Job Images */}
          {currentJob.images && currentJob.images.length > 0 && (
            <Paper sx={{ p: 4, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Images
              </Typography>
              <ImageList cols={3} rowHeight={200} gap={8}>
                {currentJob.images.map((image, index) => (
                  <ImageListItem
                    key={index}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedImage(image.url);
                      setImageDialogOpen(true);
                    }}
                  >
                    <img
                      src={image.url}
                      alt={image.description || `Job image ${index + 1}`}
                      loading="lazy"
                      style={{ borderRadius: 8 }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Paper>
          )}

          {/* Requirements */}
          {currentJob.requirements && Object.values(currentJob.requirements).some(Boolean) && (
            <Paper sx={{ p: 4, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Requirements
              </Typography>
              <List dense>
                {currentJob.requirements.insurance && (
                  <ListItem>
                    <ListItemText primary="Insurance required" />
                  </ListItem>
                )}
                {currentJob.requirements.license && (
                  <ListItem>
                    <ListItemText primary="Valid license required" />
                  </ListItem>
                )}
                {currentJob.requirements.backgroundCheck && (
                  <ListItem>
                    <ListItemText primary="Background check required" />
                  </ListItem>
                )}
                {currentJob.requirements.minimumRating && (
                  <ListItem>
                    <ListItemText primary={`Minimum rating: ${currentJob.requirements.minimumRating} stars`} />
                  </ListItem>
                )}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Job Poster Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Posted by
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={currentJob.postedBy.avatar?.url}
                sx={{ width: 60, height: 60, mr: 2 }}
              >
                {currentJob.postedBy.firstName[0]}{currentJob.postedBy.lastName[0]}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {currentJob.postedBy.firstName} {currentJob.postedBy.lastName}
                </Typography>
                {currentJob.postedBy.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating value={currentJob.postedBy.rating.average} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({currentJob.postedBy.rating.count} reviews)
                    </Typography>
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  {currentJob.postedBy.location?.address?.suburb || 'Winnipeg'}
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Posted {new Date(currentJob.createdAt).toLocaleDateString()}
            </Typography>
            
            {!isJobOwner() && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Person />}
                sx={{ mb: 1 }}
              >
                View Profile
              </Button>
            )}
          </Paper>

          {/* Job Stats */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Statistics
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Views" 
                  secondary={currentJob.views} 
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Quotes Received" 
                  secondary={currentJob.quotes?.length || 0} 
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Saved by" 
                  secondary={`${currentJob.saves?.length || 0} providers`} 
                />
              </ListItem>
            </List>
          </Paper>

          {/* Action Buttons */}
          <Paper sx={{ p: 3 }}>
            {canSubmitQuote() && (
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<Send />}
                onClick={() => setQuoteDialogOpen(true)}
                sx={{ mb: 2 }}
              >
                Submit Quote
              </Button>
            )}

            {isJobOwner() && currentJob.quotes && currentJob.quotes.length > 0 && (
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => navigate(`/jobs/${currentJob._id}/quotes`)}
                sx={{ mb: 2 }}
              >
                View Quotes ({currentJob.quotes.length})
              </Button>
            )}

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Report />}
              color="error"
            >
              Report Job
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Quote Submission Dialog */}
      <Dialog
        open={quoteDialogOpen}
        onClose={() => setQuoteDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmitQuote)}>
          <DialogTitle>Submit Quote for "{currentJob.title}"</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Price */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="price.type"
                  control={control}
                  rules={{ required: 'Price type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.price?.type}>
                      <InputLabel>Price Type</InputLabel>
                      <Select {...field} label="Price Type">
                        <MenuItem value="fixed">Fixed Price</MenuItem>
                        <MenuItem value="hourly">Hourly Rate</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="price.amount"
                  control={control}
                  rules={{ 
                    required: 'Price is required',
                    min: { value: 1, message: 'Price must be greater than 0' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={priceType === 'hourly' ? 'Hourly Rate ($)' : 'Fixed Price ($)'}
                      type="number"
                      error={!!errors.price?.amount}
                      helperText={errors.price?.amount?.message}
                    />
                  )}
                />
              </Grid>

              {/* Duration */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="estimatedDuration.value"
                  control={control}
                  rules={{ 
                    required: 'Duration is required',
                    min: { value: 1, message: 'Duration must be at least 1' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Estimated Duration"
                      type="number"
                      error={!!errors.estimatedDuration?.value}
                      helperText={errors.estimatedDuration?.value?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="estimatedDuration.unit"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Duration Unit</InputLabel>
                      <Select {...field} label="Duration Unit">
                        <MenuItem value="hours">Hours</MenuItem>
                        <MenuItem value="days">Days</MenuItem>
                        <MenuItem value="weeks">Weeks</MenuItem>
                        <MenuItem value="months">Months</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Start Date */}
              <Grid item xs={12}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Earliest Start Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              {/* Message */}
              <Grid item xs={12}>
                <Controller
                  name="message"
                  control={control}
                  rules={{ 
                    required: 'Message is required',
                    minLength: { value: 10, message: 'Message must be at least 10 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Message to Client"
                      multiline
                      rows={4}
                      error={!!errors.message}
                      helperText={errors.message?.message || 'Explain your approach, experience, and why you\'re the right fit'}
                    />
                  )}
                />
              </Grid>

              {/* Additional Options */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="includesSupplies"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <FormControl component="fieldset">
                      <Typography variant="body2" gutterBottom>
                        Supplies and Materials
                      </Typography>
                      <Select
                        value={value ? 'included' : 'not-included'}
                        onChange={(e) => onChange(e.target.value === 'included')}
                        size="small"
                      >
                        <MenuItem value="not-included">Not included</MenuItem>
                        <MenuItem value="included">Included in price</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="warranty.offered"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <FormControl component="fieldset">
                      <Typography variant="body2" gutterBottom>
                        Warranty
                      </Typography>
                      <Select
                        value={value ? 'offered' : 'not-offered'}
                        onChange={(e) => onChange(e.target.value === 'offered')}
                        size="small"
                      >
                        <MenuItem value="not-offered">No warranty</MenuItem>
                        <MenuItem value="offered">Warranty included</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {warrantyOffered && (
                <Grid item xs={12}>
                  <Controller
                    name="warranty.duration"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Warranty Duration"
                        placeholder="e.g., 1 year, 6 months"
                        size="small"
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQuoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={quotesLoading}
            >
              {quotesLoading ? 'Submitting...' : 'Submit Quote'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <img
            src={selectedImage}
            alt="Job image"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobDetailsPage;
