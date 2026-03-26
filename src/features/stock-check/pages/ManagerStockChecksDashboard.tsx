import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2, XCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import { AUTH_ROLE } from "../../auth/constants/auth.constants";
import {
  useApproveStockCheckMutation,
  useGetManagerStockChecksDashboardQuery,
  useRejectStockCheckMutation,
} from "../api/stock-check.api";
import type { StockCheckDashboardItem } from "../types/stock-check.type";
import {
  toVietnameseStockCheckStatus,
  toVietnameseStockCheckType,
} from "../utils/stock-check-labels";

function formatDateTime(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleString("vi-VN");
}

export default function ManagerStockChecksDashboard() {
  const navigate = useNavigate();
  const auth = useAuth();
  const roles = auth.user?.roles ?? [];
  const isManager = roles.includes(AUTH_ROLE.MANAGER) || roles.includes(AUTH_ROLE.ADMIN);

  const { data, isLoading, refetch } = useGetManagerStockChecksDashboardQuery();
  const [approveStockCheck, { isLoading: isApproving }] = useApproveStockCheckMutation();
  const [rejectStockCheck, { isLoading: isRejecting }] = useRejectStockCheckMutation();

  const handleApprove = async (id: number) => {
    try {
      await approveStockCheck(id).unwrap();
      toast.success("Đã duyệt phiếu kiểm kê");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Không thể duyệt");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectStockCheck(id).unwrap();
      toast.success("Đã từ chối phiếu kiểm kê");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Không thể từ chối");
    }
  };

  const renderItem = (it: StockCheckDashboardItem) => {
    const badgeTone =
      it.status === "Counted"
        ? "bg-violet-50 text-violet-700 border-violet-200"
        : it.status === "Approved"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

    return (
      <div key={it.stockCheckId} className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">#{it.stockCheckId}</div>
            <div className="text-xs text-slate-600 truncate">
              {toVietnameseStockCheckType(it.checkType)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Snapshot: {formatDateTime(it.snapshotAt)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Đã đếm: {it.countedLines}/{it.totalLines}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            <div className={`text-[11px] px-2 py-1 rounded-lg border ${badgeTone}`}>
              {toVietnameseStockCheckStatus(it.status)}
            </div>
            {it.status === "Counted" && isManager ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isApproving}
                  onClick={() => void handleApprove(it.stockCheckId)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Duyệt
                </button>
                <button
                  type="button"
                  disabled={isRejecting}
                  onClick={() => void handleReject(it.stockCheckId)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {isRejecting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Từ chối
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() =>
                navigate(`/manager/stock-checks/${it.stockCheckId}`)
              }
              className="inline-flex items-center rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center text-slate-500 py-10">Đang tải...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Kiểm kê (Manager)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Chỉ duyệt khi phiếu ở trạng thái Counted.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Chờ duyệt</div>
          <div className="text-xs text-slate-500 mt-1">{data?.pendingApprovalChecks?.length ?? 0} phiếu</div>
          <div className="mt-3 space-y-3">
            {(data?.pendingApprovalChecks ?? []).length === 0 ? (
              <div className="text-sm text-slate-500 py-6 text-center">Trống</div>
            ) : (
              data!.pendingApprovalChecks.map(renderItem)
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Đã duyệt</div>
          <div className="text-xs text-slate-500 mt-1">{data?.approvedChecks?.length ?? 0} phiếu</div>
          <div className="mt-3 space-y-3">
            {(data?.approvedChecks ?? []).length === 0 ? (
              <div className="text-sm text-slate-500 py-6 text-center">Trống</div>
            ) : (
              data!.approvedChecks.map(renderItem)
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Từ chối</div>
          <div className="text-xs text-slate-500 mt-1">{data?.rejectedChecks?.length ?? 0} phiếu</div>
          <div className="mt-3 space-y-3">
            {(data?.rejectedChecks ?? []).length === 0 ? (
              <div className="text-sm text-slate-500 py-6 text-center">Trống</div>
            ) : (
              data!.rejectedChecks.map(renderItem)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

