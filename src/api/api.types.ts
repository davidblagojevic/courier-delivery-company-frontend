import axios, { HttpStatusCode } from 'axios';

export interface ErrorResponse<T> {
  message: string;
  code?: string;
  response?: {
    data: T;
    status: number;
    statusText: string;
  };
}

export enum ErrorCode {
  NetworkError = 'NetworkError',
  ServerError = 'ServerError',
}

export const isServerError = (status: number) =>
  status >= HttpStatusCode.InternalServerError;

/**
 * Narrow an unknown error to a user-facing message.
 * Handles axios errors with `response.data.error|message`, native Error, and unknown shapes.
 */
export const getErrorMessage = (error: unknown, fallback = 'An unexpected error occurred'): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      if (typeof (data as { error?: unknown }).error === 'string') {
        return (data as { error: string }).error;
      }
      if (typeof (data as { message?: unknown }).message === 'string') {
        return (data as { message: string }).message;
      }
    }
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};
