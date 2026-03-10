import { z } from "zod";

export const ProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Tên sản phẩm tối thiểu 3 ký tự")
    .max(150, "Tên sản phẩm tối đa 150 ký tự"),
  categoryId: z
    .number({ message: "Vui lòng chọn danh mục" })
    .int()
    .positive("Vui lòng chọn danh mục"),
  description: z
    .string()
    .trim()
    .max(500, "Mô tả tối đa 500 ký tự")
    .optional()
    .or(z.literal("")),
});

export type ProductFormValues = z.infer<typeof ProductSchema>;

