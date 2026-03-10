import { api } from "../../../shared/api";
import type {
  CreateSupplierRequest,
  Supplier,
  UpdateSupplierRequest,
} from "../types/supplier.type";

export const supplierApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<Supplier[], void>({
      query: () => ({
        url: "Suppliers",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              { type: "Supplier" as const, id: "LIST" },
              ...result.map((s) => ({ type: "Supplier" as const, id: s.id })),
            ]
          : [{ type: "Supplier" as const, id: "LIST" }],
    }),

    getSupplierById: builder.query<Supplier, number>({
      query: (id) => ({
        url: `Suppliers/${id}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [{ type: "Supplier" as const, id }],
    }),

    createSupplier: builder.mutation<void, CreateSupplierRequest>({
      query: (body) => ({
        url: "Suppliers",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Supplier" as const, id: "LIST" }],
    }),

    updateSupplier: builder.mutation<void, { id: number; data: UpdateSupplierRequest }>({
      query: ({ id, data }) => ({
        url: `Suppliers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Supplier" as const, id: "LIST" },
        { type: "Supplier" as const, id: arg.id },
      ],
    }),

    deleteSupplier: builder.mutation<void, number>({
      query: (id) => ({
        url: `Suppliers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "Supplier" as const, id: "LIST" },
        { type: "Supplier" as const, id },
      ],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = supplierApi;

