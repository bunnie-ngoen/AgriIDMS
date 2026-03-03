import { z } from "zod";

export const registerSchema = z
  .object({
    userName: z
      .string()
      .min(3, "User name tối thiểu 3 ký tự"),
    fullName: z
      .string()
      .min(3, "Họ tên tối thiểu 3 ký tự")
      .max(100, "Họ tên tối đa 100 ký tự"),
    email: z
      .string()
      .email("Email không hợp lệ")
      .max(150, "Email tối đa 150 ký tự")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(6, "Mật khẩu tối thiểu 6 ký tự")
      .regex(
        /^(?=.*[A-Z]).*$/,
        "Mật khẩu phải chứa ít nhất 1 chữ in hoa"
      ),
    confirmPassword: z.string(),
    phoneNumber: z
      .string()
      .min(8, "Số điện thoại tối thiểu 8 ký tự")
      .max(20, "Số điện thoại tối đa 20 ký tự"),
    gender: z.enum(["male", "female"]),
    dob: z.string().optional().or(z.literal("")),
    address: z
      .string()
      .max(255, "Địa chỉ tối đa 255 ký tự")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

