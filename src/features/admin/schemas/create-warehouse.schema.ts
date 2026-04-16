import { z } from "zod";

export const CreateWarehouseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Tên kho tối thiểu 3 ký tự")
    .max(200, "Tên kho tối đa 200 ký tự"),
  provinceCode: z.number().int().min(1, "Vui lòng chọn tỉnh/thành"),
  districtCode: z.number().int().min(1, "Vui lòng chọn quận/huyện"),
  wardCode: z.number().int().min(1, "Vui lòng chọn phường/xã"),
  detailAddress: z
    .string()
    .trim()
    .min(3, "Địa chỉ chi tiết tối thiểu 3 ký tự")
    .max(200, "Địa chỉ chi tiết tối đa 200 ký tự"),
  lengthM: z
    .number()
    .positive("Chiều dài phải lớn hơn 0")
    .max(100000, "Chiều dài quá lớn"),
  widthM: z
    .number()
    .positive("Chiều rộng phải lớn hơn 0")
    .max(100000, "Chiều rộng quá lớn"),
  titleWarehouse: z.enum(["Normal", "Cold"]),
});

export type CreateWarehouseFormValues = z.infer<typeof CreateWarehouseSchema>;

/** Payload gửi lên API (đã ghép location từ địa chỉ) */
export type CreateWarehousePayload = {
  name: string;
  location: string;
  titleWarehouse: "Normal" | "Cold";
  lengthM: number;
  widthM: number;
  floorAreaM2: number;
};
