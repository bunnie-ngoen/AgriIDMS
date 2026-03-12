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
import { type CreateWarehousePayload } from "../schemas/create-warehouse.schema";
import type {
  WarehouseItem,
  ZoneItem,
  RackItem,
  SlotItem,
} from "../types/warehouse.type";
import type { UserStatus } from "../types/user.type";

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

    createWarehouse: builder.mutation<
      { message: string; id: number },
      CreateWarehousePayload
    >({
      query: (body) => ({
        url: "Warehouses",
        method: "POST",
        body: {
          name: body.name,
          location: body.location,
          titleWarehouse: body.titleWarehouse === "Normal" ? 1 : 2,
        },
      }),
    }),

    getWarehouses: builder.query<WarehouseItem[], void>({
      query: () => ({
        url: "Warehouses",
      }),
      transformResponse: (response: unknown) => {
        const arr = (response as any[]) ?? [];
        return arr.map((w) => ({
          ...w,
          titleWarehouse:
            w.titleWarehouse === 2 || w.titleWarehouse === "Cold"
              ? "Cold"
              : "Normal",
        })) as WarehouseItem[];
      },
    }),

    getWarehouse: builder.query<WarehouseItem, number>({
      query: (id) => ({
        url: `Warehouses/${id}`,
      }),
      transformResponse: (w: any) =>
        ({
          ...w,
          titleWarehouse:
            w.titleWarehouse === 2 || w.titleWarehouse === "Cold"
              ? "Cold"
              : "Normal",
        }) as WarehouseItem,
    }),

    updateWarehouse: builder.mutation<
      { message: string },
      { id: number; data: CreateWarehousePayload }
    >({
      query: ({ id, data }) => ({
        url: `Warehouses/${id}`,
        method: "PUT",
        body: {
          name: data.name,
          location: data.location,
          titleWarehouse: data.titleWarehouse === "Normal" ? 1 : 2,
        },
      }),
    }),

    deleteWarehouse: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `Warehouses/${id}`,
        method: "DELETE",
      }),
    }),

    // ===== Warehouse structure: Zones =====
    getZones: builder.query<ZoneItem[], number>({
      query: (warehouseId) => ({
        url: `warehouses/${warehouseId}/zones`,
      }),
      providesTags: (_result, _error, warehouseId) => [
        { type: "Zone" as const, id: `W-${warehouseId}` },
      ],
    }),

    createZone: builder.mutation<
      { message: string; id: number },
      { warehouseId: number; name: string }
    >({
      query: ({ warehouseId, name }) => ({
        url: `warehouses/${warehouseId}/zones`,
        method: "POST",
        body: { name },
      }),
      invalidatesTags: (_result, _error, { warehouseId }) => [
        { type: "Zone" as const, id: `W-${warehouseId}` },
      ],
    }),

    updateZone: builder.mutation<
      { message: string },
      { warehouseId: number; id: number; name: string }
    >({
      query: ({ warehouseId, id, name }) => ({
        url: `warehouses/${warehouseId}/zones/${id}`,
        method: "PUT",
        body: { name },
      }),
      invalidatesTags: (_result, _error, { warehouseId }) => [
        { type: "Zone" as const, id: `W-${warehouseId}` },
      ],
    }),

    deleteZone: builder.mutation<
      { message: string },
      { warehouseId: number; id: number }
    >({
      query: ({ warehouseId, id }) => ({
        url: `warehouses/${warehouseId}/zones/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { warehouseId }) => [
        { type: "Zone" as const, id: `W-${warehouseId}` },
      ],
    }),

    // ===== Racks =====
    getRacks: builder.query<RackItem[], number>({
      query: (zoneId) => ({
        url: `zones/${zoneId}/racks`,
      }),
      providesTags: (_result, _error, zoneId) => [
        { type: "Rack" as const, id: `Z-${zoneId}` },
      ],
    }),

    createRack: builder.mutation<
      { message: string; id: number },
      { zoneId: number; name: string }
    >({
      query: ({ zoneId, name }) => ({
        url: `zones/${zoneId}/racks`,
        method: "POST",
        body: { name },
      }),
      invalidatesTags: (_result, _error, { zoneId }) => [
        { type: "Rack" as const, id: `Z-${zoneId}` },
      ],
    }),

    updateRack: builder.mutation<
      { message: string },
      { zoneId: number; id: number; name: string }
    >({
      query: ({ zoneId, id, name }) => ({
        url: `zones/${zoneId}/racks/${id}`,
        method: "PUT",
        body: { name },
      }),
      invalidatesTags: (_result, _error, { zoneId }) => [
        { type: "Rack" as const, id: `Z-${zoneId}` },
      ],
    }),

    deleteRack: builder.mutation<
      { message: string },
      { zoneId: number; id: number }
    >({
      query: ({ zoneId, id }) => ({
        url: `zones/${zoneId}/racks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { zoneId }) => [
        { type: "Rack" as const, id: `Z-${zoneId}` },
      ],
    }),

    // ===== Slots =====
    getSlots: builder.query<SlotItem[], number>({
      query: (rackId) => ({
        url: `racks/${rackId}/slots`,
      }),
      providesTags: (_result, _error, rackId) => [
        { type: "Slot" as const, id: `R-${rackId}` },
      ],
    }),

    createSlot: builder.mutation<
      { message: string; id: number },
      { rackId: number; code: string; capacity: number }
    >({
      query: ({ rackId, code, capacity }) => ({
        url: `racks/${rackId}/slots`,
        method: "POST",
        body: { code, capacity },
      }),
      invalidatesTags: (_result, _error, { rackId }) => [
        { type: "Slot" as const, id: `R-${rackId}` },
      ],
    }),

    updateSlot: builder.mutation<
      { message: string },
      { rackId: number; id: number; code: string; capacity: number }
    >({
      query: ({ rackId, id, code, capacity }) => ({
        url: `racks/${rackId}/slots/${id}`,
        method: "PUT",
        body: { code, capacity },
      }),
      invalidatesTags: (_result, _error, { rackId }) => [
        { type: "Slot" as const, id: `R-${rackId}` },
      ],
    }),

    deleteSlot: builder.mutation<
      { message: string },
      { rackId: number; id: number }
    >({
      query: ({ rackId, id }) => ({
        url: `racks/${rackId}/slots/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { rackId }) => [
        { type: "Slot" as const, id: `R-${rackId}` },
      ],
    }),

    getUsers: builder.query<
      PaginationResult<UserListItem>,
      { pageIndex?: number; pageSize?: number; search?: string } | void
    >({
      query: (args) => {
        const { pageIndex = 1, pageSize = 10, search = "" } = args ?? {};
        return {
          url: "/Users",
          params: { pageIndex, pageSize }, ...(search ? { search } : {}),
        };
      },
      providesTags: ["User"],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `Users/${userId}`,  // bỏ ../
        method: "DELETE",
      }),
      invalidatesTags: ["User"],  
    }),
    updateUserStatus: builder.mutation<void, { id: string; status: number }>({
      query: ({ id, status }) => ({
        url: `/Users/status/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["User"],
    }),
    updateUserRole: builder.mutation<{ message: string }, { id: string; roleName: string }>({
      query: ({ id, roleName }) => ({
        url: `/Users/${id}/role`,
        method: "PATCH",
        body: { roleName },
      }),
    }),
    getDeletedUsers: builder.query<UserListItem[], void>({
      query: () => "/Users/by-status-deleted",
      providesTags: ["User"],
    }),

    restoreUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/Users/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetDeletedUsersQuery,
  useRestoreUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useCreateUserMutation,
  useGetUsersQuery,
  useDeleteUserMutation,
  useCreateWarehouseMutation,
  useGetWarehousesQuery,
  useGetWarehouseQuery,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
  useGetZonesQuery,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
  useGetRacksQuery,
  useCreateRackMutation,
  useUpdateRackMutation,
  useDeleteRackMutation,
  useGetSlotsQuery,
  useCreateSlotMutation,
  useUpdateSlotMutation,
  useDeleteSlotMutation,
} = userApi;