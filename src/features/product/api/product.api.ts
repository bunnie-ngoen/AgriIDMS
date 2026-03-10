import { api } from "../../../shared/api";
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from "../types/product.type";

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => ({
        url: "Products",
        method: "GET",
      }),
      transformResponse: (response: unknown) => {
        const raw = response as any;
        let arr: any[] = [];

        if (Array.isArray(raw)) {
          arr = raw;
        } else if (raw && Array.isArray(raw.result)) {
          // Trường hợp controller trả về Task<IEnumerable<>> nên serializer bọc trong { result: [...] }
          arr = raw.result;
        } else if (raw && Array.isArray(raw.data)) {
          arr = raw.data;
        } else {
          arr = [];
        }

        return arr.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          imageUrl: p.imageUrl,
          isActive: p.isActive,
          createdAt: p.createdAt,
        })) as Product[];
      },
      providesTags: (result) =>
        result
          ? [
              { type: "Product" as const, id: "LIST" },
              ...result.map((p) => ({ type: "Product" as const, id: p.id })),
            ]
          : [{ type: "Product" as const, id: "LIST" }],
    }),

    getProductById: builder.query<Product, number>({
      query: (id) => ({
        url: `Products/${id}`,
        method: "GET",
      }),
      transformResponse: (p: any) =>
        ({
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          imageUrl: p.imageUrl,
          isActive: p.isActive,
          createdAt: p.createdAt,
        }) as Product,
      providesTags: (_res, _err, id) => [{ type: "Product" as const, id }],
    }),

    createProduct: builder.mutation<void, CreateProductRequest>({
      query: (body) => ({
        url: "Products",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Product" as const, id: "LIST" }],
    }),

    updateProduct: builder.mutation<
      void,
      { id: number; data: UpdateProductRequest }
    >({
      query: ({ id, data }) => ({
        url: `Products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Product" as const, id: "LIST" },
        { type: "Product" as const, id: arg.id },
      ],
    }),

    deleteProduct: builder.mutation<void, number>({
      query: (id) => ({
        url: `Products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "Product" as const, id: "LIST" },
        { type: "Product" as const, id },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi;

