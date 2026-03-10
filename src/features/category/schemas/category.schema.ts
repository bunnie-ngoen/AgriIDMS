import { z } from "zod";

export const CategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Tên danh mục tối thiểu 3 ký tự")
    .max(100, "Tên danh mục tối đa 100 ký tự"),
  description: z
    .string()
    .trim()
    .max(500, "Mô tả tối đa 500 ký tự")
    .optional()
    .or(z.literal("")),
});

export type CategoryFormValues = z.infer<typeof CategorySchema>;

