import toast from "react-hot-toast";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { AUTH_ROLE } from "../../auth/constants/auth.constants";
import {
  useGetWarehouseStockChecksDashboardQuery,
  useStartStockCheckMutation,
} from "../api/stock-check.api";
import type { StockCheckDashboardItem } from "../types/stock-check.type";
import { ClipboardList, Loader2, Play, ShieldCheck } from "lucide-react";
import {
  toVietnameseStockCheckStatus,
  toVietnameseStockCheckType,
} from "../utils/stock-check-labels";

function formatDateTime(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleString("vi-VN");
}

export default function WarehouseStockChecksDashboard() {
  const navigate = useNavigate();
  const auth = useAuth();

  const roles = auth.user?.roles ?? [];
  const isWarehouseStaff = roles.includes(AUTH_ROLE.WAREHOUSE_STAFF);

  const {
    data,
    isLoading,
    refetch,
    isFetching,
  } = useGetWarehouseStockChecksDashboardQuery();
  const [startStockCheck, { isLoading: isStarting }] =
    useStartStockCheckMutation();

  const allItems = useMemo(() => {
    const draft = data?.draftChecks ?? [];
    const inProgress = data?.inProgressChecks ?? [];
    const counted = data?.countedChecks ?? [];
    return { draft, inProgress, counted };
  }, [data]);
  const totalChecks =
    allItems.draft.length + allItems.inProgress.length + allItems.counted.length;

  const handleStart = async (id: number) => {
    try {
      await startStockCheck(id).unwrap();
      toast.success("Đã bắt đầu kiểm kê");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Không thể bắt đầu kiểm kê");
    }
  };

  const renderList = (title: string, items: StockCheckDashboardItem[], tone: string) => (
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="flex items-center gap-2">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <ClipboardList size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500">Tổng {items.length} phiếu</div>
        </div>
      </div>

      <div className="mt-4 max-h-[52vh] overflow-y-auto pr-1 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-7 text-center text-sm text-slate-500">
            Chưa có phiếu
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.stockCheckId}
              className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-3.5 shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-all hover:border-emerald-200 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">
                    #{it.stockCheckId}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    {toVietnameseStockCheckType(it.checkType)} ·{" "}
                    {toVietnameseStockCheckStatus(it.status)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">
                    Thời điểm chốt số liệu: {formatDateTime(it.snapshotAt)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Đã đếm: {it.countedLines}/{it.totalLines}
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end shrink-0">
                  {it.status === "Draft" && isWarehouseStaff ? (
                    <button
                      type="button"
                      onClick={() => void handleStart(it.stockCheckId)}
                      disabled={isStarting || isFetching}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {isStarting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      Bắt đầu
                    </button>
                  ) : null}

                  {it.status === "InProgress" ? (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/warehouse/stock-checks/${it.stockCheckId}`)
                      }
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                        isWarehouseStaff
                          ? "bg-sky-600 text-white hover:bg-sky-700"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {isWarehouseStaff ? "Nhập số đếm" : "Xem chi tiết"}
                    </button>
                  ) : null}

                  {it.status === "Counted" ? (
                    <div className="text-[11px] px-2 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200">
                      Chờ duyệt
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">
              Kiểm kê (Nhân viên kho)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Nháp: chuẩn bị · Đang đếm: nhập số đếm · Chờ duyệt: đợi quản lý xử lý
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Tổng phiếu</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{totalChecks}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Chờ bắt đầu</p>
          <p className="mt-1 text-xl font-semibold text-emerald-800">{allItems.draft.length}</p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-sky-700">Đang đếm</p>
          <p className="mt-1 text-xl font-semibold text-sky-800">{allItems.inProgress.length}</p>
        </div>
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-violet-700">Chờ duyệt</p>
          <p className="mt-1 text-xl font-semibold text-violet-800">{allItems.counted.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-slate-500">
          Đang tải...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {renderList(
            "Chờ bắt đầu",
            allItems.draft,
            "bg-emerald-50 text-emerald-700 border border-emerald-200"
          )}
          {renderList(
            "Đang nhập số đếm",
            allItems.inProgress,
            "bg-sky-50 text-sky-700 border border-sky-200"
          )}
          {renderList(
            "Đã chốt (chờ duyệt)",
            allItems.counted,
            "bg-violet-50 text-violet-700 border border-violet-200"
          )}
        </div>
      )}
    </div>
  );
}

