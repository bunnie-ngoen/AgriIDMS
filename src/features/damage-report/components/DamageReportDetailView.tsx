import type { ReactNode } from "react";
import type { DamageReportDto } from "../types/damage-report.types";
import { DAMAGE_FORM_LABEL, DAMAGE_OUTCOME_LABEL } from "../constants/damage-report-ui.constants";
import { formatDamageReportCode } from "../utils/damage-report-code";
import { getDisplayDamagedKg, getDisplayGoodRemainingKg } from "../utils/damage-report-display";
import { DamageReportStatusBadge } from "./DamageReportStatusBadge";

function outcomeLabel(d: DamageReportDto): string {
  const o =
    d.status === "Approved" && d.processingOutcome
      ? d.processingOutcome
      : d.requestedProcessingOutcome;
  return o ? DAMAGE_OUTCOME_LABEL[o] : "—";
}

export function DamageReportDetailView({
  report,
  children,
}: {
  report: DamageReportDto;
  children?: ReactNode;
}) {
  const good = getDisplayGoodRemainingKg(report);
  const damaged = getDisplayDamagedKg(report);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500">{DAMAGE_FORM_LABEL.reportCode}</div>
          <div className="text-lg font-semibold text-slate-900">{formatDamageReportCode(report.id)}</div>
        </div>
        <DamageReportStatusBadge status={report.status} />
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <div className="text-xs text-slate-500">{DAMAGE_FORM_LABEL.boxCode}</div>
          <div className="font-semibold text-slate-900">{report.targetCode}</div>
          <div className="text-xs text-slate-500">
            {DAMAGE_FORM_LABEL.boxId}: {report.targetId}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">{DAMAGE_FORM_LABEL.product}</div>
          <div className="font-medium text-slate-900">{report.productName ?? "—"}</div>
          {report.productVariantId ? (
            <div className="text-xs text-slate-500">Biến thể #{report.productVariantId}</div>
          ) : null}
        </div>
        <div>
          <div className="text-xs text-slate-500">{DAMAGE_FORM_LABEL.lot}</div>
          <div className="font-medium text-slate-900">{report.lotCode ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">{DAMAGE_FORM_LABEL.damageType}</div>
          <div className="font-medium text-slate-900">{outcomeLabel(report)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">{DAMAGE_FORM_LABEL.damagedQty}</div>
          <div className="font-medium text-slate-900">
            {damaged != null ? `${damaged} kg` : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">{DAMAGE_FORM_LABEL.goodQty}</div>
          <div className="font-medium text-slate-900">
            {good != null ? `${good.toFixed(3)} kg` : "—"}
          </div>
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs text-slate-500">{DAMAGE_FORM_LABEL.reason}</div>
          <div className="text-slate-900">{report.damageReason}</div>
        </div>
        {report.note ? (
          <div className="sm:col-span-2">
            <div className="text-xs text-slate-500">Ghi chú</div>
            <div className="text-slate-800">{report.note}</div>
          </div>
        ) : null}
      </div>

      {report.evidenceImageUrl ? (
        <div>
          <div className="mb-1 text-xs font-medium text-slate-600">{DAMAGE_FORM_LABEL.evidence}</div>
          <a href={report.evidenceImageUrl} target="_blank" rel="noreferrer" className="inline-block">
            <img
              src={report.evidenceImageUrl}
              alt="Chứng cứ"
              className="max-h-48 rounded-lg border border-slate-200 object-contain"
            />
          </a>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-700">Người tạo:</span> {report.reportedByUsername} ·{" "}
          {new Date(report.reportedAt).toLocaleString("vi-VN")}
        </div>
        {report.reviewedAt ? (
          <div className="mt-1">
            <span className="font-semibold text-slate-700">Người xử lý:</span>{" "}
            {report.reviewedByUsername ?? "—"} · {new Date(report.reviewedAt).toLocaleString("vi-VN")}
          </div>
        ) : null}
        {report.status === "Rejected" && report.reviewNote ? (
          <div className="mt-1 text-rose-700">
            <span className="font-semibold">Lý do từ chối:</span> {report.reviewNote}
          </div>
        ) : null}
      </div>

      {children ? <div className="border-t border-slate-200 pt-4">{children}</div> : null}
    </div>
  );
}
