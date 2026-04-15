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
  SlotContents,
} from "../types/warehouse.type";

export type BoxTypeSpecItem = {
  id: number;
  boxType: number;
  displayName: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeM3: number;
};

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createUser: builder.mutation<CreateEmployeeResponse, CreateEmployeeDto>({
      query: (body) => ({
        // Base URL đã có "/api/", nên để relative path để ra đúng "/api/v1/..."
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
          lengthM: body.lengthM,
          widthM: body.widthM,
          floorAreaM2: body.floorAreaM2,
        },
      }),
    }),

    getBoxTypeSpecs: builder.query<BoxTypeSpecItem[], void>({
      query: () => ({
        url: "BoxTypeSpecs",
      }),
      transformResponse: (raw: unknown) => {
        const arr = (raw as Array<Record<string, unknown>>) ?? [];
        return arr.map((x) => ({
          id: Number(x.id ?? x.Id ?? 0),
          boxType: Number(x.boxType ?? x.BoxType ?? 0),
          displayName: String(x.displayName ?? x.DisplayName ?? ""),
          lengthCm: Number(x.lengthCm ?? x.LengthCm ?? 0),
          widthCm: Number(x.widthCm ?? x.WidthCm ?? 0),
          heightCm: Number(x.heightCm ?? x.HeightCm ?? 0),
          volumeM3: Number(x.volumeM3 ?? x.VolumeM3 ?? 0),
        }));
      },
      providesTags: [{ type: "Warehouse" as const, id: "BOX_TYPE_SPECS" }],
    }),

    replaceAllBoxTypeSpecs: builder.mutation<
      { message: string; items: BoxTypeSpecItem[] },
      Array<{
        id?: number;
        boxType: number;
        displayName: string;
        lengthCm: number;
        widthCm: number;
        heightCm: number;
      }>
    >({
      query: (items) => ({
        url: "BoxTypeSpecs/replace-all",
        method: "PUT",
        body: items,
      }),
      transformResponse: (raw: unknown) => {
        const data = (raw as Record<string, unknown>) ?? {};
        const itemsRaw = (data.items as Array<Record<string, unknown>>) ?? [];
        return {
          message: String(data.message ?? data.Message ?? "Lưu cấu hình thành công."),
          items: itemsRaw.map((x) => ({
            id: Number(x.id ?? x.Id ?? 0),
            boxType: Number(x.boxType ?? x.BoxType ?? 0),
            displayName: String(x.displayName ?? x.DisplayName ?? ""),
            lengthCm: Number(x.lengthCm ?? x.LengthCm ?? 0),
            widthCm: Number(x.widthCm ?? x.WidthCm ?? 0),
            heightCm: Number(x.heightCm ?? x.HeightCm ?? 0),
            volumeM3: Number(x.volumeM3 ?? x.VolumeM3 ?? 0),
          })),
        };
      },
      invalidatesTags: [{ type: "Warehouse" as const, id: "BOX_TYPE_SPECS" }],
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
            lengthM:
              (w.lengthM as number | null | undefined) ??
              (w.LengthM as number | null | undefined) ??
              null,
            widthM:
              (w.widthM as number | null | undefined) ??
              (w.WidthM as number | null | undefined) ??
              null,
            floorAreaM2:
              (w.floorAreaM2 as number | null | undefined) ??
              (w.FloorAreaM2 as number | null | undefined) ??
              null,
            minColdStorageHours:
              (w.minColdStorageHours as number | null | undefined) ??
              (w.MinColdStorageHours as number | null | undefined) ??
              null,
            minReceiptWeight:
              (w.minReceiptWeight as number | null | undefined) ??
              (w.MinReceiptWeight as number | null | undefined) ??
              null,
            totalStockWeight:
              Number(w.totalStockWeight ?? w.TotalStockWeight ?? 0),
            totalCapacity:
              Number(w.totalCapacity ?? w.TotalCapacity ?? 0),
            storedInSlotsWeight:
              Number(w.storedInSlotsWeight ?? w.StoredInSlotsWeight ?? 0),
            unassignedStockWeight:
              Number(w.unassignedStockWeight ?? w.UnassignedStockWeight ?? 0),
          } satisfies WarehouseItem;
        });
      },
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map((w) => ({ type: "Warehouse" as const, id: w.id })),
              { type: "Warehouse" as const, id: "LIST" },
            ]
          : [{ type: "Warehouse" as const, id: "LIST" }],
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
          lengthM:
            (item.lengthM as number | null | undefined) ??
            (item.LengthM as number | null | undefined) ??
            null,
          widthM:
            (item.widthM as number | null | undefined) ??
            (item.WidthM as number | null | undefined) ??
            null,
          floorAreaM2:
            (item.floorAreaM2 as number | null | undefined) ??
            (item.FloorAreaM2 as number | null | undefined) ??
            null,
          minColdStorageHours:
            (item.minColdStorageHours as number | null | undefined) ??
            (item.MinColdStorageHours as number | null | undefined) ??
            null,
          minReceiptWeight:
            (item.minReceiptWeight as number | null | undefined) ??
            (item.MinReceiptWeight as number | null | undefined) ??
            null,
          totalStockWeight:
            Number(item.totalStockWeight ?? item.TotalStockWeight ?? 0),
          totalCapacity:
            Number(item.totalCapacity ?? item.TotalCapacity ?? 0),
          storedInSlotsWeight:
            Number(item.storedInSlotsWeight ?? item.StoredInSlotsWeight ?? 0),
          unassignedStockWeight:
            Number(item.unassignedStockWeight ?? item.UnassignedStockWeight ?? 0),
        } as WarehouseItem;
      },
      providesTags: (_result, _error, id) => [
        { type: "Warehouse" as const, id },
      ],
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
          lengthM: data.lengthM,
          widthM: data.widthM,
          floorAreaM2: data.floorAreaM2,
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
      transformResponse: (raw: unknown): ZoneItem[] => {
        const arr = (raw as Array<Record<string, unknown>>) ?? [];
        return arr.map((row) => ({
          id: Number(row.id ?? row.Id ?? 0),
          name: String(row.name ?? row.Name ?? ""),
          warehouseId: Number(row.warehouseId ?? row.WarehouseId ?? 0),
          lengthM: Number(row.lengthM ?? row.LengthM ?? 0),
          widthM: Number(row.widthM ?? row.WidthM ?? 0),
          floorAreaM2: Number(row.floorAreaM2 ?? row.FloorAreaM2 ?? 0),
        }));
      },
      providesTags: (_result, _error, warehouseId) => [
        { type: "Zone" as const, id: `WAREHOUSE-${warehouseId}` },
      ],
    }),

    createZone: builder.mutation<
      { message: string; id: number },
      {
        warehouseId: number;
        name: string;
        lengthM: number;
        widthM: number;
        floorAreaM2: number;
      }
    >({
      query: ({ warehouseId, name, lengthM, widthM, floorAreaM2 }) => ({
        url: `warehouses/${warehouseId}/zones`,
        method: "POST",
        body: { name, lengthM, widthM, floorAreaM2 },
      }),
      invalidatesTags: (_res, _err, { warehouseId }) => [
        { type: "Zone" as const, id: `WAREHOUSE-${warehouseId}` },
      ],
    }),

    updateZone: builder.mutation<
      { message: string },
      {
        warehouseId: number;
        id: number;
        name: string;
        lengthM: number;
        widthM: number;
        floorAreaM2: number;
      }
    >({
      query: ({ warehouseId, id, name, lengthM, widthM, floorAreaM2 }) => ({
        url: `warehouses/${warehouseId}/zones/${id}`,
        method: "PUT",
        body: { name, lengthM, widthM, floorAreaM2 },
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
      transformResponse: (raw: unknown): RackItem[] => {
        const arr = (raw as Array<Record<string, unknown>>) ?? [];
        return arr.map((row) => ({
          id: Number(row.id ?? row.Id ?? 0),
          name: String(row.name ?? row.Name ?? ""),
          zoneId: Number(row.zoneId ?? row.ZoneId ?? 0),
          lengthM: Number(row.lengthM ?? row.LengthM ?? 0),
          widthM: Number(row.widthM ?? row.WidthM ?? 0),
          floorAreaM2: Number(row.floorAreaM2 ?? row.FloorAreaM2 ?? 0),
        }));
      },
      providesTags: (_result, _error, zoneId) => [
        { type: "Rack" as const, id: `ZONE-${zoneId}` },
      ],
    }),

    createRack: builder.mutation<
      { message: string; id: number },
      { zoneId: number; name: string; lengthM: number; widthM: number; floorAreaM2: number }
    >({
      query: ({ zoneId, name, lengthM, widthM, floorAreaM2 }) => ({
        url: `zones/${zoneId}/racks`,
        method: "POST",
        body: { name, lengthM, widthM, floorAreaM2 },
      }),
      invalidatesTags: (_res, _err, { zoneId }) => [
        { type: "Rack" as const, id: `ZONE-${zoneId}` },
      ],
    }),

    updateRack: builder.mutation<
      { message: string },
      {
        zoneId: number;
        id: number;
        name: string;
        lengthM: number;
        widthM: number;
        floorAreaM2: number;
      }
    >({
      query: ({ zoneId, id, name, lengthM, widthM, floorAreaM2 }) => ({
        url: `zones/${zoneId}/racks/${id}`,
        method: "PUT",
        body: { name, lengthM, widthM, floorAreaM2 },
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
      transformResponse: (raw: unknown): SlotItem[] => {
        const arr = (raw as Array<Record<string, unknown>>) ?? [];
        return arr.map((row) => ({
          id: (row.id as number) ?? 0,
          code: (row.code as string) ?? "",
          qrCode:
            (row.qrCode as string | null | undefined) ??
            (row.QrCode as string | null | undefined) ??
            null,
          qrImageUrl:
            (row.qrImageUrl as string | null | undefined) ??
            (row.QrImageUrl as string | null | undefined) ??
            null,
          productVariantId:
            (row.productVariantId as number | null | undefined) ??
            (row.ProductVariantId as number | null | undefined) ??
            null,
          productVariantName:
            (row.productVariantName as string | null | undefined) ??
            (row.ProductVariantName as string | null | undefined) ??
            null,
          productName:
            (row.productName as string | null | undefined) ??
            (row.ProductName as string | null | undefined) ??
            null,
          capacity: Number(row.capacity ?? row.Capacity ?? 0),
          currentCapacity: Number(
            row.currentCapacity ?? row.CurrentCapacity ?? 0,
          ),
          lengthCm: Number(row.lengthCm ?? row.LengthCm ?? 0),
          widthCm: Number(row.widthCm ?? row.WidthCm ?? 0),
          heightCm: Number(row.heightCm ?? row.HeightCm ?? 0),
          volumeM3: Number(row.volumeM3 ?? row.VolumeM3 ?? 0),
          rackId: (row.rackId as number) ?? (row.RackId as number) ?? 0,
        }));
      },
      providesTags: (_result, _error, rackId) => [
        { type: "Slot" as const, id: `RACK-${rackId}` },
      ],
    }),

    createSlot: builder.mutation<
      { message: string; id: number },
      {
        rackId: number;
        code: string;
        capacity: number;
        lengthCm: number;
        widthCm: number;
        heightCm: number;
        volumeM3: number;
      }
    >({
      query: ({ rackId, code, capacity, lengthCm, widthCm, heightCm, volumeM3 }) => ({
        url: `racks/${rackId}/slots`,
        method: "POST",
        body: { code, capacity, lengthCm, widthCm, heightCm, volumeM3 },
      }),
      invalidatesTags: (_res, _err, { rackId }) => [
        { type: "Slot" as const, id: `RACK-${rackId}` },
      ],
    }),

    updateSlot: builder.mutation<
      { message: string },
      {
        rackId: number;
        id: number;
        code: string;
        capacity: number;
        lengthCm: number;
        widthCm: number;
        heightCm: number;
        volumeM3: number;
      }
    >({
      query: ({ rackId, id, code, capacity, lengthCm, widthCm, heightCm, volumeM3 }) => ({
        url: `racks/${rackId}/slots/${id}`,
        method: "PUT",
        body: { code, capacity, lengthCm, widthCm, heightCm, volumeM3 },
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

    getSlotContents: builder.query<SlotContents, number>({
      query: (slotId) => ({
        url: `slots/${slotId}/contents`,
      }),
      transformResponse: (raw: unknown): SlotContents => {
        const row = (raw as Record<string, unknown>) ?? {};
        const boxesRaw = (row.boxes as Array<Record<string, unknown>>) ?? [];
        return {
          slotId: Number(row.slotId ?? row.SlotId ?? 0),
          slotCode: String(row.slotCode ?? row.SlotCode ?? ""),
          slotQrCode:
            (row.slotQrCode as string | null | undefined) ??
            (row.SlotQrCode as string | null | undefined) ??
            null,
          slotQrImageUrl:
            (row.slotQrImageUrl as string | null | undefined) ??
            (row.SlotQrImageUrl as string | null | undefined) ??
            null,
          capacity: Number(row.capacity ?? row.Capacity ?? 0),
          currentCapacity: Number(row.currentCapacity ?? row.CurrentCapacity ?? 0),
          remainingCapacity: Number(row.remainingCapacity ?? row.RemainingCapacity ?? 0),
          productVariantId: Number(row.productVariantId ?? row.ProductVariantId ?? 0) || null,
          productName:
            (row.productName as string | null | undefined) ??
            (row.ProductName as string | null | undefined) ??
            null,
          variantName:
            (row.variantName as string | null | undefined) ??
            (row.VariantName as string | null | undefined) ??
            null,
          boxCount: Number(row.boxCount ?? row.BoxCount ?? 0),
          totalBoxWeight: Number(row.totalBoxWeight ?? row.TotalBoxWeight ?? 0),
          totalBoxVolumeM3: Number(row.totalBoxVolumeM3 ?? row.TotalBoxVolumeM3 ?? 0),
          boxes: boxesRaw.map((b) => ({
            id: Number(b.id ?? b.Id ?? 0),
            boxCode: String(b.boxCode ?? b.BoxCode ?? ""),
            qrCode:
              (b.qrCode as string | null | undefined) ??
              (b.QrCode as string | null | undefined) ??
              null,
            weight: Number(b.weight ?? b.Weight ?? 0),
            volumeM3: Number(b.volumeM3 ?? b.VolumeM3 ?? 0),
            status: String(b.status ?? b.Status ?? ""),
            lotId: Number(b.lotId ?? b.LotId ?? 0),
            lotCode: String(b.lotCode ?? b.LotCode ?? ""),
            receivedDate: String(b.receivedDate ?? b.ReceivedDate ?? ""),
            expiryDate: String(b.expiryDate ?? b.ExpiryDate ?? ""),
          })),
        };
      },
      providesTags: (_res, _err, slotId) => [
        { type: "SlotContents" as const, id: "LIST" },
        { type: "SlotContents" as const, id: slotId },
      ],
    }),

    syncSlotCapacitiesByWarehouse: builder.mutation<
      { message: string; affectedSlots: number },
      number
    >({
      query: (warehouseId) => ({
        url: `slots/sync-capacity/${warehouseId}`,
        method: "POST",
      }),
      transformResponse: (raw: unknown) => {
        const res = (raw as Record<string, unknown>) ?? {};
        return {
          message: String(res.message ?? res.Message ?? "Đồng bộ thành công"),
          affectedSlots: Number(res.affectedSlots ?? res.AffectedSlots ?? 0),
        };
      },
      invalidatesTags: (_res, _err, warehouseId) => [
        { type: "Warehouse" as const, id: warehouseId },
        { type: "Warehouse" as const, id: "LIST" },
        { type: "Slot" as const, id: "LIST" },
        { type: "SlotContents" as const, id: "LIST" },
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
  useGetBoxTypeSpecsQuery,
  useReplaceAllBoxTypeSpecsMutation,
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
  useGetSlotContentsQuery,
  useSyncSlotCapacitiesByWarehouseMutation,
} = userApi;