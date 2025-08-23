import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Chip,
  Stack,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
  Star,
  Schedule,
} from '@mui/icons-material';
import { FeedbackInfo } from '../types';

interface FeedbackDisplayProps {
  feedback: FeedbackInfo;
  showTitle?: boolean;
}

const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return 'success';
  if (rating >= 3.5) return 'info';
  if (rating >= 2.5) return 'warning';
  return 'error';
};

const getRatingText = (rating: number) => {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 3.5) return 'Good';
  if (rating >= 2.5) return 'Average';
  if (rating >= 1.5) return 'Poor';
  return 'Very Poor';
};

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ 
  feedback, 
  showTitle = true 
}) => {
  const ratingColor = getRatingColor(feedback.rating);
  const ratingText = getRatingText(feedback.rating);

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: `${ratingColor}.200`,
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: `${ratingColor}.50`,
      }}
    >
      {showTitle && (
        <>
          <Box 
            sx={{ 
              p: 3, 
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontWeight: 600
              }}
            >
              <Avatar sx={{ bgcolor: `${ratingColor}.main`, width: 32, height: 32 }}>
                <FeedbackIcon fontSize="small" />
              </Avatar>
              Customer Feedback
            </Typography>
          </Box>
          <Divider />
        </>
      )}
      
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* Rating Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating
                value={feedback.rating}
                precision={0.5}
                readOnly
                icon={<Star fontSize="small" />}
                sx={{ fontSize: '1.25rem' }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, color: `${ratingColor}.main` }}>
                {feedback.rating}
              </Typography>
            </Box>
            
            <Chip
              label={ratingText}
              color={ratingColor as any}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          
          {/* Message Section */}
          {feedback.message && (
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.6,
                  fontStyle: feedback.message ? 'normal' : 'italic',
                  color: feedback.message ? 'text.primary' : 'text.secondary'
                }}
              >
                {feedback.message || 'No additional comments provided'}
              </Typography>
            </Box>
          )}
          
          {/* Timestamp */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1 }}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Submitted on {new Date(feedback.createdDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};