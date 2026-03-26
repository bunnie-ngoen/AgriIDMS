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

type FormMode = "idle" | "create" | "edit";

const WarehouseConfig = () => {
  const { isManager } = useRoleGuard();
  const warehouseBasePath = isManager() ? "/manager/warehouses" : "/admin/warehouses";
  const { id } = useParams<{ id: string }>();
  const warehouseId = Number(id);

  const { data: warehouses } = useGetWarehousesQuery();
  const warehouse = warehouses?.find((w) => w.id === warehouseId);

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
  const [zoneFormName, setZoneFormName] = useState("");
  const [editingZone, setEditingZone] = useState<ZoneItem | null>(null);
  const [zoneDeleteTarget, setZoneDeleteTarget] = useState<ZoneItem | null>(null);

  const [rackFormMode, setRackFormMode] = useState<FormMode>("idle");
  const [rackFormName, setRackFormName] = useState("");
  const [editingRack, setEditingRack] = useState<RackItem | null>(null);
  const [rackDeleteTarget, setRackDeleteTarget] = useState<RackItem | null>(null);

  const [slotFormMode, setSlotFormMode] = useState<FormMode>("idle");
  const [slotForm, setSlotForm] = useState<{ code: string; capacity: string }>({
    code: "",
    capacity: "100",
  });
  const [editingSlot, setEditingSlot] = useState<SlotItem | null>(null);
  const [slotDeleteTarget, setSlotDeleteTarget] = useState<SlotItem | null>(null);

  const resetZoneForm = () => {
    setZoneFormMode("idle");
    setZoneFormName("");
    setEditingZone(null);
  };

  const resetRackForm = () => {
    setRackFormMode("idle");
    setRackFormName("");
    setEditingRack(null);
  };

  const resetSlotForm = () => {
    setSlotFormMode("idle");
    setSlotForm({ code: "", capacity: "100" });
    setEditingSlot(null);
  };

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
    const name = zoneFormName.trim();
    if (Number.isNaN(warehouseId)) return;
    if (!name) {
      toast.error("Vui lòng nhập tên zone.");
      return;
    }
    if (name.length < MIN_NAME_LENGTH) {
      toast.error("Tên zone tối thiểu 3 ký tự.");
      return;
    }

    const toastId = toast.loading(
      zoneFormMode === "create" ? "Đang tạo zone..." : "Đang cập nhật zone..."
    );
    try {
      if (zoneFormMode === "create") {
        await createZone({ warehouseId, name }).unwrap();
        toast.success("Tạo zone thành công.", { id: toastId });
      } else if (zoneFormMode === "edit" && editingZone) {
        await updateZone({
          warehouseId: editingZone.warehouseId,
          id: editingZone.id,
          name,
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
    const name = rackFormName.trim();
    if (!selectedZoneId) return;
    if (!name) {
      toast.error("Vui lòng nhập tên rack.");
      return;
    }
    if (name.length < MIN_NAME_LENGTH) {
      toast.error("Tên rack tối thiểu 3 ký tự.");
      return;
    }

    const toastId = toast.loading(
      rackFormMode === "create" ? "Đang tạo rack..." : "Đang cập nhật rack..."
    );
    try {
      if (rackFormMode === "create") {
        await createRack({ zoneId: selectedZoneId, name }).unwrap();
        toast.success("Tạo rack thành công.", { id: toastId });
      } else if (rackFormMode === "edit" && editingRack) {
        await updateRack({
          zoneId: editingRack.zoneId,
          id: editingRack.id,
          name,
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
    const code = slotForm.code.trim();
    const capacity = Number(slotForm.capacity);
    if (!selectedRackId) return;
    if (!code) {
      toast.error("Vui lòng nhập mã slot.");
      return;
    }
    if (Number.isNaN(capacity) || capacity <= 0) {
      toast.error("Sức chứa phải lớn hơn 0.");
      return;
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
                onClick={() => {
                  setZoneFormMode("create");
                  setZoneFormName("");
                  setEditingZone(null);
                }}
                className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
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
                    <span className="truncate">{z.name}</span>
                    <span className="flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoneFormMode("edit");
                          setEditingZone(z);
                          setZoneFormName(z.name);
                        }}
                        className="text-[10px] text-slate-500 hover:text-emerald-700"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoneDeleteTarget(z);
                        }}
                        className="text-[10px] text-red-500 hover:text-red-700"
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
                  {zoneFormMode === "create" ? "Thêm zone mới" : "Đổi tên zone"}
                </p>
                <input
                  value={zoneFormName}
                  onChange={(e) => setZoneFormName(e.target.value)}
                  placeholder="Tên zone"
                  className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
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
                    onClick={async () => {
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
                    className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
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
                onClick={() => {
                  if (!selectedZoneId) return;
                  setRackFormMode("create");
                  setRackFormName("");
                  setEditingRack(null);
                }}
                className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
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
                      <span className="truncate">{r.name}</span>
                      <span className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRackFormMode("edit");
                            setEditingRack(r);
                            setRackFormName(r.name);
                          }}
                          className="text-[10px] text-slate-500 hover:text-emerald-700"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRackDeleteTarget(r);
                          }}
                          className="text-[10px] text-red-500 hover:text-red-700"
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
                  {rackFormMode === "create" ? "Thêm rack mới" : "Đổi tên rack"}
                </p>
                <input
                  value={rackFormName}
                  onChange={(e) => setRackFormName(e.target.value)}
                  placeholder="Tên rack"
                  className="w-full p-2 rounded-md border border-emerald-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
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
                    onClick={async () => {
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
                    className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
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
                  onClick={() => {
                    if (!selectedRackId) return;
                    setSlotFormMode("create");
                    setSlotForm({ code: "", capacity: "100" });
                    setEditingSlot(null);
                  }}
                  className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
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
                          Sức chứa: {s.capacity} • Đang chứa:{" "}
                          {s.currentCapacity}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSlotFormMode("edit");
                            setEditingSlot(s);
                            setSlotForm({
                              code: s.code,
                              capacity: String(s.capacity || 0),
                            });
                          }}
                          className="text-[10px] text-slate-500 hover:text-emerald-700"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlotDeleteTarget(s)}
                          className="text-[10px] text-red-500 hover:text-red-700"
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
                      Sức chứa (kg)
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
                    onClick={async () => {
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
                    className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
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

