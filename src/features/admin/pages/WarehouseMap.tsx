import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useGetWarehouseQuery,
  useGetZonesQuery,
  useGetRacksQuery,
  useGetSlotsQuery,
} from "../api/create-user.api";
import type { SlotItem } from "../types/warehouse.type";

/** Panel chi tiết slot: thông tin + slot chứa gì (hiện tại chỉ có capacity, có thể bổ sung API sản phẩm sau) */
const SlotDetailPanel = ({
  slot,
  onClose,
  className = "",
}: {
  slot: SlotItem;
  onClose: () => void;
  className?: string;
}) => {
  const ratio =
    slot.capacity > 0
      ? Math.min(1, (slot.currentCapacity || 0) / slot.capacity) * 100
      : 0;
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-left ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
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
          <div className="flex justify-between items-center">
            <dt className="text-slate-500">QR</dt>
            <dd className="font-mono text-[10px] text-slate-600 truncate max-w-[120px]">
              {slot.qrCode}
            </dd>
          </div>
        )}
      </dl>
      <div className="mt-2 pt-2 border-t border-slate-100">
        <p className="text-[10px] font-medium text-slate-600 mb-0.5">
          Slot đang chứa
        </p>
        <p className="text-[11px] text-slate-700">
          {slot.currentCapacity} kg / {slot.capacity} kg ({ratio.toFixed(0)}%)
          theo tải. Chi tiết sản phẩm trong slot sẽ hiển thị khi có dữ liệu.
        </p>
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
};

const RackOverview = ({ rackId, name, onSlotClick }: RackOverviewProps) => {
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
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSlotClick?.(s)}
                className={`inline-flex flex-col items-center justify-center rounded-lg border min-w-[52px] py-1.5 px-1.5 text-[10px] font-medium cursor-pointer transition ring-2 ring-transparent hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${cellStyle}`}
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
};

const ZoneOverview = ({ zoneId, name, onSlotClick }: ZoneOverviewProps) => {
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
  const { id } = useParams<{ id: string }>();
  const warehouseId = Number(id);

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
            />
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
            <Link
              to={`/admin/warehouses/${warehouseId}/config`}
              className="inline-flex items-center rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Cấu hình kho
            </Link>
            <Link
              to="/admin/warehouses"
              className="text-emerald-600 hover:underline"
            >
              ← Quay lại danh sách kho
            </Link>
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

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() =>
                        setDetailSlot((prev) =>
                          prev?.id === slot.id ? null : slot
                        )
                      }
                      className={`relative flex flex-col items-center justify-center rounded-lg border text-[10px] font-medium shadow-sm h-14 cursor-pointer transition ring-2 ring-transparent hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${style} ${isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""}`}
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

