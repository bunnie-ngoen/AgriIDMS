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

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createUser: builder.mutation<CreateEmployeeResponse, CreateEmployeeDto>({
      query: (body) => ({
        url: "/v1/Auth/CreateEmployee/admin/create-employee",
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
        const arr = (response as Array<Record<string, unknown>>) ?? [];
        return arr.map((w) => {
          const titleRaw = w.titleWarehouse;
          const title: "Normal" | "Cold" =
            titleRaw === 2 || titleRaw === "Cold" ? "Cold" : "Normal";

          return {
            id: (w.id as number) ?? 0,
            name: (w.name as string) ?? "",
            location: (w.location as string) ?? "",
            titleWarehouse: title,
            minColdStorageHours:
              (w.minColdStorageHours as number | null | undefined) ??
              (w.MinColdStorageHours as number | null | undefined) ??
              null,
            minReceiptWeight:
              (w.minReceiptWeight as number | null | undefined) ??
              (w.MinReceiptWeight as number | null | undefined) ??
              null,
          } satisfies WarehouseItem;
        });
      },
    }),

    getWarehouse: builder.query<WarehouseItem, number>({
      query: (id) => ({
        url: `Warehouses/${id}`,
      }),
      transformResponse: (w: unknown) => {
        const item = w as Record<string, unknown>;
        const tw = item.titleWarehouse;
        const title: "Normal" | "Cold" =
          tw === 2 || tw === "Cold" ? "Cold" : "Normal";

        return {
          id: (item.id as number) ?? 0,
          name: (item.name as string) ?? "",
          location: (item.location as string) ?? "",
          titleWarehouse: title,
          minColdStorageHours:
            (item.minColdStorageHours as number | null | undefined) ??
            (item.MinColdStorageHours as number | null | undefined) ??
            null,
          minReceiptWeight:
            (item.minReceiptWeight as number | null | undefined) ??
            (item.MinReceiptWeight as number | null | undefined) ??
            null,
        } as WarehouseItem;
      },
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
        { type: "Zone" as const, id: `WAREHOUSE-${warehouseId}` },
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
      invalidatesTags: (_res, _err, { warehouseId }) => [
        { type: "Zone" as const, id: `WAREHOUSE-${warehouseId}` },
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
      invalidatesTags: (_res, _err, { warehouseId, id }) => [
        { type: "Zone" as const, id: `WAREHOUSE-${warehouseId}` },
        { type: "Rack" as const, id: `ZONE-${id}` },
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
      invalidatesTags: (_res, _err, { warehouseId, id }) => [
        { type: "Zone" as const, id: `WAREHOUSE-${warehouseId}` },
        { type: "Rack" as const, id: `ZONE-${id}` },
      ],
    }),

    // ===== Racks =====
    getRacks: builder.query<RackItem[], number>({
      query: (zoneId) => ({
        url: `zones/${zoneId}/racks`,
      }),
      providesTags: (_result, _error, zoneId) => [
        { type: "Rack" as const, id: `ZONE-${zoneId}` },
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
      invalidatesTags: (_res, _err, { zoneId }) => [
        { type: "Rack" as const, id: `ZONE-${zoneId}` },
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
      invalidatesTags: (_res, _err, { zoneId, id }) => [
        { type: "Rack" as const, id: `ZONE-${zoneId}` },
        { type: "Slot" as const, id: `RACK-${id}` },
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
      invalidatesTags: (_res, _err, { zoneId, id }) => [
        { type: "Rack" as const, id: `ZONE-${zoneId}` },
        { type: "Slot" as const, id: `RACK-${id}` },
      ],
    }),

    // ===== Slots =====
    getSlots: builder.query<SlotItem[], number>({
      query: (rackId) => ({
        url: `racks/${rackId}/slots`,
      }),
      providesTags: (_result, _error, rackId) => [
        { type: "Slot" as const, id: `RACK-${rackId}` },
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
      invalidatesTags: (_res, _err, { rackId }) => [
        { type: "Slot" as const, id: `RACK-${rackId}` },
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
      invalidatesTags: (_res, _err, { rackId }) => [
        { type: "Slot" as const, id: `RACK-${rackId}` },
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
      invalidatesTags: (_res, _err, { rackId }) => [
        { type: "Slot" as const, id: `RACK-${rackId}` },
      ],
    }),

    getUsers: builder.query<
      PaginationResult<UserListItem>,
      { pageIndex?: number; pageSize?: number; search?: string } | void
    >({
      query: (args) => {
        const { pageIndex = 1, pageSize = 10 } = args ?? {};
        return {
          url: "Users",
          params: { pageIndex, pageSize },
        };
      },
    }),

    deleteUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `Users/${userId}`,  // bỏ ../
        method: "DELETE",
      }),
      invalidatesTags: ["User"],  
    }),

    updateUserStatus: builder.mutation<
      { message: string },
      { id: string; status: number }
    >({
      query: ({ id, status }) => ({
        url: `Users/status/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["User"],
    }),

    updateUserRole: builder.mutation<
      { message: string },
      { id: string; roleName: string }
    >({
      query: ({ id, roleName }) => ({
        url: `Users/${id}/role`,
        method: "PATCH",
        body: { roleName },
      }),
      invalidatesTags: [{ type: "User" as const, id: "LIST" }],
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
  useCreateUserMutation,
  useGetUsersQuery,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useUpdateUserRoleMutation,
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