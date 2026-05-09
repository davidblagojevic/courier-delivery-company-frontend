import { type Vehicle } from './vehicle';

export interface PagedVehiclesResponse {
  items: Vehicle[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
