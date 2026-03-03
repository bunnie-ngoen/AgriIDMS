export interface UserListItem {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  userType: string;
}

export interface PaginationResult<T> {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

