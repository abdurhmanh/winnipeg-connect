import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  IconButton,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Add,
  Delete,
  CloudUpload,
  LocationOn,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

import { RootState, AppDispatch } from '../../store/store';
import { createJob, updateJob, fetchJobById } from '../../store/slices/jobsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { addNotification } from '../../store/slices/uiSlice';

interface JobFormData {
  title: string;
  description: string;
  category: string;
  subcategories: string[];
  budget: {
    type: 'fixed' | 'hourly' | 'range';
    amount?: number;
    hourlyRate?: number;
    range?: {
      min: number;
      max: number;
    };
  };
  timeline: {
    startDate?: string;
    endDate?: string;
    estimatedDuration?: string;
    isFlexible: boolean;
  };
  location: {
    address: {
      street: string;
      suburb: string;
      postalCode: string;
    };
    isRemote: boolean;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requirements: {
    insurance: boolean;
    license: boolean;
    backgroundCheck: boolean;
    minimumRating?: number;
  };
  responseTime: 'asap' | 'within_24h' | 'within_week' | 'flexible';
  images?: File[];
}

const steps = ['Basic Details', 'Budget & Timeline', 'Location & Requirements'];

// Winnipeg suburbs
const winnipegSuburbs = [
  'Downtown', 'West End', 'North End', 'East Kildonan', 'West Kildonan',
  'River Heights', 'Tuxedo', 'Fort Rouge', 'Osborne Village', 'Corydon',
  'St. Boniface', 'St. Vital', 'Transcona', 'Charleswood', 'Westwood',
  'Garden City', 'Maples', 'Old Kildonan', 'Seven Oaks', 'Point Douglas',
  'Elmwood', 'East End', 'Norwood', 'St. James', 'Polo Park'
];

const CreateJobPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { categories } = useSelector((state: RootState) => state.categories);
  const { currentJob, isLoading } = useSelector((state: RootState) => state.jobs);
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeStep, setActiveStep] = useState(0);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const isEditing = Boolean(id);

  const { control, handleSubmit, formState: { errors }, watch, trigger, setValue, reset } = useForm<JobFormData>({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      subcategories: [],
      budget: {
        type: 'fixed',
        amount: 0,
      },
      timeline: {
        isFlexible: true,
        estimatedDuration: '',
      },
      location: {
        address: {
          street: '',
          suburb: '',
          postalCode: '',
        },
        isRemote: false,
      },
      priority: 'medium',
      requirements: {
        insurance: false,
        license: false,
        backgroundCheck: false,
      },
      responseTime: 'flexible',
    },
  });

  const budgetType = watch('budget.type');
  const selectedCategory = watch('category');

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchJobById(id));
    }
  }, [isEditing, id, dispatch]);

  useEffect(() => {
    if (isEditing && currentJob) {
      // Populate form with existing job data
      reset({
        title: currentJob.title,
        description: currentJob.description,
        category: currentJob.category,
        subcategories: currentJob.subcategories || [],
        budget: currentJob.budget,
        timeline: {
          startDate: currentJob.timeline?.startDate 
            ? new Date(currentJob.timeline.startDate).toISOString().split('T')[0] 
            : '',
          endDate: currentJob.timeline?.endDate 
            ? new Date(currentJob.timeline.endDate).toISOString().split('T')[0] 
            : '',
          estimatedDuration: currentJob.timeline?.estimatedDuration || '',
          isFlexible: currentJob.timeline?.isFlexible || true,
        },
        location: {
          address: currentJob.location.address,
          isRemote: currentJob.location.isRemote,
        },
        priority: currentJob.priority,
        requirements: currentJob.requirements,
        responseTime: currentJob.responseTime,
      });
    }
  }, [isEditing, currentJob, reset]);

  const handleNext = async () => {
    let fieldsToValidate: (keyof JobFormData)[] = [];
    
    switch (activeStep) {
      case 0:
        fieldsToValidate = ['title', 'description', 'category'];
        break;
      case 1:
        fieldsToValidate = ['budget'];
        break;
      case 2:
        fieldsToValidate = ['location'];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      if (activeStep === steps.length - 1) {
        handleSubmit(onSubmit)();
      } else {
        setActiveStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedImages.length > 5) {
      dispatch(addNotification({
        type: 'warning',
        title: 'Too many images',
        message: 'You can upload a maximum of 5 images.',
      }));
      return;
    }

    setSelectedImages((prev) => [...prev, ...files]);
    
    // Create preview URLs
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrls((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: JobFormData) => {
    try {
      const jobData = {
        ...data,
        images: selectedImages,
      };

      if (isEditing && id) {
        await dispatch(updateJob({ jobId: id, jobData })).unwrap();
        dispatch(addNotification({
          type: 'success',
          title: 'Job updated successfully',
        }));
        navigate(`/jobs/${id}`);
      } else {
        const result = await dispatch(createJob(jobData)).unwrap();
        dispatch(addNotification({
          type: 'success',
          title: 'Job posted successfully',
          message: 'Your job is now live and visible to service providers.',
        }));
        navigate(`/jobs/${result._id}`);
      }
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: isEditing ? 'Failed to update job' : 'Failed to create job',
        message: error.message || 'Please try again.',
      }));
    }
  };

  // Get subcategories based on selected category
  const getSubcategories = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.subcategories || [];
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                rules={{ 
                  required: 'Job title is required',
                  minLength: { value: 5, message: 'Title must be at least 5 characters' },
                  maxLength: { value: 100, message: 'Title must be less than 100 characters' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Job Title"
                    placeholder="e.g., Kitchen Sink Repair Needed"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                rules={{ 
                  required: 'Job description is required',
                  minLength: { value: 20, message: 'Description must be at least 20 characters' },
                  maxLength: { value: 2000, message: 'Description must be less than 2000 characters' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Job Description"
                    multiline
                    rows={6}
                    placeholder="Describe the work needed, any specific requirements, and what you expect from the service provider..."
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.category}>
                    <InputLabel>Category</InputLabel>
                    <Select {...field} label="Category">
                      {categories.map((category) => (
                        <MenuItem key={category._id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select {...field} label="Priority">
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {selectedCategory && getSubcategories(selectedCategory).length > 0 && (
              <Grid item xs={12}>
                <Controller
                  name="subcategories"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      multiple
                      options={getSubcategories(selectedCategory).map(sub => sub.name)}
                      value={value}
                      onChange={(_, newValue) => onChange(newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={option}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Subcategories (Optional)"
                          placeholder="Select specific services needed"
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Controller
                name="responseTime"
                control={control}
                render={({ field }) => (
                  <FormControl component="fieldset">
                    <FormLabel component="legend">How quickly do you need responses?</FormLabel>
                    <RadioGroup {...field} row>
                      <FormControlLabel value="asap" control={<Radio />} label="ASAP" />
                      <FormControlLabel value="within_24h" control={<Radio />} label="Within 24 hours" />
                      <FormControlLabel value="within_week" control={<Radio />} label="Within a week" />
                      <FormControlLabel value="flexible" control={<Radio />} label="Flexible" />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Image Upload */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Images (Optional)
              </Typography>
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  multiple
                  type="file"
                  onChange={handleImageUpload}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    disabled={selectedImages.length >= 5}
                  >
                    Upload Images ({selectedImages.length}/5)
                  </Button>
                </label>
              </Box>
              
              {previewUrls.length > 0 && (
                <Grid container spacing={2}>
                  {previewUrls.map((url, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Card>
                        <Box sx={{ position: 'relative' }}>
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: '100%',
                              height: 120,
                              objectFit: 'cover',
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="budget.type"
                control={control}
                render={({ field }) => (
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Budget Type</FormLabel>
                    <RadioGroup {...field} row>
                      <FormControlLabel value="fixed" control={<Radio />} label="Fixed Price" />
                      <FormControlLabel value="hourly" control={<Radio />} label="Hourly Rate" />
                      <FormControlLabel value="range" control={<Radio />} label="Budget Range" />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>

            {budgetType === 'fixed' && (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="budget.amount"
                  control={control}
                  rules={{ 
                    required: 'Budget amount is required',
                    min: { value: 1, message: 'Budget must be greater than 0' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Fixed Budget ($)"
                      type="number"
                      error={!!errors.budget?.amount}
                      helperText={errors.budget?.amount?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {budgetType === 'hourly' && (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="budget.hourlyRate"
                  control={control}
                  rules={{ 
                    required: 'Hourly rate is required',
                    min: { value: 1, message: 'Rate must be greater than 0' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Maximum Hourly Rate ($)"
                      type="number"
                      error={!!errors.budget?.hourlyRate}
                      helperText={errors.budget?.hourlyRate?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {budgetType === 'range' && (
              <>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="budget.range.min"
                    control={control}
                    rules={{ 
                      required: 'Minimum budget is required',
                      min: { value: 1, message: 'Budget must be greater than 0' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Minimum Budget ($)"
                        type="number"
                        error={!!errors.budget?.range?.min}
                        helperText={errors.budget?.range?.min?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="budget.range.max"
                    control={control}
                    rules={{ 
                      required: 'Maximum budget is required',
                      min: { value: 1, message: 'Budget must be greater than 0' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Maximum Budget ($)"
                        type="number"
                        error={!!errors.budget?.range?.max}
                        helperText={errors.budget?.range?.max?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6}>
              <Controller
                name="timeline.startDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Preferred Start Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="timeline.endDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Preferred End Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="timeline.estimatedDuration"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Estimated Duration (Optional)"
                    placeholder="e.g., 2-3 hours, 1 day, 1 week"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="timeline.isFlexible"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                      />
                    }
                    label="I'm flexible with the timeline"
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="location.address.street"
                control={control}
                rules={{ required: 'Street address is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Street Address"
                    error={!!errors.location?.address?.street}
                    helperText={errors.location?.address?.street?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="location.address.suburb"
                control={control}
                rules={{ required: 'Suburb is required' }}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete
                    value={value}
                    onChange={(_, newValue) => onChange(newValue || '')}
                    options={winnipegSuburbs}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Suburb"
                        error={!!errors.location?.address?.suburb}
                        helperText={errors.location?.address?.suburb?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="location.address.postalCode"
                control={control}
                rules={{ 
                  required: 'Postal code is required',
                  pattern: {
                    value: /^R\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
                    message: 'Invalid Winnipeg postal code (should start with R)'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Postal Code"
                    placeholder="R3C 1A1"
                    error={!!errors.location?.address?.postalCode}
                    helperText={errors.location?.address?.postalCode?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="location.isRemote"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                      />
                    }
                    label="This work can be done remotely"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Requirements
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="requirements.insurance"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                      />
                    }
                    label="Insurance required"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="requirements.license"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                      />
                    }
                    label="Valid license required"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="requirements.backgroundCheck"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                      />
                    }
                    label="Background check required"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="requirements.minimumRating"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Minimum Rating (Optional)"
                    type="number"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                    placeholder="e.g., 4.0"
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (!user || user.role !== 'seeker') {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Only job seekers can create jobs. Please ensure you're logged in with a seeker account.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/jobs')}
          sx={{ mb: 2 }}
        >
          Back to Jobs
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditing ? 'Edit Job' : 'Post a New Job'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEditing ? 'Update your job details' : 'Tell us about the work you need done'}
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isLoading}
              endIcon={activeStep === steps.length - 1 ? null : <ArrowForward />}
              sx={{ px: 4 }}
            >
              {isLoading && <CircularProgress size={20} sx={{ mr: 1 }} />}
              {activeStep === steps.length - 1 
                ? (isEditing ? 'Update Job' : 'Post Job')
                : 'Next'
              }
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateJobPage;
