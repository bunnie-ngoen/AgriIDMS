import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export type ForgotPasswordFormValues = z.infer<
  typeof forgotPasswordSchema
>;