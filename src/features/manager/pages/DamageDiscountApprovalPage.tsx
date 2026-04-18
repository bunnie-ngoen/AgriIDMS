import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import {
  useApproveDamageReportMutation,
  useGetDamageReportsQuery,
  useRejectDamageReportMutation,
} from "../api/damage-report.api";
import {
  useGetProductVariantDiscountOverridesQuery,
  useUpdateProductVariantDiscountOverridesMutation,
} from "../api/variant-discount-override.api";

export default function DamageDiscountApprovalPage() {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [reviewNoteById, setReviewNoteById] = useState<Record<string, string>>({});
  const [fromDate, setFromDate] = useState<string>(sevenDaysAgo);
  const [toDate, setToDate] = useState<string>(today);
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">(
    "All",
  );
  const [modalReportId, setModalReportId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const { data: reports = [], refetch: refetchReports } = useGetDamageReportsQuery();
  const [approveDamageReport, { isLoading: isApprovingReport }] = useApproveDamageReportMutation();
  const [rejectDamageReport, { isLoading: isRejectingReport }] = useRejectDamageReportMutation();
  const { data: existingOverrides = [] } = useGetProductVariantDiscountOverridesQuery();
  const [saveOverrides, { isLoading: isSavingOverride }] =
    useUpdateProductVariantDiscountOverridesMutation();

  const filteredReports = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;
    return reports.filter((r) => {
      const d = new Date(r.reportedAt);
      if (Number.isNaN(d.getTime())) return true;
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      return true;
    });
  }, [reports, fromDate, toDate, statusFilter]);

  const reviewed = filteredReports.filter((r) => r.status !== "Pending");
  const isSaving = isSavingOverride || isApprovingReport || isRejectingReport;
  const selectedReport = filteredReports.find((r) => r.id === modalReportId) ?? null;

  const handleReject = async (id: string) => {
    try {
      await rejectDamageReport({
        id,
        reviewNote: reviewNoteById[id]?.trim() || "Không đạt điều kiện áp giảm giá.",
      }).unwrap();
      await refetchReports();
      toast.success("Đã từ chối phiếu.");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Không từ chối được phiếu.");
    }
  };

  const handleApprove = async (id: string) => {
    const report = reports.find((x) => x.id === id);
    if (!report) return;
    if (!report.productVariantId || report.productVariantId <= 0) {
      toast.error("Phiếu không có productVariantId để áp giảm giá.");
      return;
    }

    const nextPriority =
      existingOverrides.reduce((m, o) => Math.max(m, o.priority ?? 0), 0) + 1;

    const payload = existingOverrides.map((o) => ({
      productVariantId: o.productVariantId,
      lotId: o.lotId ?? null,
      priority: o.priority ?? 0,
      overrideNearExpiryDiscountPercent: o.overrideNearExpiryDiscountPercent,
      reason: o.reason ?? null,
      isActive: o.isActive,
      startAtUtc: o.startAtUtc ?? null,
      endAtUtc: o.endAtUtc ?? null,
    }));

    payload.push({
      productVariantId: report.productVariantId,
      lotId: report.lotId ?? null,
      priority: nextPriority,
      overrideNearExpiryDiscountPercent: report.suggestedDiscountPercent,
      reason: `Hàng hỏng (${report.targetType} ${report.targetCode}) - ${report.damageReason}`,
      isActive: true,
      startAtUtc: new Date().toISOString(),
      endAtUtc: null,
    });

    try {
      await saveOverrides(payload).unwrap();
      await approveDamageReport({
        id,
        discountPercent: report.suggestedDiscountPercent,
        reviewNote: reviewNoteById[id]?.trim() || null,
      }).unwrap();
      await refetchReports();
      toast.success("Đã duyệt phiếu và áp giảm giá.");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Không áp được giảm giá.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Duyệt phiếu hỏng và áp giảm giá</h2>
        <p className="mt-1 text-sm text-slate-600">
          Phiếu do nhân viên kho gửi sẽ được duyệt tại đây. Khi duyệt, hệ thống tự tạo cấu hình ghi
          đè mức giảm giá theo mặt hàng/lô.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">
              Danh sách yêu cầu ({filteredReports.length})
            </div>
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ShieldAlert size={14} />
              Lịch sử xử lý ({reviewed.length})
            </button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-[11px] text-slate-500">Từ ngày</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500">Đến ngày</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "All" | "Pending" | "Approved" | "Rejected")
                }
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
              >
                <option value="All">Tất cả</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Approved">Đã duyệt</option>
                <option value="Rejected">Đã từ chối</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Đối tượng</th>
                <th className="px-3 py-2 text-left">Người gửi</th>
                <th className="px-3 py-2 text-left">Ngày gửi</th>
                <th className="px-3 py-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500" colSpan={4}>
                    Không có yêu cầu trong khoảng ngày đã chọn.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    onClick={() => setModalReportId(r.id)}
                  >
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {r.targetType === "Box" ? "Thùng" : "Lô"} {r.targetCode}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{r.reportedByUsername}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {new Date(r.reportedAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          r.status === "Pending"
                            ? "bg-amber-100 text-amber-700"
                            : r.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {r.status === "Pending"
                          ? "Chờ duyệt"
                          : r.status === "Approved"
                            ? "Đã duyệt"
                            : "Đã từ chối"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReport ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="text-base font-semibold text-slate-900">
                Chi tiết phiếu{" "}
                {selectedReport.targetType === "Box" ? "Thùng" : "Lô"} {selectedReport.targetCode}
              </div>
              <button
                type="button"
                onClick={() => setModalReportId(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>

            <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-900">
                  {selectedReport.targetType === "Box" ? "Thùng" : "Lô"} {selectedReport.targetCode}
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    selectedReport.status === "Pending"
                      ? "bg-amber-100 text-amber-700"
                      : selectedReport.status === "Approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {selectedReport.status === "Pending"
                    ? "Chờ duyệt"
                    : selectedReport.status === "Approved"
                      ? "Đã duyệt"
                      : "Đã từ chối"}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                SP: {selectedReport.productName ?? "—"} · Lý do: {selectedReport.damageReason} · Hỏng:{" "}
                {selectedReport.damagePercent}% · Đề xuất giảm:{" "}
                {selectedReport.suggestedDiscountPercent}%
              </div>
              <div className="text-xs text-slate-600">
                Người gửi: {selectedReport.reportedByUsername} ·{" "}
                {new Date(selectedReport.reportedAt).toLocaleString("vi-VN")}
              </div>
              {selectedReport.evidenceImageUrl ? (
                <a
                  href={selectedReport.evidenceImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block"
                >
                  <img
                    src={selectedReport.evidenceImageUrl}
                    alt={`Minh chứng ${selectedReport.targetCode}`}
                    className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                  />
                </a>
              ) : (
                <div className="text-xs text-rose-600">Phiếu chưa có ảnh minh chứng.</div>
              )}

              {selectedReport.status === "Pending" ? (
                <>
                  <textarea
                    rows={2}
                    value={reviewNoteById[selectedReport.id] ?? ""}
                    onChange={(e) =>
                      setReviewNoteById((prev) => ({ ...prev, [selectedReport.id]: e.target.value }))
                    }
                    placeholder="Ghi chú duyệt/từ chối (tuỳ chọn)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void handleReject(selectedReport.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      <XCircle size={14} />
                      Từ chối
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void handleApprove(selectedReport.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle2 size={14} />
                      {isSaving ? "Đang áp..." : "Duyệt & áp giảm giá"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-600">
                  Người xử lý: {selectedReport.reviewedByUsername ?? "—"} ·{" "}
                  {selectedReport.reviewedAt
                    ? new Date(selectedReport.reviewedAt).toLocaleString("vi-VN")
                    : "—"}
                  <br />
                  Ghi chú: {selectedReport.reviewNote ?? "—"} · Mức giảm áp:{" "}
                  {selectedReport.appliedDiscountPercent ?? 0}%
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isHistoryModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                <ShieldAlert size={16} />
                Lịch sử xử lý ({reviewed.length})
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              {reviewed.length === 0 ? (
                <div className="px-3 py-4 text-sm text-slate-500">Chưa có lịch sử.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Đối tượng</th>
                      <th className="px-3 py-2 text-left">Người xử lý</th>
                      <th className="px-3 py-2 text-left">Ngày xử lý</th>
                      <th className="px-3 py-2 text-left">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewed.map((r) => (
                      <tr
                        key={r.id}
                        className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                        onClick={() => {
                          setIsHistoryModalOpen(false);
                          setModalReportId(r.id);
                        }}
                      >
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          {r.targetType === "Box" ? "Thùng" : "Lô"} {r.targetCode}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{r.reviewedByUsername ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString("vi-VN") : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              r.status === "Approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {r.status === "Approved" ? "Đã duyệt" : "Đã từ chối"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
