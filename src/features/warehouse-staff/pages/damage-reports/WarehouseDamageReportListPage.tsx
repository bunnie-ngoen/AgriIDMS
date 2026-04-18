import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useGetDamageReportsQuery } from "../../../damage-report/api/damage-report.api";
import type {
  DamageProcessingOutcome,
  DamageReportsListParams,
  DamageReportStatus,
} from "../../../damage-report/types/damage-report.types";
import {
  DAMAGE_FORM_LABEL,
  DAMAGE_OUTCOME_LABEL,
  DAMAGE_REPORT_PAGE,
} from "../../../damage-report/constants/damage-report-ui.constants";
import { formatDamageReportCode } from "../../../damage-report/utils/damage-report-code";
import { DamageReportStatusBadge } from "../../../damage-report/components/DamageReportStatusBadge";
import { getDisplayDamagedKg } from "../../../damage-report/utils/damage-report-display";

export default function WarehouseDamageReportListPage() {
  const [status, setStatus] = useState<DamageReportStatus | "">("");
  const [outcome, setOutcome] = useState<DamageProcessingOutcome | "">("");
  const [search, setSearch] = useState("");

  const listParams = useMemo(() => {
    const p: DamageReportsListParams = {};
    if (status) p.status = status;
    if (outcome) p.requestedOutcome = outcome;
    return Object.keys(p).length ? p : undefined;
  }, [status, outcome]);

  const { data: raw = [], isFetching } = useGetDamageReportsQuery(listParams);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return raw.filter((r) => {
      if (!q) return true;
      const hay = [
        formatDamageReportCode(r.id),
        r.targetCode,
        r.productName ?? "",
        r.lotCode ?? "",
        String(r.targetId),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [raw, search]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{DAMAGE_REPORT_PAGE.warehouseListTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tạo và theo dõi phiếu báo hỏng thùng. Phiếu chờ duyệt sẽ tạm không dùng để bán.
          </p>
        </div>
        <Link
          to="/warehouse/damage-reports/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus size={16} />
          {DAMAGE_FORM_LABEL.createNew}
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-slate-600">{DAMAGE_FORM_LABEL.filterStatus}</label>
          <select
            value={status}
            onChange={(e) => setStatus((e.target.value || "") as DamageReportStatus | "")}
            className="mt-1 min-w-[160px] rounded-lg border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">{DAMAGE_FORM_LABEL.all}</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Approved">Đã xử lý</option>
            <option value="Rejected">Đã từ chối</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">{DAMAGE_FORM_LABEL.filterDamageType}</label>
          <select
            value={outcome}
            onChange={(e) => setOutcome((e.target.value || "") as DamageProcessingOutcome | "")}
            className="mt-1 min-w-[180px] rounded-lg border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">{DAMAGE_FORM_LABEL.all}</option>
            <option value="CompleteDamaged">{DAMAGE_OUTCOME_LABEL.CompleteDamaged}</option>
            <option value="PartialDamaged">{DAMAGE_OUTCOME_LABEL.PartialDamaged}</option>
          </select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="block text-xs font-medium text-slate-600">Tìm kiếm</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={DAMAGE_FORM_LABEL.searchPlaceholder}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">{DAMAGE_FORM_LABEL.reportCode}</th>
              <th className="px-3 py-2">{DAMAGE_FORM_LABEL.boxCode}</th>
              <th className="px-3 py-2">{DAMAGE_FORM_LABEL.product}</th>
              <th className="px-3 py-2">{DAMAGE_FORM_LABEL.lot}</th>
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
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                  Không có phiếu phù hợp.
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
                        to={`/warehouse/damage-reports/${r.id}`}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        {formatDamageReportCode(r.id)}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">{r.targetCode}</td>
                    <td className="px-3 py-2 text-slate-700">{r.productName ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-700">{r.lotCode ?? "—"}</td>
                    <td className="px-3 py-2">{type}</td>
                    <td className="px-3 py-2">{dam != null ? `${dam} kg` : "—"}</td>
                    <td className="px-3 py-2">
                      <DamageReportStatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-2 text-slate-700">{r.reportedByUsername}</td>
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
