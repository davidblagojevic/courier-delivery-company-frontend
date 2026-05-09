import { type Order } from './order';

export interface PagedOrdersResponse {
  items: Order[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  links: Array<{
    href: string;
    rel: string;
    type: string;
  }>;
}
