import { z } from "zod";

export const registerSchema = z
  .object({
    userName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên tài khoản")
      .min(3, "Tên tài khoản tối thiểu 3 ký tự")
      .max(50, "Tên tài khoản tối đa 50 ký tự")
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Tên tài khoản chỉ được chứa chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang"
      ),
    fullName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập họ và tên")
      .min(3, "Họ tên tối thiểu 3 ký tự")
      .max(100, "Họ tên tối đa 100 ký tự")
      .regex(
        /^[\p{L}\s.'-]+$/u,
        "Họ và tên chỉ được chứa chữ cái và khoảng trắng hợp lệ"
      ),
    email: z
      .string()
      .trim()
      .min(1, "Email là bắt buộc")
      .email("Email không hợp lệ")
      .max(150, "Email tối đa 150 ký tự"),
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu")
      .min(6, "Mật khẩu tối thiểu 6 ký tự")
      .regex(/^(?=.*[a-z]).*$/, "Mật khẩu phải chứa ít nhất 1 chữ thường")
      .regex(
        /^(?=.*[A-Z]).*$/,
        "Mật khẩu phải chứa ít nhất 1 chữ in hoa"
      )
      .regex(/^(?=.*\d).*$/, "Mật khẩu phải chứa ít nhất 1 chữ số"),
    confirmPassword: z.string().min(1, "Vui lòng nhập xác nhận mật khẩu"),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập số điện thoại")
      .min(8, "Số điện thoại tối thiểu 8 ký tự")
      .max(20, "Số điện thoại tối đa 20 ký tự")
      .regex(/^[0-9+()\s.-]+$/, "Số điện thoại chứa ký tự không hợp lệ"),
    gender: z.enum(["male", "female"], {
      message: "Vui lòng chọn giới tính",
    }),
    dob: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (value) => {
          if (!value) return true;
          const pickedDate = new Date(value);
          if (Number.isNaN(pickedDate.getTime())) return false;
          const now = new Date();
          pickedDate.setHours(0, 0, 0, 0);
          now.setHours(0, 0, 0, 0);
          return pickedDate <= now;
        },
        { message: "Ngày sinh không được lớn hơn ngày hiện tại" }
      ),
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

