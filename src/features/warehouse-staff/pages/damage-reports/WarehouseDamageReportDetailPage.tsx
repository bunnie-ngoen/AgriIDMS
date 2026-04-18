import { Link, useParams } from "react-router-dom";
import { useGetDamageReportByIdQuery } from "../../../damage-report/api/damage-report.api";
import { DAMAGE_REPORT_PAGE } from "../../../damage-report/constants/damage-report-ui.constants";
import { DamageReportDetailView } from "../../../damage-report/components/DamageReportDetailView";

export default function WarehouseDamageReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const skip = !Number.isFinite(numericId) || numericId <= 0;
  const { data, isLoading, isError } = useGetDamageReportByIdQuery(numericId, { skip });

  if (skip || isError) {
    return (
      <div className="p-6">
        <p className="text-rose-600">Không tìm thấy phiếu.</p>
        <Link to="/warehouse/damage-reports" className="mt-2 inline-block text-emerald-700 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="p-6 text-slate-600">Đang tải…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link to="/warehouse/damage-reports" className="text-sm font-semibold text-emerald-700 hover:underline">
          ← Danh sách phiếu
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-slate-900">{DAMAGE_REPORT_PAGE.warehouseDetailTitle}</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <DamageReportDetailView report={data} />
      </div>
    </div>
  );
}
