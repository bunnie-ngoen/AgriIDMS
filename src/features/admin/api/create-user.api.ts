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
      transformResponse: (w: unknown) => {
        const item = w as Record<string, unknown>;
        const tw = item.titleWarehouse;
        return {
          ...item,
          titleWarehouse: tw === 2 || tw === "Cold" ? "Cold" : "Normal",
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
    }),

    deleteZone: builder.mutation<
      { message: string },
      { warehouseId: number; id: number }
    >({
      query: ({ warehouseId, id }) => ({
        url: `warehouses/${warehouseId}/zones/${id}`,
        method: "DELETE",
      }),
    }),

    // ===== Racks =====
    getRacks: builder.query<RackItem[], number>({
      query: (zoneId) => ({
        url: `zones/${zoneId}/racks`,
      }),
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
    }),

    deleteRack: builder.mutation<
      { message: string },
      { zoneId: number; id: number }
    >({
      query: ({ zoneId, id }) => ({
        url: `zones/${zoneId}/racks/${id}`,
        method: "DELETE",
      }),
    }),

    // ===== Slots =====
    getSlots: builder.query<SlotItem[], number>({
      query: (rackId) => ({
        url: `racks/${rackId}/slots`,
      }),
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
    }),

    deleteSlot: builder.mutation<
      { message: string },
      { rackId: number; id: number }
    >({
      query: ({ rackId, id }) => ({
        url: `racks/${rackId}/slots/${id}`,
        method: "DELETE",
      }),
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
        url: `Users/${userId}`,
        method: "DELETE",
      }),
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
      invalidatesTags: [{ type: "User" as const, id: "LIST" }],
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
  }),
});

export const {
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