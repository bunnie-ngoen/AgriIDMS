import { z } from "zod";

export const loginSchema = z.object({
    userNameOrEmail: z.string().nonempty('Email is required').email('Invalid email'),
    password: z.string().nonempty('Password is required').min(6, 'Password must be at least 6 characters')
});

export type LoginFormValues = z.infer<typeof loginSchema>;