import { type User } from './user';

export interface PagedUsersResponse {
  items: User[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
