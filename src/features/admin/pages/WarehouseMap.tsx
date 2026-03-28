import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetWarehouseQuery,
  useGetZonesQuery,
  useGetRacksQuery,
  useGetSlotsQuery,
  useGetSlotContentsQuery,
  useSyncSlotCapacitiesByWarehouseMutation,
} from "../api/create-user.api";
import {
  useGetUnassignedBoxesByWarehouseQuery,
  useGetExpiredBoxesByWarehouseQuery,
  useDisposeExpiredBoxesMutation,
  useGetDisposeHistoryByWarehouseQuery,
} from "../../goods-receipt/api/goods-receipt.api";
import type { SlotBoxItem, SlotItem } from "../types/warehouse.type";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";

/** Panel chi tiết slot: thông tin + slot chứa gì (hiện tại chỉ có capacity, có thể bổ sung API sản phẩm sau) */
const SlotDetailPanel = ({
  slot,
  onClose,
  onTransferBox,
  className = "",
}: {
  slot: SlotItem;
  onClose: () => void;
  onTransferBox: (box: SlotBoxItem) => void;
  className?: string;
}) => {
  const { data: contents, isLoading: isLoadingContents, refetch: refetchContents } =
    useGetSlotContentsQuery(slot.id);
  const [selectedBox, setSelectedBox] = useState<SlotBoxItem | null>(null);
  const [isBoxesModalOpen, setIsBoxesModalOpen] = useState(false);
  const [disposeExpiredBoxes, disposeExpiredState] =
    useDisposeExpiredBoxesMutation();

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore (clipboard API may be blocked)
    }
  };

  const ratio =
    slot.capacity > 0
      ? Math.min(1, (slot.currentCapacity || 0) / slot.capacity) * 100
      : 0;

  const handleDisposeSingleBox = async (box: SlotBoxItem) => {
    const isExpired =
      !!box.expiryDate && new Date(box.expiryDate).getTime() <= Date.now();
    if (!isExpired) {
      toast.error("Chỉ tiêu hủy box đã hết hạn.");
      return;
    }

    const ok = window.confirm(
      `Xác nhận tiêu hủy box ${box.boxCode} (${box.weight} kg)? Hệ thống sẽ ghi transaction.`,
    );
    if (!ok) return;

    try {
      const res = await disposeExpiredBoxes({ boxIds: [box.id] }).unwrap();
      toast.success(
        `${res.message}. Đã tiêu hủy ${res.disposedCount}/${res.requestedCount} box.`,
      );
      await refetchContents();
      if (selectedBox?.id === box.id) setSelectedBox(null);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Tiêu hủy box thất bại.";
      toast.error(msg);
    }
  };

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-left ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {selectedBox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedBox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  Chi tiết box
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Slot {slot.code}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBox(null)}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center text-lg leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-4 text-[11px] space-y-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                {selectedBox.qrCode && (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500">QR</p>
                      <p className="font-mono text-[11px] text-slate-900 break-all mt-1">
                        {selectedBox.qrCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(selectedBox.qrCode || "")}
                      className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">Khối lượng</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums mt-1">
                    {selectedBox.weight} kg
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">Trạng thái</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {selectedBox.status || "—"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">Sản phẩm</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {contents?.productName || "—"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">Biến thể</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {contents?.variantName || "—"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2 col-span-2">
                  <dt className="text-[10px] text-slate-500">Lot</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {selectedBox.lotCode} (#{selectedBox.lotId})
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">Ngày nhận</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {selectedBox.receivedDate
                      ? new Date(selectedBox.receivedDate).toLocaleDateString(
                          "vi-VN",
                        )
                      : "—"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <dt className="text-[10px] text-slate-500">HSD</dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {selectedBox.expiryDate
                      ? new Date(selectedBox.expiryDate).toLocaleDateString(
                          "vi-VN",
                        )
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {isBoxesModalOpen && contents && contents.boxCount > 0 && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setIsBoxesModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Danh sách box trong slot {slot.code}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {contents.productName || "Sản phẩm"}
                  {contents.variantName ? ` · ${contents.variantName}` : ""} —{" "}
                  {contents.boxCount} box · {contents.totalBoxWeight} kg
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBoxesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-100 bg-slate-50">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="text-left font-semibold px-3 py-2">Box</th>
                      <th className="text-right font-semibold px-3 py-2">
                        Thao tác
                      </th>
                      <th className="text-right font-semibold px-3 py-2">Kg</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {[...contents.boxes]
                      .sort((a, b) => {
                        const da = a.expiryDate
                          ? new Date(a.expiryDate).getTime()
                          : Number.POSITIVE_INFINITY;
                        const db = b.expiryDate
                          ? new Date(b.expiryDate).getTime()
                          : Number.POSITIVE_INFINITY;
                        return da - db; // gần hết hạn lên đầu
                      })
                      .map((b) => (
                      <tr
                        key={b.id}
                        className="border-t border-slate-100 hover:bg-white cursor-pointer"
                        onClick={() => {
                          setSelectedBox(b);
                        }}
                        title="Bấm xem chi tiết box"
                      >
                        <td className="px-3 py-2 pr-2">
                          <div className="font-mono text-[10px] truncate max-w-[320px]">
                            {b.boxCode}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[320px]">
                            Biến thể: {contents.variantName || "—"} · HSD:{" "}
                            {b.expiryDate
                              ? new Date(b.expiryDate).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTransferBox(b);
                              }}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                              title="Chuyển box sang slot khác"
                            >
                              Chuyển
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDisposeSingleBox(b);
                              }}
                              disabled={
                                disposeExpiredState.isLoading ||
                                !b.expiryDate ||
                                new Date(b.expiryDate).getTime() > Date.now()
                              }
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                              title={
                                !b.expiryDate
                                  ? "Box chưa có HSD"
                                  : new Date(b.expiryDate).getTime() > Date.now()
                                    ? "Chỉ tiêu hủy box đã hết hạn"
                                    : "Tiêu hủy box (ghi transaction)"
                              }
                            >
                              Tiêu hủy
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {b.weight}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[10px] text-amber-600">
                Quy định: 1 slot chỉ được chứa 1 loại sản phẩm.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span
          id="slot-modal-title"
          className="text-xs font-semibold text-slate-800"
        >
          Chi tiết slot: {slot.code}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          aria-label="Đóng"
        >
          ×
        </button>
      </div>
      <dl className="space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <dt className="text-slate-500">Sức chứa (kg)</dt>
          <dd className="font-medium text-slate-800">{slot.capacity}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Đang chứa (kg)</dt>
          <dd className="font-medium text-slate-800">{slot.currentCapacity}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Tỷ lệ sử dụng</dt>
          <dd className="font-medium text-slate-800">{ratio.toFixed(0)}%</dd>
        </div>
        {slot.qrCode && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">QR</dt>
              <dd className="font-mono text-[10px] text-slate-600 truncate max-w-[120px]">
                {slot.qrCode}
              </dd>
            </div>
            {slot.qrImageUrl ? (
              <div className="flex justify-center pt-1">
                <img
                  src={slot.qrImageUrl}
                  alt=""
                  className="h-24 w-24 rounded-lg border border-slate-200 bg-white object-contain"
                />
              </div>
            ) : null}
          </div>
        )}
      </dl>
      <div className="mt-2 pt-2 border-t border-slate-100">
        <p className="text-[10px] font-medium text-slate-600 mb-0.5">
          Slot đang chứa
        </p>
        {isLoadingContents ? (
          <p className="text-[11px] text-slate-500">Đang tải chi tiết...</p>
        ) : !contents || contents.boxCount === 0 ? (
          <p className="text-[11px] text-slate-700">
            Trống ({slot.currentCapacity} / {slot.capacity} kg ·{" "}
            {ratio.toFixed(0)}% tải)
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[11px] text-slate-700">
              <span className="font-semibold">
                {contents.productName || "Sản phẩm"}
              </span>
              {contents.variantName ? ` · ${contents.variantName}` : ""} —{" "}
              {contents.boxCount} box · {contents.totalBoxWeight} kg
            </p>
            <p className="text-[10px] text-slate-500">
              {contents.currentCapacity} / {contents.capacity} kg · còn{" "}
              {contents.remainingCapacity} kg trống
            </p>
            <button
              type="button"
              onClick={() => setIsBoxesModalOpen(true)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Xem danh sách box ({contents.boxCount})
            </button>
            <p className="text-[10px] text-amber-600">
              Quy định: 1 slot chỉ được chứa 1 loại sản phẩm.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const getUsageStyleFromRatio = (ratio: number) => {
  if (ratio <= 0) {
    return "bg-slate-100 border-slate-200 text-slate-600";
  }
  if (ratio < 0.7) {
    return "bg-emerald-500/90 border-emerald-500 text-white";
  }
  if (ratio < 0.9) {
    return "bg-amber-400/90 border-amber-400 text-slate-900";
  }
  return "bg-rose-500/95 border-rose-500 text-white";
};

type RackOverviewProps = {
  rackId: number;
  name: string;
  onSlotClick?: (slot: SlotItem) => void;
  variantFilterId?: number | null;
};

const RackOverview = ({
  rackId,
  name,
  onSlotClick,
  variantFilterId,
}: RackOverviewProps) => {
  const { data: slots, isLoading } = useGetSlotsQuery(rackId);

  const { totalCapacity, totalCurrent } = useMemo(() => {
    if (!slots || slots.length === 0) {
      return { totalCapacity: 0, totalCurrent: 0 };
    }
    return slots.reduce(
      (acc, s) => ({
        totalCapacity: acc.totalCapacity + (s.capacity || 0),
        totalCurrent: acc.totalCurrent + (s.currentCapacity || 0),
      }),
      { totalCapacity: 0, totalCurrent: 0 }
    );
  }, [slots]);

  const ratio =
    totalCapacity > 0 ? Math.min(1, totalCurrent / totalCapacity) : 0;
  const style = getUsageStyleFromRatio(ratio);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition hover:shadow-md min-w-[200px]">
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 ${style}`}
      >
        <span className="font-semibold text-sm truncate">{name}</span>
        <span className="text-[10px] opacity-90 whitespace-nowrap shrink-0">
          {totalCurrent}/{totalCapacity} ({Math.round(ratio * 100)}%)
        </span>
      </div>
      {isLoading && (
        <div className="px-3 py-2 text-[10px] text-slate-500">
          Đang tải slot...
        </div>
      )}
      {slots && slots.length > 0 && (
        <div className="p-2 flex flex-wrap gap-1.5">
          {slots.map((s) => {
            const r =
              s.capacity && s.capacity > 0
                ? Math.min(1, s.currentCapacity / s.capacity)
                : 0;
            const cellStyle = getUsageStyleFromRatio(r);
            const pct = Math.round(r * 100);
            const isVariantMatched =
              !!variantFilterId &&
              Number(s.productVariantId ?? 0) === Number(variantFilterId);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSlotClick?.(s)}
                className={`inline-flex flex-col items-center justify-center rounded-lg border min-w-[52px] py-1.5 px-1.5 text-[10px] font-medium cursor-pointer transition ring-2 ring-transparent hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${cellStyle} ${
                  isVariantMatched
                    ? "bg-blue-600/95 text-white"
                    : ""
                }`}
                title={`${s.code}: ${s.currentCapacity}/${s.capacity} (${pct}%) — Bấm xem chi tiết`}
              >
                <span className="truncate max-w-full font-semibold">
                  {s.code}
                </span>
                <span className="text-[9px] opacity-90 mt-0.5">
                  {s.currentCapacity}/{s.capacity} ({pct}%)
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

type ZoneOverviewProps = {
  zoneId: number;
  name: string;
  onSlotClick?: (slot: SlotItem) => void;
  variantFilterId?: number | null;
};

const ZoneOverview = ({
  zoneId,
  name,
  onSlotClick,
  variantFilterId,
}: ZoneOverviewProps) => {
  const { data: racks, isLoading } = useGetRacksQuery(zoneId);

  return (
    <div className="border border-slate-200 rounded-2xl p-3.5 bg-gradient-to-b from-slate-50 to-slate-100/60 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-900">
          Zone <span className="font-bold">{name}</span>
        </p>
        <p className="text-[10px] text-slate-500">
          {isLoading ? "Đang tải rack..." : `${racks?.length ?? 0} rack`}
        </p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {racks && racks.length > 0 ? (
          racks.map((r) => (
            <RackOverview
              key={r.id}
              rackId={r.id}
              name={r.name}
              onSlotClick={onSlotClick}
              variantFilterId={variantFilterId}
            />
          ))
        ) : !isLoading ? (
          <p className="text-[10px] text-slate-500 italic">
            Chưa có rack trong zone này.
          </p>
        ) : null}
      </div>
    </div>
  );
};

const WarehouseMap = () => {
  const { isManager } = useRoleGuard();
  const warehouseBasePath = isManager() ? "/manager/warehouses" : "/admin/warehouses";
  const putawayBasePath = isManager() ? "/manager/putaway" : "/admin/putaway";
  const { id } = useParams<{ id: string }>();
  const warehouseId = Number(id);
  const navigate = useNavigate();

  const { data: warehouse, isLoading: isWarehouseLoading } =
    useGetWarehouseQuery(warehouseId, {
      skip: Number.isNaN(warehouseId),
    });

  const { data: zones } = useGetZonesQuery(warehouseId, {
    skip: Number.isNaN(warehouseId),
  });

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<number | null>(null);
  const [detailSlot, setDetailSlot] = useState<SlotItem | null>(null);
  const [selectedUnassignedBoxQr, setSelectedUnassignedBoxQr] = useState<string>("");
  const [selectedVariantFilterId, setSelectedVariantFilterId] = useState<number | null>(null);
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);
  const [disposeTab, setDisposeTab] = useState<"expired" | "history">("expired");
  const [selectedDisposeBoxIds, setSelectedDisposeBoxIds] = useState<number[]>(
    [],
  );
  const [disposeFromDate, setDisposeFromDate] = useState("");
  const [disposeToDate, setDisposeToDate] = useState("");
  const [disposeCreatedBy, setDisposeCreatedBy] = useState("");

  const {
    data: unassignedBoxes = [],
    isFetching: isFetchingUnassignedBoxes,
  } = useGetUnassignedBoxesByWarehouseQuery(warehouseId, {
    skip: Number.isNaN(warehouseId),
  });
  const {
    data: expiredBoxes = [],
    isFetching: isFetchingExpiredBoxes,
    refetch: refetchExpiredBoxes,
  } = useGetExpiredBoxesByWarehouseQuery(warehouseId, {
    skip: Number.isNaN(warehouseId),
  });
  const [disposeExpiredBoxes, disposingExpiredState] =
    useDisposeExpiredBoxesMutation();
  const [syncSlotCapacitiesByWarehouse, syncCapacitiesState] =
    useSyncSlotCapacitiesByWarehouseMutation();
  const { data: disposeHistory = [], isFetching: isFetchingDisposeHistory } =
    useGetDisposeHistoryByWarehouseQuery(
      {
        warehouseId,
        fromDate: disposeFromDate || undefined,
        toDate: disposeToDate || undefined,
        createdBy: disposeCreatedBy.trim() || undefined,
      },
      { skip: Number.isNaN(warehouseId) || !isDisposeModalOpen || disposeTab !== "history" },
    );
  const { data: racks } = useGetRacksQuery(selectedZoneId ?? 0, {
    skip: !selectedZoneId,
  });

  const { data: slots, isLoading: isSlotsLoading } = useGetSlotsQuery(
    selectedRackId ?? 0,
    {
      skip: !selectedRackId,
    }
  );

  useEffect(() => {
    if (!selectedZoneId && zones && zones.length > 0) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

  useEffect(() => {
    if (!selectedRackId && racks && racks.length > 0) {
      setSelectedRackId(racks[0].id);
    }
  }, [racks, selectedRackId]);

  const legend = [
    { label: "Trống", className: "bg-slate-200 border-slate-300" },
    { label: "< 70% tải", className: "bg-emerald-500 text-white" },
    { label: "70–90% tải", className: "bg-yellow-400 text-slate-900" },
    { label: "> 90% tải", className: "bg-red-500 text-white" },
  ];

  const getSlotStyle = (slot: SlotItem) => {
    if (!slot.capacity || slot.capacity <= 0 || slot.currentCapacity <= 0) {
      return getUsageStyleFromRatio(0);
    }

    const ratio = slot.currentCapacity / slot.capacity;
    return getUsageStyleFromRatio(ratio);
  };

  const selectedZoneName = useMemo(() => {
    if (!zones || !selectedZoneId) return "";
    return zones.find((z) => z.id === selectedZoneId)?.name ?? "";
  }, [zones, selectedZoneId]);

  const selectedRackName = useMemo(() => {
    if (!racks || !selectedRackId) return "";
    return racks.find((r) => r.id === selectedRackId)?.name ?? "";
  }, [racks, selectedRackId]);

  const variantOptionsInRack = useMemo(() => {
    if (!slots?.length) return [];
    const map = new Map<number, { id: number; label: string }>();
    for (const s of slots) {
      if (!s.productVariantId || s.productVariantId <= 0) continue;
      if (map.has(s.productVariantId)) continue;
      const label = s.productName
        ? `${s.productName}${s.productVariantName ? ` · ${s.productVariantName}` : ""}`
        : s.productVariantName || `Variant #${s.productVariantId}`;
      map.set(s.productVariantId, { id: s.productVariantId, label });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "vi"),
    );
  }, [slots]);

  useEffect(() => {
    if (!selectedVariantFilterId) return;
    const stillExists = variantOptionsInRack.some(
      (v) => v.id === selectedVariantFilterId,
    );
    if (!stillExists) {
      setSelectedVariantFilterId(null);
    }
  }, [variantOptionsInRack, selectedVariantFilterId]);

  const filteredUnassignedBoxes = useMemo(() => {
    const cleanBoxes = unassignedBoxes.filter(
      (b) =>
        Number(b.weight ?? 0) > 0 &&
        (b.status ?? "").toLowerCase() === "stored" &&
        (!b.expiryDate || new Date(b.expiryDate).getTime() > Date.now()),
    );

    if (!selectedVariantFilterId) return cleanBoxes;
    return cleanBoxes.filter((b) => b.productVariantId === selectedVariantFilterId);
  }, [unassignedBoxes, selectedVariantFilterId]);

  const handleSyncSlotCapacities = async () => {
    if (Number.isNaN(warehouseId)) return;
    try {
      const res = await syncSlotCapacitiesByWarehouse(warehouseId).unwrap();
      toast.success(
        `${res.message}. Đã đồng bộ ${res.affectedSlots} slot.`,
      );
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Đồng bộ sức chứa thất bại.";
      toast.error(msg);
    }
  };

  const expiredBoxesInWarehouse = useMemo(() => {
    return [...expiredBoxes].sort((a, b) => {
      const ea = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      const eb = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      return ea - eb;
    });
  }, [expiredBoxes]);

  useEffect(() => {
    if (!expiredBoxesInWarehouse.length) {
      setSelectedDisposeBoxIds([]);
      return;
    }
    const idSet = new Set(expiredBoxesInWarehouse.map((b) => b.id));
    setSelectedDisposeBoxIds((prev) => prev.filter((id) => idSet.has(id)));
  }, [expiredBoxesInWarehouse]);

  const toggleSelectDisposeBox = (boxId: number) => {
    setSelectedDisposeBoxIds((prev) =>
      prev.includes(boxId) ? prev.filter((id) => id !== boxId) : [...prev, boxId],
    );
  };

  const handleDisposeExpiredBoxes = async () => {
    if (!selectedDisposeBoxIds.length) {
      toast.error("Chọn ít nhất 1 box để tiêu hủy.");
      return;
    }

    try {
      const result = await disposeExpiredBoxes({
        boxIds: selectedDisposeBoxIds,
      }).unwrap();
      toast.success(
        `${result.message}. Đã xử lý ${result.disposedCount}/${result.requestedCount} box.`,
      );
      setSelectedDisposeBoxIds([]);
      await refetchExpiredBoxes();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Tiêu hủy box thất bại.";
      toast.error(msg);
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
      {detailSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setDetailSlot(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="slot-modal-title"
        >
          <div
            className="max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <SlotDetailPanel
              slot={detailSlot}
              onClose={() => setDetailSlot(null)}
              onTransferBox={(box) => {
                const qr = box.qrCode || "";
                if (!qr) {
                  navigate(putawayBasePath);
                  toast(
                    "Box chưa có mã QR trên hệ thống. Tại trang xếp hàng, hãy chụp/chọn ảnh có QR box hoặc nhập mã.",
                    { icon: "📷", duration: 4500 },
                  );
                  return;
                }
                navigate(`${putawayBasePath}?boxQr=${encodeURIComponent(qr)}`);
              }}
            />
          </div>
        </div>
      )}
      {isDisposeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setIsDisposeModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Danh sách box tiêu hủy (hàng hết hạn)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kho #{warehouseId} · {expiredBoxesInWarehouse.length} box có thể tiêu hủy
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDisposeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setDisposeTab("expired")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    disposeTab === "expired"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Box hết hạn
                </button>
                <button
                  type="button"
                  onClick={() => setDisposeTab("history")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    disposeTab === "history"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Lịch sử tiêu hủy
                </button>
              </div>

              {disposeTab === "expired" ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDisposeBoxIds(expiredBoxesInWarehouse.map((b) => b.id))
                        }
                        disabled={!expiredBoxesInWarehouse.length}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Chọn tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDisposeBoxIds([])}
                        disabled={!selectedDisposeBoxIds.length}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void refetchExpiredBoxes()}
                        disabled={isFetchingExpiredBoxes}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {isFetchingExpiredBoxes ? "Đang tải..." : "Làm mới"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDisposeExpiredBoxes()}
                        disabled={
                          disposingExpiredState.isLoading || !selectedDisposeBoxIds.length
                        }
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        {disposingExpiredState.isLoading
                          ? "Đang tiêu hủy..."
                          : `Tiêu hủy đã chọn (${selectedDisposeBoxIds.length})`}
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-100 bg-slate-50">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left w-[40px]">#</th>
                          <th className="px-3 py-2 text-left">Box</th>
                          <th className="px-3 py-2 text-left">Lot</th>
                          <th className="px-3 py-2 text-left">HSD</th>
                          <th className="px-3 py-2 text-left">Slot</th>
                          <th className="px-3 py-2 text-right">Kg</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {expiredBoxesInWarehouse.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                              Không có box hết hạn cần tiêu hủy.
                            </td>
                          </tr>
                        ) : (
                          expiredBoxesInWarehouse.map((b) => {
                            const checked = selectedDisposeBoxIds.includes(b.id);
                            return (
                              <tr key={b.id} className="border-t border-slate-100 hover:bg-white">
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleSelectDisposeBox(b.id)}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <p className="font-mono text-[10px]">{b.boxCode}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {b.productName || "—"}
                                    {b.productVariantName ? ` · ${b.productVariantName}` : ""}
                                  </p>
                                </td>
                                <td className="px-3 py-2">{b.lotCode || "—"}</td>
                                <td className="px-3 py-2">
                                  {b.expiryDate
                                    ? new Date(b.expiryDate).toLocaleDateString("vi-VN")
                                    : "—"}
                                </td>
                                <td className="px-3 py-2">{b.slotCode || "Chưa xếp"}</td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  {b.weight}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="date"
                      value={disposeFromDate}
                      onChange={(e) => setDisposeFromDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                    <input
                      type="date"
                      value={disposeToDate}
                      onChange={(e) => setDisposeToDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      value={disposeCreatedBy}
                      onChange={(e) => setDisposeCreatedBy(e.target.value)}
                      placeholder="Lọc theo người thao tác"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs md:col-span-2"
                    />
                  </div>

                  <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-100 bg-slate-50">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left">Thời gian</th>
                          <th className="px-3 py-2 text-left">Box / Lot</th>
                          <th className="px-3 py-2 text-left">Sản phẩm</th>
                          <th className="px-3 py-2 text-left">Người thao tác</th>
                          <th className="px-3 py-2 text-right">Kg tiêu hủy</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {isFetchingDisposeHistory ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                              Đang tải lịch sử...
                            </td>
                          </tr>
                        ) : disposeHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                              Chưa có lịch sử tiêu hủy theo bộ lọc.
                            </td>
                          </tr>
                        ) : (
                          disposeHistory.map((h) => (
                            <tr key={h.transactionId} className="border-t border-slate-100 hover:bg-white">
                              <td className="px-3 py-2">
                                {h.createdAt
                                  ? new Date(h.createdAt).toLocaleString("vi-VN")
                                  : "—"}
                              </td>
                              <td className="px-3 py-2">
                                <p className="font-mono text-[10px]">{h.boxCode || `#${h.boxId}`}</p>
                                <p className="text-[10px] text-slate-500">{h.lotCode || "—"}</p>
                              </td>
                              <td className="px-3 py-2">
                                {h.productName || "—"}
                                {h.productVariantName ? ` · ${h.productVariantName}` : ""}
                              </td>
                              <td className="px-3 py-2">{h.createdByName || h.createdBy}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{h.quantity}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="bg-white/95 rounded-[18px] p-6 shadow-sm flex flex-col gap-4 border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Sơ đồ kho
            </h1>
            {warehouse && (
              <p className="text-xs text-slate-500 mt-1">
                {warehouse.name} — {warehouse.location}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsDisposeModalOpen(true)}
              className="inline-flex items-center rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1 font-medium text-rose-700 hover:bg-rose-100"
            >
              List box tiêu hủy
            </button>
            <Link
              to={`${warehouseBasePath}/${warehouseId}/config`}
              className="inline-flex items-center rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Cấu hình kho
            </Link>
            <Link
              to={warehouseBasePath}
              className="text-emerald-600 hover:underline"
            >
              ← Quay lại danh sách kho
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Sản Phẩm biến thể
              </span>
              <select
                value={selectedVariantFilterId ?? ""}
                onChange={(e) =>
                  setSelectedVariantFilterId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="w-full min-w-[220px] max-w-[260px] rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!variantOptionsInRack.length}
              >
                <option value="">
                  {!variantOptionsInRack.length
                    ? "Rack chưa có sản phẩm"
                    : "Chọn Sản phẩm biến thể để highlight slot"}
                </option>
                {variantOptionsInRack.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 md:pl-2">
              Ô màu xanh dương = slot đang chứa “Sản phẩm biến thể” đã chọn.
            </p>
          </div>

        </div>

        {zones && zones.length > 0 && (
          <div className="mt-1">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              Tổng quan cấu trúc kho
              <span className="text-[11px] font-normal text-slate-500">
                Zone → Rack → Slot
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {zones.map((z) => (
                <ZoneOverview
                  key={z.id}
                  zoneId={z.id}
                  name={z.name}
                  onSlotClick={(slot) => setDetailSlot(slot)}
                  variantFilterId={selectedVariantFilterId}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4 pt-3 border-t border-dashed border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">
                Zone:
              </span>
              <select
                value={selectedZoneId ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedZoneId(value ? Number(value) : null);
                  setSelectedRackId(null);
                }}
                className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Chọn zone</option>
                {zones?.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">
                Rack:
              </span>
              <select
                value={selectedRackId ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedRackId(value ? Number(value) : null);
                }}
                className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Chọn rack</option>
                {racks?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">
                Box chưa xếp:
              </span>
              <select
                value={selectedUnassignedBoxQr}
                onChange={(e) => {
                  const qr = e.target.value;
                  setSelectedUnassignedBoxQr(qr);
                  if (qr) {
                    navigate(`${putawayBasePath}?boxQr=${encodeURIComponent(qr)}`);
                  }
                }}
                className="min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                disabled={
                  isFetchingUnassignedBoxes || !filteredUnassignedBoxes.length
                }
              >
                <option value="">
                  {!filteredUnassignedBoxes.length
                    ? isFetchingUnassignedBoxes
                      ? "Đang tải..."
                      : "Không có box chưa xếp theo bộ lọc"
                    : "Chọn box chưa xếp"}
                </option>
                {filteredUnassignedBoxes.map((b) => (
                  <option key={b.id} value={b.qrCode ?? ""} disabled={!b.qrCode}>
                    #{b.id} · {b.boxCode}
                    {b.productVariantName ? ` · ${b.productVariantName}` : ""}
                    {!b.qrCode ? " (chưa có QR)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setIsDisposeModalOpen(true)}
              className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              title="Mở danh sách box hết hạn để tiêu hủy"
            >
              Tiêu hủy hàng hết hạn
            </button>
            <button
              type="button"
              onClick={() => void handleSyncSlotCapacities()}
              disabled={syncCapacitiesState.isLoading}
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
              title="Đồng bộ CurrentCapacity của slot theo tổng box thực tế"
            >
              {syncCapacitiesState.isLoading
                ? "Đang đồng bộ..."
                : "Đồng bộ sức chứa slot"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] justify-end">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className={`h-3 w-5 rounded-sm border ${item.className}`}
                />
                <span className="text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3">
          {(isWarehouseLoading || (!slots && isSlotsLoading)) && (
            <p className="text-xs text-slate-500">Đang tải sơ đồ kho...</p>
          )}

          {!selectedZoneId && (
            <p className="text-xs text-slate-500">
              Chưa có zone nào. Hãy vào phần cấu hình để thêm zone.
            </p>
          )}

          {selectedZoneId && !selectedRackId && (
            <p className="text-xs text-slate-500">
              Chọn rack trong zone "{selectedZoneName}" để xem sơ đồ slot.
            </p>
          )}

          {selectedRackId && slots && slots.length === 0 && (
            <p className="text-xs text-slate-500">
              Chưa có slot nào trong rack "{selectedRackName}".
            </p>
          )}

          {selectedRackId && slots && slots.length > 0 && (
            <div className="mt-3 border border-slate-200 rounded-2xl p-4 bg-slate-50/60">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Zone: {selectedZoneName || "—"} • Rack:{" "}
                    {selectedRackName || "—"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mỗi ô là một slot, màu sắc thể hiện mức độ sử dụng tải.
                  </p>
                  {selectedVariantFilterId ? (
                    <p className="text-[11px] text-blue-600 mt-0.5">
                      Ô màu xanh dương là slot đang chứa ProductVariant đã chọn.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {slots.map((slot) => {
                  const style = getSlotStyle(slot);
                  const ratio =
                    slot.capacity > 0
                      ? (slot.currentCapacity / slot.capacity) * 100
                      : 0;
                  const isSelected = detailSlot?.id === slot.id;
                  const isVariantMatched =
                    !!selectedVariantFilterId &&
                    Number(slot.productVariantId ?? 0) ===
                      Number(selectedVariantFilterId);

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() =>
                        setDetailSlot((prev) =>
                          prev?.id === slot.id ? null : slot
                        )
                      }
                      className={`relative flex flex-col items-center justify-center rounded-lg border text-[10px] font-medium shadow-sm h-14 cursor-pointer transition ring-2 ring-transparent hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${style} ${isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""} ${isVariantMatched ? "bg-blue-600/95 text-white" : ""}`}
                      title="Bấm xem chi tiết slot"
                    >
                      <span className="truncate max-w-[80%]">{slot.code}</span>
                      <span className="mt-0.5 text-[9px] opacity-90">
                        {slot.currentCapacity}/{slot.capacity} (
                        {ratio.toFixed(0)}%)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseMap;

