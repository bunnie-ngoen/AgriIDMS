/** 0 = Inactive, 1 = Active, 2 = Deleted */
export type Category = {
  id: number;
  name: string;
  description?: string | null;
  status?: number;
};

export type CreateCategoryRequest = {
  name: string;
  description?: string | null;
};

export type UpdateCategoryRequest = {
  name?: string | null;
  description?: string | null;
  status?: number | null;
};

export type UpdateCategoryStatusRequest = {
  status: number;
};

