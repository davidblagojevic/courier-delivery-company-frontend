import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  List,
  ListItem,
  Paper,
  Box,
  CircularProgress,
  InputAdornment,
  Typography,
} from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import { axiosClient } from '../../api/axiosClient';

interface AddressOption {
  id: string;
  addressLine1: string;
  addressLine2: string;
  postCodeInfo: {
    postcode: string;
    town: string;
    longitude: number;
    latitude: number;
  };
}

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: AddressOption) => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  value,
  onChange,
  onAddressSelect,
  placeholder,
  required = false,
  error = false,
  helperText,
}) => {
  const [options, setOptions] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value.length < 2) {
      setOptions([]);
      setOpen(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get('/api/addresses/search', {
          params: {
            searchTerm: value,
            maxResults: 10,
          },
        });
        setOptions(response.data);
        setOpen(true);
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce for 300ms

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const handleOptionClick = (address: AddressOption) => {
    const fullAddress = `${address.addressLine1}, ${address.addressLine2}, ${address.postCodeInfo.postcode}, ${address.postCodeInfo.town}`;
    onChange(fullAddress);
    onAddressSelect?.(address);
    setOpen(false);
    setInputFocused(false);
  };

  const handleInputFocus = () => {
    setInputFocused(true);
    if (options.length > 0) {
      setOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow for option clicks
    setTimeout(() => {
      setInputFocused(false);
      setOpen(false);
    }, 150);
  };

  const formatAddress = (address: AddressOption) => {
    return `${address.addressLine1}, ${address.addressLine2}`;
  };

  const formatPostcode = (address: AddressOption) => {
    return `${address.postCodeInfo.postcode}, ${address.postCodeInfo.town}`;
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        required={required}
        error={error}
        helperText={helperText}
        inputRef={inputRef}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LocationOn color="action" />
            </InputAdornment>
          ),
          endAdornment: loading ? (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ) : null,
        }}
      />
      
      {open && inputFocused && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            maxHeight: 300,
            overflow: 'auto',
            mt: 1,
          }}
          elevation={3}
        >
          {options.length > 0 ? (
            <List disablePadding>
              {options.map((address) => (
                <ListItem
                  key={address.id}
                  component="button"
                  onClick={() => handleOptionClick(address)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    padding: 2,
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body1" component="div">
                      {formatAddress(address)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatPostcode(address)}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {loading ? 'Searching...' : 'No addresses found'}
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};