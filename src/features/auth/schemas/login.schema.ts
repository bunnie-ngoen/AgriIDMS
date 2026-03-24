import { z } from "zod";

export const loginSchema = z.object({
    userNameOrEmail: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập tên đăng nhập hoặc email"),
    password: z
        .string()
        .min(1, "Vui lòng nhập mật khẩu")
        .min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;