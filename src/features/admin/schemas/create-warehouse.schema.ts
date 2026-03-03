import { z } from "zod";

export const CreateWarehouseSchema = z.object({
  name: z
    .string()
    .min(3, "Tên kho tối thiểu 3 ký tự")
    .max(200, "Tên kho tối đa 200 ký tự"),
  province: z.string().min(1, "Vui lòng chọn tỉnh/thành"),
  district: z.string().min(1, "Vui lòng chọn quận/huyện"),
  ward: z.string().min(1, "Vui lòng chọn phường/xã"),
  detailAddress: z
    .string()
    .min(3, "Địa chỉ chi tiết tối thiểu 3 ký tự")
    .max(200, "Địa chỉ chi tiết tối đa 200 ký tự"),
  titleWarehouse: z.enum(["Normal", "Cold"], {
    required_error: "Loại kho là bắt buộc",
  }),
});

export type CreateWarehouseFormValues = z.infer<typeof CreateWarehouseSchema>;

