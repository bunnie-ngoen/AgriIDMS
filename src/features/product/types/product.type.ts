export type Product = {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null; // category name from backend
  imageUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
};

export type CreateProductRequest = {
  name: string;
  description?: string | null;
  categoryId: number;
  imageUrl?: string | null;
};

export type UpdateProductRequest = {
  name: string;
  description?: string | null;
  categoryId: number;
  imageUrl?: string | null;
};

