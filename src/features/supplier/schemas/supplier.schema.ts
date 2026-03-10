import { z } from "zod";

export const SupplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Tên nhà cung cấp tối thiểu 3 ký tự")
    .max(200, "Tên nhà cung cấp tối đa 200 ký tự"),
  provinceCode: z
    .number({ message: "Vui lòng chọn tỉnh/thành" })
    .int()
    .positive("Vui lòng chọn tỉnh/thành"),
  districtCode: z
    .number({ message: "Vui lòng chọn quận/huyện" })
    .int()
    .positive("Vui lòng chọn quận/huyện"),
  wardCode: z
    .number({ message: "Vui lòng chọn phường/xã" })
    .int()
    .positive("Vui lòng chọn phường/xã"),
  detailAddress: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập địa chỉ chi tiết")
    .max(255, "Địa chỉ chi tiết tối đa 255 ký tự"),
  phone: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập số điện thoại")
    .regex(/^0\d{9}$/, "Số điện thoại phải gồm 10 số và bắt đầu bằng 0"),
});

export type SupplierFormValues = z.infer<typeof SupplierSchema>;

