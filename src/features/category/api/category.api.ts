import { api } from "../../../shared/api";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  UpdateCategoryStatusRequest,
} from "../types/category.type";

export const categoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => ({
        url: "Categories",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              { type: "Category" as const, id: "LIST" },
              ...result.map((c) => ({ type: "Category" as const, id: c.id })),
            ]
          : [{ type: "Category" as const, id: "LIST" }],
    }),

    getCategoryById: builder.query<Category, number>({
      query: (id) => ({
        url: `Categories/${id}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [{ type: "Category" as const, id }],
    }),

    createCategory: builder.mutation<void, CreateCategoryRequest>({
      query: (body) => ({
        url: "Categories",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Category" as const, id: "LIST" }],
    }),

    updateCategory: builder.mutation<
      void,
      { id: number; data: UpdateCategoryRequest }
    >({
      query: ({ id, data }) => ({
        url: `Categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Category" as const, id: "LIST" },
        { type: "Category" as const, id: arg.id },
      ],
    }),

    updateCategoryStatus: builder.mutation<
      void,
      { id: number; data: UpdateCategoryStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `Categories/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Category" as const, id: "LIST" },
        { type: "Category" as const, id: arg.id },
      ],
    }),

    deleteCategory: builder.mutation<void, number>({
      query: (id) => ({
        url: `Categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "Category" as const, id: "LIST" },
        { type: "Category" as const, id },
      ],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryStatusMutation,
} = categoryApi;

