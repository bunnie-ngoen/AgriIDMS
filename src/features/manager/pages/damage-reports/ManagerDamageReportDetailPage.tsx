import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useApproveDamageReportMutation,
  useGetDamageReportByIdQuery,
  useRejectDamageReportMutation,
  outcomeToApiValue,
} from "../../../damage-report/api/damage-report.api";
import { DAMAGE_FORM_LABEL, DAMAGE_REPORT_PAGE } from "../../../damage-report/constants/damage-report-ui.constants";
import { DamageReportDetailView } from "../../../damage-report/components/DamageReportDetailView";
export default function ManagerDamageReportDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const skip = !Number.isFinite(numericId) || numericId <= 0;

  const { data: report, isLoading, isError, refetch } = useGetDamageReportByIdQuery(numericId, {
    skip,
  });
  const [approve, { isLoading: approving }] = useApproveDamageReportMutation();
  const [reject, { isLoading: rejecting }] = useRejectDamageReportMutation();

  const [rejectNote, setRejectNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (skip || isError) {
    return (
      <div className="p-6">
        <p className="text-rose-600">Không tìm thấy phiếu.</p>
        <Link to=".." relative="path" className="mt-2 inline-block text-emerald-700 hover:underline">
          ← Danh sách
        </Link>
      </div>
    );
  }

  if (isLoading || !report) {
    return <div className="p-6 text-slate-600">Đang tải…</div>;
  }

  const normalizedStatus = String(report.status ?? "").trim().toLowerCase();
  const isPending =
    normalizedStatus === "pending" ||
    normalizedStatus === "chờ duyệt" ||
    normalizedStatus === "cho duyet";
  const req = report.requestedProcessingOutcome;

  const runApprove = async () => {
    if (!req) {
      toast.error("Phiếu thiếu loại hỏng đề xuất (dữ liệu cũ). Không duyệt được.");
      return;
    }
    try {
      await approve({
        id: report.id,
        body: {
          outcome: outcomeToApiValue(req),
          damagedWeightKg:
            req === "PartialDamaged" ? report.requestedDamagedWeightKg ?? null : null,
          reviewNote: null,
        },
      }).unwrap();
      toast.success("Đã duyệt xử lý hỏng.");
      setConfirmOpen(false);
      await refetch();
      navigate("..", { relative: "path" });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String(
              (err as { data?: { message?: string; detail?: string; error?: string } }).data
                ?.message ??
                (err as { data?: { detail?: string } }).data?.detail ??
                (err as { data?: { error?: string } }).data?.error ??
                "",
            )
          : "";
      toast.error(msg || "Duyệt thất bại.");
    }
  };

  const runReject = async () => {
    const note = rejectNote.trim();
    if (!note) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    try {
      await reject({ id: report.id, reviewNote: note }).unwrap();
      toast.success("Đã từ chối phiếu.");
      navigate("..", { relative: "path" });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String(
              (err as { data?: { message?: string; detail?: string; error?: string } }).data
                ?.message ??
                (err as { data?: { detail?: string } }).data?.detail ??
                (err as { data?: { error?: string } }).data?.error ??
                "",
            )
          : "";
      toast.error(msg || "Từ chối thất bại.");
    }
  };

  const confirmText =
    req === "PartialDamaged"
      ? DAMAGE_FORM_LABEL.confirmApprovePartial
      : DAMAGE_FORM_LABEL.confirmApproveComplete;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <Link to=".." relative="path" className="text-sm font-semibold text-emerald-700 hover:underline">
        ← Danh sách duyệt phiếu hỏng
      </Link>
      <h1 className="text-xl font-semibold text-slate-900">{DAMAGE_REPORT_PAGE.managerDetailTitle}</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <DamageReportDetailView report={report}>
          {isPending ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={approving || rejecting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {DAMAGE_FORM_LABEL.approve}
                </button>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                <label className="text-xs font-semibold text-rose-900">{DAMAGE_FORM_LABEL.rejectReason} *</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  placeholder="Bắt buộc khi từ chối…"
                />
                <button
                  type="button"
                  onClick={() => void runReject()}
                  disabled={approving || rejecting}
                  className="mt-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {DAMAGE_FORM_LABEL.reject}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Phiếu đã được duyệt hoặc từ chối.</p>
          )}
        </DamageReportDetailView>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Xác nhận duyệt</h3>
            <p className="mt-2 text-sm text-slate-600">{confirmText}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void runApprove()}
                disabled={approving}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {approving ? "Đang gửi…" : "Xác nhận duyệt"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
