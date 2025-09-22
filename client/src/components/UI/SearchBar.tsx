import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  InputAdornment,
  IconButton,
  Autocomplete,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { Search, LocationOn } from '@mui/icons-material';
import { debounce } from 'lodash';

import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface SearchSuggestion {
  type: 'category' | 'job' | 'provider';
  title: string;
  subtitle?: string;
  id: string;
  path: string;
}

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const { categories } = useSelector((state: RootState) => state.categories);
  
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);

  // Create search suggestions from categories
  const createSuggestions = useCallback((searchQuery: string): SearchSuggestion[] => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const filteredCategories = categories
      .filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5)
      .map(category => ({
        type: 'category' as const,
        title: category.name,
        subtitle: category.description,
        id: category._id,
        path: `/jobs?category=${encodeURIComponent(category.name)}`,
      }));

    return filteredCategories;
  }, [categories]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      const newSuggestions = createSuggestions(searchQuery);
      setSuggestions(newSuggestions);
    }, 300),
    [createSuggestions]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
      setOpen(false);
      setQuery('');
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion | null) => {
    if (suggestion) {
      navigate(suggestion.path);
      setOpen(false);
      setQuery('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <Autocomplete
      freeSolo
      open={open && suggestions.length > 0}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={suggestions}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option.title;
      }}
      onChange={(event, value) => {
        if (typeof value === 'object' && value !== null) {
          handleSuggestionSelect(value);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search jobs, services, or providers..."
          size="small"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => handleSearch()}
                  disabled={!query.trim()}
                >
                  <Search />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
              '&:hover': {
                backgroundColor: 'background.paper',
              },
              '&.Mui-focused': {
                backgroundColor: 'background.paper',
              },
            },
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {option.type === 'category' && <Search sx={{ mr: 2, color: 'text.secondary' }} />}
            {option.type === 'job' && <LocationOn sx={{ mr: 2, color: 'text.secondary' }} />}
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                {option.title}
              </Typography>
              {option.subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {option.subtitle}
                </Typography>
              )}
            </Box>

            <Chip
              label={option.type}
              size="small"
              variant="outlined"
              sx={{ ml: 1, textTransform: 'capitalize' }}
            />
          </Box>
        </Box>
      )}
      noOptionsText={
        query.length < 2 
          ? "Type at least 2 characters to search" 
          : "No results found"
      }
      sx={{ width: '100%' }}
    />
  );
};

export default SearchBar;
