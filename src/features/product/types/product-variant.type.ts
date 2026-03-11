// types/product-variant.type.ts
export type ProductVariant = {
  id: number;
  productId: number;
  productName: string;
  grade: number;
  price: number;
  isActive: boolean;
  shelfLifeDays: number;
  imageUrl: string;
};