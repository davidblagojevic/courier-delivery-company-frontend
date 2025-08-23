import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Typography,
  Box,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import { Star, StarBorder, Feedback as FeedbackIcon } from '@mui/icons-material';
import { CreateFeedbackRequest } from '../types';

interface FeedbackFormProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (feedback: CreateFeedbackRequest) => Promise<void>;
}

const ratingLabels: { [index: string]: string } = {
  0.5: 'Useless',
  1: 'Useless+',
  1.5: 'Poor',
  2: 'Poor+',
  2.5: 'Ok',
  3: 'Ok+',
  3.5: 'Good',
  4: 'Good+',
  4.5: 'Excellent',
  5: 'Excellent+',
};

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [hover, setHover] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({ rating, message: message.trim() || undefined });
      onClose();
      // Reset form
      setRating(5);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset form
      setRating(5);
      setMessage('');
      setError(null);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3,
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FeedbackIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Rate Your Delivery Experience
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Help us improve our service by sharing your feedback
        </Typography>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              How would you rate this delivery?
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Rating
                name="delivery-rating"
                value={rating}
                precision={0.5}
                onChange={(_, newValue) => {
                  setRating(newValue || 0);
                }}
                onChangeActive={(_, newHover) => {
                  setHover(newHover);
                }}
                icon={<Star fontSize="large" />}
                emptyIcon={<StarBorder fontSize="large" />}
                sx={{ fontSize: '2rem' }}
              />
              
              {rating !== null && (
                <Box sx={{ ml: 2, minWidth: 120 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {ratingLabels[hover !== -1 ? hover : rating]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rating} out of 5 stars
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Additional Comments (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tell us more about your experience. What went well? What could we improve?
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts about the delivery service, courier, timing, or any other feedback..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              inputProps={{
                maxLength: 1000,
              }}
              helperText={`${message.length}/1000 characters`}
            />
          </Box>
          
          <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200' }}>
            <Typography variant="body2" color="info.dark">
              <strong>Note:</strong> Your feedback is valuable and helps us improve our service. 
              Once submitted, feedback cannot be changed or deleted.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || rating === 0}
          sx={{ 
            borderRadius: 2, 
            px: 3,
            fontWeight: 600
          }}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};