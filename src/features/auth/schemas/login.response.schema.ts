import { z } from "zod";

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  userId: z.string(),
  userName: z.string(),
  roles: z.array(z.string()),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;