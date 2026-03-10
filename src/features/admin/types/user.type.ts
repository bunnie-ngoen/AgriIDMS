export type UserListItem = {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  roles: string[];   // 👈 đổi từ userType thành roles
  status?: number;
};
export interface PaginationResult<T> {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}
export type UserStatus = 0 | 1 | 2 | 3 | 4;