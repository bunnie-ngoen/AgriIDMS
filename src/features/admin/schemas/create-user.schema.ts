import { z } from "zod";

export const CreateEmployeeSchema = z.object({
  email: z.string().email(),
  role: z.enum(["Manager", "PurchasingStaff", "WarehouseStaff", "SalesStaff"]), 
});

export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;

export const CreateEmployeeResponseSchema = z.object({
  message: z.string(),
});

export type CreateEmployeeResponse = z.infer<typeof CreateEmployeeResponseSchema>;
