import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useGetDamageReportsQuery } from "../../../damage-report/api/damage-report.api";
import type { DamageReportStatus } from "../../../damage-report/types/damage-report.types";
import {
  DAMAGE_FORM_LABEL,
  DAMAGE_OUTCOME_LABEL,
  DAMAGE_REPORT_PAGE,
} from "../../../damage-report/constants/damage-report-ui.constants";
import { formatDamageReportCode } from "../../../damage-report/utils/damage-report-code";
import { DamageReportStatusBadge } from "../../../damage-report/components/DamageReportStatusBadge";
import { getDisplayDamagedKg } from "../../../damage-report/utils/damage-report-display";

type Tab = "Pending" | "Approved" | "Rejected";

export default function ManagerDamageReportListPage() {
  const [tab, setTab] = useState<Tab>("Pending");
  const [search, setSearch] = useState("");

  const { data: raw = [], isFetching } = useGetDamageReportsQuery({ status: tab });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((r) => {
      const hay = [
        formatDamageReportCode(r.id),
        r.targetCode,
        r.productName ?? "",
        r.lotCode ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [raw, search]);

  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      key={t}
      onClick={() => setTab(t)}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        tab === t ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{DAMAGE_REPORT_PAGE.managerListTitle}</h1>
        <p className="mt-1 text-sm text-slate-600">Duyệt hoặc từ chối phiếu báo hỏng do kho gửi.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabBtn("Pending", "Chờ duyệt")}
        {tabBtn("Approved", "Đã duyệt")}
        {tabBtn("Rejected", "Đã từ chối")}
      </div>

      <div className="max-w-md">
        <label className="block text-xs font-medium text-slate-600">Tìm kiếm</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={DAMAGE_FORM_LABEL.searchPlaceholder}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">{DAMAGE_FORM_LABEL.reportCode}</th>
              <th className="px-3 py-2">{DAMAGE_FORM_LABEL.boxCode}</th>
              <th className="px-3 py-2">{DAMAGE_FORM_LABEL.product}</th>
              <th className="px-3 py-2">{DAMAGE_FORM_LABEL.damageType}</th>
              <th className="px-3 py-2">{DAMAGE_FORM_LABEL.damagedQty}</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2">Người tạo</th>
              <th className="px-3 py-2">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {isFetching ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  Không có phiếu.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const type = r.requestedProcessingOutcome
                  ? DAMAGE_OUTCOME_LABEL[r.requestedProcessingOutcome]
                  : "—";
                const dam = getDisplayDamagedKg(r);
                return (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-3 py-2">
                      <Link
                        to={`${r.id}`}
                        relative="path"
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        {formatDamageReportCode(r.id)}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-medium">{r.targetCode}</td>
                    <td className="px-3 py-2">{r.productName ?? "—"}</td>
                    <td className="px-3 py-2">{type}</td>
                    <td className="px-3 py-2">{dam != null ? `${dam} kg` : "—"}</td>
                    <td className="px-3 py-2">
                      <DamageReportStatusBadge status={r.status as DamageReportStatus} />
                    </td>
                    <td className="px-3 py-2">{r.reportedByUsername}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {new Date(r.reportedAt).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
