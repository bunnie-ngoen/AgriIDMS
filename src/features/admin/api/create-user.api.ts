// user.api.ts (hoặc create-user.api.ts)
import { api } from "../../../shared/api";
import {
  CreateEmployeeResponseSchema,
  type CreateEmployeeDto,
  type CreateEmployeeResponse,
} from "../schemas/create-user.schema";
import type {
  PaginationResult,
  UserListItem,
} from "../types/user.type";

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createUser: builder.mutation<CreateEmployeeResponse, CreateEmployeeDto>({
      query: (body) => ({
        url: "/Auth/CreateEmployee/admin/create-employee",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) => {
        if (typeof response === "string") {
          return { message: response };
        }
        return CreateEmployeeResponseSchema.parse(response);
      },
    }),

    getUsers: builder.query<
      PaginationResult<UserListItem>,
      { pageIndex?: number; pageSize?: number } | void
    >({
      query: (args) => {
        const { pageIndex = 1, pageSize = 10 } = args ?? {};
        return {
          url: "../Users",
          params: { pageIndex, pageSize },
        };
      },
    }),

    deleteUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `../Users/${userId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateUserMutation,
  useGetUsersQuery,
  useDeleteUserMutation,
} = userApi;