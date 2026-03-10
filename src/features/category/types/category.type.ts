export type Category = {
  id: number;
  name: string;
  description?: string | null;
};

export type CreateCategoryRequest = {
  name: string;
  description?: string | null;
};

export type UpdateCategoryRequest = {
  name: string;
  description?: string | null;
};

