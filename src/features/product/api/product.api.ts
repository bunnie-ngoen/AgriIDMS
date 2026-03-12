import { api } from "../../../shared/api";
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  UpdateProductStatusRequest,
} from "../types/product.type";

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => ({
        url: "Products",
        method: "GET",
      }),
      transformResponse: (response: unknown): Product[] => {
        type RawProduct = {
          id: number;
          name: string;
          description?: string | null;
          category?: string | null;
          imageUrl?: string | null;
          isActive?: boolean;
          createdAt?: string;
        };

        const raw = response as
          | RawProduct[]
          | { result?: RawProduct[]; data?: RawProduct[] }
          | undefined
          | null;
        let arr: RawProduct[] = [];

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
        }));
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
      transformResponse: (p: {
        id: number;
        name: string;
        description?: string | null;
        category?: string | null;
        imageUrl?: string | null;
        isActive?: boolean;
        createdAt?: string;
      }): Product =>
        ({
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          imageUrl: p.imageUrl,
          isActive: p.isActive,
          createdAt: p.createdAt,
        }),
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

    updateProductStatus: builder.mutation<
      void,
      { id: number; data: UpdateProductStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `Products/${id}`,
        method: "PATCH",
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
  useUpdateProductStatusMutation,
  useDeleteProductMutation,
} = productApi;

