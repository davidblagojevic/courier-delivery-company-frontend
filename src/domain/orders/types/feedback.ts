export interface FeedbackInfo {
  id: string;
  rating: number;
  message: string;
  createdDate: string;
}

export interface CreateFeedbackRequest {
  rating: number;
  message?: string;
}