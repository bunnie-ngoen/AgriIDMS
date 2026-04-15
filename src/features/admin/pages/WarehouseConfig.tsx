import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useUpdateSlotQrImageMutation } from "../../goods-receipt/api/goods-receipt.api";
import { uploadQrPayloadToCloudinary } from "../../../shared/lib/qrImageCloudinary";
import {
  useGetWarehousesQuery,
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
} from "../api/create-user.api";
import type { ZoneItem, RackItem, SlotItem } from "../types/warehouse.type";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";

const MIN_NAME_LENGTH = 3;
const toPositiveNumber = (value: string): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

type FormMode = "idle" | "create" | "edit";

const WarehouseConfig = () => {
  const { isManager } = useRoleGuard();
  const warehouseBasePath = isManager() ? "/manager/warehouses" : "/admin/warehouses";
  const { id } = useParams<{ id: string }>();
  const warehouseId = Number(id);

  const { data: warehouses } = useGetWarehousesQuery();
  const warehouse = warehouses?.find((w) => w.id === warehouseId);
  const warehouseOccupiedVolume = useMemo(
    () =>
      Number(warehouse?.storedInSlotsWeight ?? 0) +
      Number(warehouse?.unassignedStockWeight ?? 0),
    [warehouse?.storedInSlotsWeight, warehouse?.unassignedStockWeight],
  );
  const isWarehouseLockedForConfig = warehouseOccupiedVolume > 0;

  const { data: zones } = useGetZonesQuery(warehouseId, {
    skip: Number.isNaN(warehouseId),
  });

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<number | null>(null);

  const { data: racks } = useGetRacksQuery(selectedZoneId ?? 0, {
    skip: !selectedZoneId,
  });

  const { data: slots } = useGetSlotsQuery(selectedRackId ?? 0, {
    skip: !selectedRackId,
  });

  /** Chỉ hiện nút đồng bộ khi rack có slot và còn slot chưa có ảnh QR. */
  const showSyncSlotQrButton = useMemo(() => {
    if (!selectedRackId || !slots?.length) return false;
    return slots.some((s) => !s.qrImageUrl?.trim());
  }, [selectedRackId, slots]);

  const [createZone] = useCreateZoneMutation();
  const [updateZone] = useUpdateZoneMutation();
  const [deleteZone] = useDeleteZoneMutation();

  const [createRack] = useCreateRackMutation();
  const [updateRack] = useUpdateRackMutation();
  const [deleteRack] = useDeleteRackMutation();

  const [createSlot] = useCreateSlotMutation();
  const [updateSlot] = useUpdateSlotMutation();
  const [deleteSlot] = useDeleteSlotMutation();
  const [updateSlotQrImage] = useUpdateSlotQrImageMutation();

  // UI state for pretty forms
  const [zoneFormMode, setZoneFormMode] = useState<FormMode>("idle");
  const [zoneForm, setZoneForm] = useState<{ name: string; lengthM: string; widthM: string }>({
    name: "",
    lengthM: "",
    widthM: "",
  });
  const [editingZone, setEditingZone] = useState<ZoneItem | null>(null);
  const [zoneDeleteTarget, setZoneDeleteTarget] = useState<ZoneItem | null>(null);

  const [rackFormMode, setRackFormMode] = useState<FormMode>("idle");
  const [rackForm, setRackForm] = useState<{ name: string; lengthM: string; widthM: string }>({
    name: "",
    lengthM: "",
    widthM: "",
  });
  const [editingRack, setEditingRack] = useState<RackItem | null>(null);
  const [rackDeleteTarget, setRackDeleteTarget] = useState<RackItem | null>(null);

  const [slotFormMode, setSlotFormMode] = useState<FormMode>("idle");
  const [slotForm, setSlotForm] = useState<{
    code: string;
    capacity: string;
    lengthCm: string;
    widthCm: string;
    heightCm: string;
  }>({
    code: "",
    capacity: "100",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
  });
  const [editingSlot, setEditingSlot] = useState<SlotItem | null>(null);
  const [slotDeleteTarget, setSlotDeleteTarget] = useState<SlotItem | null>(null);

  const resetZoneForm = () => {
    setZoneFormMode("idle");
    setZoneForm({ name: "", lengthM: "", widthM: "" });
    setEditingZone(null);
  };

  const resetRackForm = () => {
    setRackFormMode("idle");
    setRackForm({ name: "", lengthM: "", widthM: "" });
    setEditingRack(null);
  };

  const resetSlotForm = () => {
    setSlotFormMode("idle");
    setSlotForm({
      code: "",
      capacity: "100",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
    });
    setEditingSlot(null);
  };

  const zoneFloorAreaM2 = useMemo(
    () => toPositiveNumber(zoneForm.lengthM) * toPositiveNumber(zoneForm.widthM),
    [zoneForm.lengthM, zoneForm.widthM],
  );
  const rackFloorAreaM2 = useMemo(
    () => toPositiveNumber(rackForm.lengthM) * toPositiveNumber(rackForm.widthM),
    [rackForm.lengthM, rackForm.widthM],
  );
  const slotVolumeM3 = useMemo(
    () =>
      (toPositiveNumber(slotForm.lengthCm) *
        toPositiveNumber(slotForm.widthCm) *
        toPositiveNumber(slotForm.heightCm)) /
      1000000,
    [slotForm.lengthCm, slotForm.widthCm, slotForm.heightCm],
  );
  const slotFootprintM2 = useMemo(
    () => (toPositiveNumber(slotForm.lengthCm) * toPositiveNumber(slotForm.widthCm)) / 10000,
    [slotForm.lengthCm, slotForm.widthCm],
  );
  const selectedZone = useMemo(
    () => zones?.find((z) => z.id === selectedZoneId) ?? null,
    [zones, selectedZoneId],
  );
  const selectedRack = useMemo(
    () => racks?.find((r) => r.id === selectedRackId) ?? null,
    [racks, selectedRackId],
  );

  /** Payload QR = `SLOT-{id}` (khớp backend). */
  const uploadSlotQrForId = async (
    slotId: number,
    qrPayload: string,
    rackId?: number | null,
  ) => {
    const url = await uploadQrPayloadToCloudinary(qrPayload, {
      folder: "products/slots",
    });
    await updateSlotQrImage({
      slotId,
      qrImageUrl: url,
      rackId: rackId ?? undefined,
    }).unwrap();
  };

  const handleSyncMissingSlotQrImages = async () => {
    if (!selectedRackId || !slots?.length) {
      toast.error("Chọn rack có slot.");
      return;
    }
    const need = slots.filter((s) => !s.qrImageUrl?.trim());
    if (need.length === 0) {
      toast.success("Tất cả slot trong rack đã có ảnh QR.");
      return;
    }
    const t = toast.loading(
      `Đang tạo & lưu ảnh QR cho ${need.length} slot...`,
    );
    try {
      for (const s of need) {
        const payload = (s.qrCode?.trim() || `SLOT-${s.id}`) as string;
        await uploadSlotQrForId(s.id, payload, selectedRackId);
      }
      toast.success("Đã lưu ảnh QR cho các slot.", { id: t });
    } catch {
      toast.error(
        "Đồng bộ ảnh QR thất bại. Kiểm tra Cloudinary (VITE_CLOUDINARY_*).",
        { id: t },
      );
    }
  };

  const handleSubmitZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWarehouseLockedForConfig) {
      toast.error("Kho đang có sản phẩm, không thể cấu hình.");
      return;
    }
    const name = zoneForm.name.trim();
    const lengthM = toPositiveNumber(zoneForm.lengthM);
    const widthM = toPositiveNumber(zoneForm.widthM);
    if (Number.isNaN(warehouseId)) return;
    if (!name) {
      toast.error("Vui lòng nhập tên zone.");
      return;
    }
    if (name.length < MIN_NAME_LENGTH) {
      toast.error("Tên zone tối thiểu 3 ký tự.");
      return;
    }
    if (lengthM <= 0 || widthM <= 0) {
      toast.error("Zone phải có chiều dài và chiều rộng lớn hơn 0.");
      return;
    }
    const warehouseArea = Number(warehouse?.floorAreaM2 ?? 0);
    if (warehouseArea > 0) {
      const maxZonesArea = warehouseArea * 0.7;
      const otherZonesArea = (zones ?? [])
        .filter((z) => !(zoneFormMode === "edit" && editingZone && z.id === editingZone.id))
        .reduce((sum, z) => sum + Number(z.floorAreaM2 ?? 0), 0);
      if (otherZonesArea + zoneFloorAreaM2 > maxZonesArea) {
        toast.error(
          `Tổng diện tích các zone không được vượt quá 70% diện tích kho (${maxZonesArea.toFixed(2)} m²).`,
        );
        return;
      }
    }

    const toastId = toast.loading(
      zoneFormMode === "create" ? "Đang tạo zone..." : "Đang cập nhật zone..."
    );
    try {
      if (zoneFormMode === "create") {
        await createZone({ warehouseId, name, lengthM, widthM, floorAreaM2: zoneFloorAreaM2 }).unwrap();
        toast.success("Tạo zone thành công.", { id: toastId });
      } else if (zoneFormMode === "edit" && editingZone) {
        await updateZone({
          warehouseId: editingZone.warehouseId,
          id: editingZone.id,
          name,
          lengthM,
          widthM,
          floorAreaM2: zoneFloorAreaM2,
        }).unwrap();
        toast.success("Cập nhật zone thành công.", { id: toastId });
      }
      resetZoneForm();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string; message?: string } })?.data
          ?.error ||
        (err as { data?: { message?: string } })?.data?.message ||
        (zoneFormMode === "create"
          ? "Tạo zone thất bại."
          : "Cập nhật zone thất bại.");
      toast.error(msg, { id: toastId });
    }
  };

  const handleSubmitRack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWarehouseLockedForConfig) {
      toast.error("Kho đang có sản phẩm, không thể cấu hình.");
      return;
    }
    const name = rackForm.name.trim();
    const lengthM = toPositiveNumber(rackForm.lengthM);
    const widthM = toPositiveNumber(rackForm.widthM);
    if (!selectedZoneId) return;
    if (!name) {
      toast.error("Vui lòng nhập tên rack.");
      return;
    }
    if (name.length < MIN_NAME_LENGTH) {
      toast.error("Tên rack tối thiểu 3 ký tự.");
      return;
    }
    if (lengthM <= 0 || widthM <= 0) {
      toast.error("Rack phải có chiều dài và chiều rộng lớn hơn 0.");
      return;
    }
    const zoneArea = Number(selectedZone?.floorAreaM2 ?? 0);
    if (zoneArea > 0) {
      const maxRacksArea = zoneArea * 0.7;
      const otherRacksArea = (racks ?? [])
        .filter((r) => !(rackFormMode === "edit" && editingRack && r.id === editingRack.id))
        .reduce((sum, r) => sum + Number(r.floorAreaM2 ?? 0), 0);
      if (otherRacksArea + rackFloorAreaM2 > maxRacksArea) {
        toast.error(
          `Tổng diện tích các rack không được vượt quá 70% diện tích zone (${maxRacksArea.toFixed(2)} m²).`,
        );
        return;
      }
    }

    const toastId = toast.loading(
      rackFormMode === "create" ? "Đang tạo rack..." : "Đang cập nhật rack..."
    );
    try {
      if (rackFormMode === "create") {
        await createRack({ zoneId: selectedZoneId, name, lengthM, widthM, floorAreaM2: rackFloorAreaM2 }).unwrap();
        toast.success("Tạo rack thành công.", { id: toastId });
      } else if (rackFormMode === "edit" && editingRack) {
        await updateRack({
          zoneId: editingRack.zoneId,
          id: editingRack.id,
          name,
          lengthM,
          widthM,
          floorAreaM2: rackFloorAreaM2,
        }).unwrap();
        toast.success("Cập nhật rack thành công.", { id: toastId });
      }
      resetRackForm();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string; message?: string } })?.data
          ?.error ||
        (err as { data?: { message?: string } })?.data?.message ||
        (rackFormMode === "create"
          ? "Tạo rack thất bại."
          : "Cập nhật rack thất bại.");
      toast.error(msg, { id: toastId });
    }
  };

  const handleSubmitSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWarehouseLockedForConfig) {
      toast.error("Kho đang có sản phẩm, không thể cấu hình.");
      return;
    }
    const code = slotForm.code.trim();
    const capacity = Number(slotForm.capacity);
    const lengthCm = toPositiveNumber(slotForm.lengthCm);
    const widthCm = toPositiveNumber(slotForm.widthCm);
    const heightCm = toPositiveNumber(slotForm.heightCm);
    if (!selectedRackId) return;
    if (!code) {
      toast.error("Vui lòng nhập mã slot.");
      return;
    }
    if (Number.isNaN(capacity) || capacity <= 0) {
      toast.error("Sức chứa phải lớn hơn 0.");
      return;
    }
    if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
      toast.error("Slot phải nhập đủ dài, rộng, cao lớn hơn 0.");
      return;
    }
    const rackArea = Number(selectedRack?.floorAreaM2 ?? 0);
    if (rackArea > 0 && slotFootprintM2 > rackArea) {
      toast.error(`Diện tích đáy slot không được lớn hơn diện tích rack (${rackArea.toFixed(2)} m²).`);
      return;
    }
    if (rackArea > 0) {
      const otherSlotsBaseArea = (slots ?? [])
        .filter((s) => !(slotFormMode === "edit" && editingSlot && s.id === editingSlot.id))
        .reduce((sum, s) => {
          const l = Number(s.lengthCm ?? 0);
          const w = Number(s.widthCm ?? 0);
          return sum + (l > 0 && w > 0 ? (l * w) / 10000 : 0);
        }, 0);
      if (otherSlotsBaseArea + slotFootprintM2 > rackArea) {
        toast.error(`Tổng diện tích đáy các slot không được vượt quá diện tích rack (${rackArea.toFixed(2)} m²).`);
        return;
      }
    }

    const toastId = toast.loading(
      slotFormMode === "create" ? "Đang tạo slot..." : "Đang cập nhật slot..."
    );
    try {
      if (slotFormMode === "create") {
        const created = await createSlot({
          rackId: selectedRackId,
          code,
          capacity,
          lengthCm,
          widthCm,
          heightCm,
          volumeM3: slotVolumeM3,
        }).unwrap();
        toast.success("Tạo slot thành công.", { id: toastId });
        resetSlotForm();
        const qrToast = toast.loading("Đang tạo ảnh QR slot...");
        try {
          await uploadSlotQrForId(created.id, `SLOT-${created.id}`);
          toast.success("Đã lưu ảnh QR slot.", { id: qrToast });
        } catch {
          toast.error(
            "Tạo slot xong nhưng lưu ảnh QR thất bại. Kiểm tra Cloudinary hoặc bấm \"Đồng bộ ảnh QR\".",
            { id: qrToast },
          );
        }
      } else if (slotFormMode === "edit" && editingSlot) {
        await updateSlot({
          rackId: editingSlot.rackId,
          id: editingSlot.id,
          code,
          capacity,
          lengthCm,
          widthCm,
          heightCm,
          volumeM3: slotVolumeM3,
        }).unwrap();
        toast.success("Cập nhật slot thành công.", { id: toastId });
        resetSlotForm();
        if (!editingSlot.qrImageUrl?.trim()) {
          const qrToast = toast.loading("Đang tạo ảnh QR slot...");
          try {
            await uploadSlotQrForId(
              editingSlot.id,
              `SLOT-${editingSlot.id}`,
              selectedRackId,
            );
            toast.success("Đã lưu ảnh QR slot.", { id: qrToast });
          } catch {
            toast.error(
              "Cập nhật slot xong nhưng lưu ảnh QR thất bại. Kiểm tra Cloudinary.",
              { id: qrToast },
            );
          }
        }
      } else {
        resetSlotForm();
      }
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string; message?: string } })?.data
          ?.error ||
        (err as { data?: { message?: string } })?.data?.message ||
        (slotFormMode === "create"
          ? "Tạo slot thất bại."
          : "Cập nhật slot thất bại.");
      toast.error(msg, { id: toastId });
    }
  };

  if (Number.isNaN(warehouseId)) {
    return (
      <div className="px-5">
        <div className="bg-white rounded-[15px] p-6 shadow-sm">
          <p className="text-sm text-red-500">
            Không tìm thấy kho. Vui lòng quay lại danh sách kho.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Cấu hình kho
            </h1>
            {warehouse && (
              <p className="text-xs text-slate-500 mt-1">
                {warehouse.name} — {warehouse.location}
              </p>
            )}
            {isWarehouseLockedForConfig && (
              <p className="text-xs text-amber-600 mt-1 font-medium">
                Kho đang có sản phẩm ({warehouseOccupiedVolume.toFixed(4)} m³), tạm khóa cấu hình.
              </p>
            )}
          </div>
          <Link
            to={warehouseBasePath}
            className="text-xs text-emerald-600 hover:underline"
          >
            ← Quay lại danh sách kho
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
          {/* ZONES */}
          <div className="border border-slate-200 rounded-xl p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Zone (khu vực)
              </h2>
              <button
                type="button"
                disabled={isWarehouseLockedForConfig}
                onClick={() => {
                  setZoneFormMode("create");
                  setZoneForm({ name: "", lengthM: "", widthM: "" });
                  setEditingZone(null);
                }}
                className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Thêm
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {zones && zones.length > 0 ? (
                zones.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => {
                      setSelectedZoneId(z.id);
                      setSelectedRackId(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs border ${
                      selectedZoneId === z.id
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">
                      {z.name}
                      {z.floorAreaM2 ? ` • ${z.floorAreaM2.toFixed(2)} m²` : ""}
                    </span>
                    <span className="flex gap-1">
                      <button
                        type="button"
                        disabled={isWarehouseLockedForConfig}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isWarehouseLockedForConfig) return;
                          setZoneFormMode("edit");
                          setEditingZone(z);
                          setZoneForm({
                            name: z.name,
                            lengthM: z.lengthM ? String(z.lengthM) : "",
                            widthM: z.widthM ? String(z.widthM) : "",
                          });
                        }}
                        className="text-[10px] text-slate-500 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        disabled={isWarehouseLockedForConfig}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isWarehouseLockedForConfig) return;
                          setZoneDeleteTarget(z);
                        }}
                        className="text-[10px] text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Xóa
                      </button>
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-500">
                  Chưa có zone nào.
                </p>
              )}
            </div>

            {/* Zone form */}
            {zoneFormMode !== "idle" && (
              <form
                onSubmit={handleSubmitZone}
                className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 space-y-2"
              >
                <p className="text-[11px] font-semibold text-emerald-800">
                  {zoneFormMode === "create" ? "Thêm zone mới" : "Chỉnh sửa zone"}
                </p>
                <input
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Tên zone"
                  className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={zoneForm.lengthM}
                    onChange={(e) => setZoneForm((prev) => ({ ...prev, lengthM: e.target.value }))}
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Dài (m)"
                    className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs"
                  />
                  <input
                    value={zoneForm.widthM}
                    onChange={(e) => setZoneForm((prev) => ({ ...prev, widthM: e.target.value }))}
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Rộng (m)"
                    className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-600">Diện tích sàn: {zoneFloorAreaM2.toFixed(2)} m²</p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetZoneForm}
                    className="px-3 py-1 rounded-md border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-md bg-emerald-600 text-[11px] text-white hover:bg-emerald-700"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            )}

            {/* Zone delete confirm */}
            {zoneDeleteTarget && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
                <p className="mb-2">
                  Xóa zone "{zoneDeleteTarget.name}"? Hành động này có thể xóa
                  cả rack/slot bên trong.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setZoneDeleteTarget(null)}
                    className="px-3 py-1 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isWarehouseLockedForConfig}
                    onClick={async () => {
                      if (isWarehouseLockedForConfig) return;
                      const toastId = toast.loading("Đang xóa zone...");
                      try {
                        await deleteZone({
                          warehouseId: zoneDeleteTarget.warehouseId,
                          id: zoneDeleteTarget.id,
                        }).unwrap();
                        toast.success("Xóa zone thành công.", { id: toastId });
                        if (selectedZoneId === zoneDeleteTarget.id) {
                          setSelectedZoneId(null);
                          setSelectedRackId(null);
                        }
                        setZoneDeleteTarget(null);
                      } catch (err: unknown) {
                        const msg =
                          (err as { data?: { error?: string; message?: string } })
                            ?.data?.error ||
                          (err as { data?: { message?: string } })?.data
                            ?.message ||
                          "Xóa zone thất bại.";
                        toast.error(msg, { id: toastId });
                      }
                    }}
                    className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RACKS */}
          <div className="border border-slate-200 rounded-xl p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Rack (kệ)
              </h2>
              <button
                type="button"
                disabled={isWarehouseLockedForConfig}
                onClick={() => {
                  if (!selectedZoneId) return;
                  setRackFormMode("create");
                  setRackForm({ name: "", lengthM: "", widthM: "" });
                  setEditingRack(null);
                }}
                className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Thêm
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {selectedZoneId ? (
                racks && racks.length > 0 ? (
                  racks.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRackId(r.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs border ${
                        selectedRackId === r.id
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">
                        {r.name}
                        {r.floorAreaM2 ? ` • ${r.floorAreaM2.toFixed(2)} m²` : ""}
                      </span>
                      <span className="flex gap-1">
                        <button
                          type="button"
                          disabled={isWarehouseLockedForConfig}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isWarehouseLockedForConfig) return;
                            setRackFormMode("edit");
                            setEditingRack(r);
                            setRackForm({
                              name: r.name,
                              lengthM: r.lengthM ? String(r.lengthM) : "",
                              widthM: r.widthM ? String(r.widthM) : "",
                            });
                          }}
                          className="text-[10px] text-slate-500 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={isWarehouseLockedForConfig}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isWarehouseLockedForConfig) return;
                            setRackDeleteTarget(r);
                          }}
                          className="text-[10px] text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Xóa
                        </button>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    Chưa có rack nào trong zone này.
                  </p>
                )
              ) : (
                <p className="text-xs text-slate-500">
                  Chọn một zone để xem rack.
                </p>
              )}
            </div>

            {/* Rack form */}
            {rackFormMode !== "idle" && (
              <form
                onSubmit={handleSubmitRack}
                className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 space-y-2"
              >
                <p className="text-[11px] font-semibold text-emerald-800">
                  {rackFormMode === "create" ? "Thêm rack mới" : "Chỉnh sửa rack"}
                </p>
                <input
                  value={rackForm.name}
                  onChange={(e) => setRackForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Tên rack"
                  className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={rackForm.lengthM}
                    onChange={(e) => setRackForm((prev) => ({ ...prev, lengthM: e.target.value }))}
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Dài (m)"
                    className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs"
                  />
                  <input
                    value={rackForm.widthM}
                    onChange={(e) => setRackForm((prev) => ({ ...prev, widthM: e.target.value }))}
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Rộng (m)"
                    className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-600">Diện tích sàn: {rackFloorAreaM2.toFixed(2)} m²</p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetRackForm}
                    className="px-3 py-1 rounded-md border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-md bg-emerald-600 text-[11px] text-white hover:bg-emerald-700"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            )}

            {/* Rack delete confirm */}
            {rackDeleteTarget && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
                <p className="mb-2">
                  Xóa rack "{rackDeleteTarget.name}"? Hành động này có thể xóa
                  toàn bộ slot bên trong.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRackDeleteTarget(null)}
                    className="px-3 py-1 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isWarehouseLockedForConfig}
                    onClick={async () => {
                      if (isWarehouseLockedForConfig) return;
                      const toastId = toast.loading("Đang xóa rack...");
                      try {
                        await deleteRack({
                          zoneId: rackDeleteTarget.zoneId,
                          id: rackDeleteTarget.id,
                        }).unwrap();
                        toast.success("Xóa rack thành công.", { id: toastId });
                        if (selectedRackId === rackDeleteTarget.id) {
                          setSelectedRackId(null);
                        }
                        setRackDeleteTarget(null);
                      } catch (err: unknown) {
                        const msg =
                          (err as { data?: { error?: string; message?: string } })
                            ?.data?.error ||
                          (err as { data?: { message?: string } })?.data
                            ?.message ||
                          "Xóa rack thất bại.";
                        toast.error(msg, { id: toastId });
                      }
                    }}
                    className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SLOTS */}
          <div className="border border-slate-200 rounded-xl p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-slate-800">
                Slot (ô chứa)
              </h2>
              <div className="flex gap-1 flex-wrap justify-end">
                {showSyncSlotQrButton ? (
                  <button
                    type="button"
                    onClick={() => void handleSyncMissingSlotQrImages()}
                    className="text-xs px-2 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                    title="Tạo ảnh QR (qrserver → Cloudinary) cho slot chưa có ảnh"
                  >
                    Đồng bộ ảnh QR
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={isWarehouseLockedForConfig}
                  onClick={() => {
                    if (!selectedRackId) return;
                    setSlotFormMode("create");
                    setSlotForm({
                      code: "",
                      capacity: "100",
                      lengthCm: "",
                      widthCm: "",
                      heightCm: "",
                    });
                    setEditingSlot(null);
                  }}
                  className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Thêm
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {selectedRackId ? (
                slots && slots.length > 0 ? (
                  slots.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs border bg-slate-50 border-slate-200 hover:bg-slate-100"
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          {s.code}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Sức chứa: {s.capacity} m³ • Đang chứa:{" "}
                          {s.currentCapacity} m³
                        </p>
                        <p className="text-[11px] text-slate-500">
                          KT: {s.lengthCm ?? 0} x {s.widthCm ?? 0} x {s.heightCm ?? 0} cm • {s.volumeM3 ?? 0} m³
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={isWarehouseLockedForConfig}
                          onClick={() => {
                            if (isWarehouseLockedForConfig) return;
                            setSlotFormMode("edit");
                            setEditingSlot(s);
                            setSlotForm({
                              code: s.code,
                              capacity: String(s.capacity || 0),
                              lengthCm: s.lengthCm ? String(s.lengthCm) : "",
                              widthCm: s.widthCm ? String(s.widthCm) : "",
                              heightCm: s.heightCm ? String(s.heightCm) : "",
                            });
                          }}
                          className="text-[10px] text-slate-500 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={isWarehouseLockedForConfig}
                          onClick={() => {
                            if (isWarehouseLockedForConfig) return;
                            setSlotDeleteTarget(s);
                          }}
                          className="text-[10px] text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    Chưa có slot nào trong rack này.
                  </p>
                )
              ) : (
                <p className="text-xs text-slate-500">
                  Chọn một rack để xem slot.
                </p>
              )}
            </div>

            {/* Slot form */}
            {slotFormMode !== "idle" && (
              <form
                onSubmit={handleSubmitSlot}
                className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 space-y-2"
              >
                <p className="text-[11px] font-semibold text-emerald-800">
                  {slotFormMode === "create"
                    ? "Thêm slot mới"
                    : "Chỉnh sửa slot"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-600">
                      Mã slot
                    </label>
                    <input
                      value={slotForm.code}
                      onChange={(e) =>
                        setSlotForm((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      placeholder="Ví dụ: A-01"
                      className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-600">
                      Sức chứa (m³)
                    </label>
                    <input
                      value={slotForm.capacity}
                      onChange={(e) =>
                        setSlotForm((prev) => ({
                          ...prev,
                          capacity: e.target.value,
                        }))
                      }
                      type="number"
                      min={0}
                      step={0.1}
                      className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={slotForm.lengthCm}
                    onChange={(e) => setSlotForm((prev) => ({ ...prev, lengthCm: e.target.value }))}
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="Dài (cm)"
                    className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs"
                  />
                  <input
                    value={slotForm.widthCm}
                    onChange={(e) => setSlotForm((prev) => ({ ...prev, widthCm: e.target.value }))}
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="Rộng (cm)"
                    className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs"
                  />
                  <input
                    value={slotForm.heightCm}
                    onChange={(e) => setSlotForm((prev) => ({ ...prev, heightCm: e.target.value }))}
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="Cao (cm)"
                    className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-600">Thể tích: {slotVolumeM3.toFixed(4)} m³</p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetSlotForm}
                    className="px-3 py-1 rounded-md border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-md bg-emerald-600 text-[11px] text-white hover:bg-emerald-700"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            )}

            {/* Slot delete confirm */}
            {slotDeleteTarget && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
                <p className="mb-2">
                  Xóa slot "{slotDeleteTarget.code}"?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSlotDeleteTarget(null)}
                    className="px-3 py-1 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isWarehouseLockedForConfig}
                    onClick={async () => {
                      if (isWarehouseLockedForConfig) return;
                      const toastId = toast.loading("Đang xóa slot...");
                      try {
                        await deleteSlot({
                          rackId: slotDeleteTarget.rackId,
                          id: slotDeleteTarget.id,
                        }).unwrap();
                        toast.success("Xóa slot thành công.", { id: toastId });
                        setSlotDeleteTarget(null);
                      } catch (err: unknown) {
                        const msg =
                          (err as { data?: { error?: string; message?: string } })
                            ?.data?.error ||
                          (err as { data?: { message?: string } })?.data
                            ?.message ||
                          "Xóa slot thất bại.";
                        toast.error(msg, { id: toastId });
                      }
                    }}
                    className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseConfig;

