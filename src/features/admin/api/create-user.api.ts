// user.api.ts (hoặc create-user.api.ts)
import { api } from "../../../shared/api";
import {
  CreateEmployeeResponseSchema,
  type CreateEmployeeDto,
  type CreateEmployeeResponse,
} from "../schemas/create-user.schema";

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createUser: builder.mutation<CreateEmployeeResponse, CreateEmployeeDto>({
      query: (body) => ({
        url: "/Auth/CreateEmployee/admin/create-employee",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) => {
        // Nếu response là string, wrap nó vào object
        if (typeof response === 'string') {
          return { message: response };
        }
        // Nếu là object, parse bình thường
        return CreateEmployeeResponseSchema.parse(response);
      },
    }),
  }),
});

export const { useCreateUserMutation } = userApi;