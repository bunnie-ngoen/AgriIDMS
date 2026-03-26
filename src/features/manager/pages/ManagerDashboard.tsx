import { Link } from "react-router-dom";
import { PackageCheck, ShieldCheck } from "lucide-react";

export default function ManagerDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Manager - Duyet xuat kho</h2>
            <p className="mt-1 text-sm text-slate-600">
              Trang rieng cho manager xu ly cac phieu ReadyToExport cho den khi duoc phe duyet.
            </p>
          </div>
        </div>
      </div>

      <Link
        to="/manager/exports"
        className="block rounded-xl border p-4 transition hover:shadow-sm text-indigo-700 bg-indigo-50 border-indigo-200"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Mo danh sach phieu cho duyet xuat</p>
          <PackageCheck size={17} />
        </div>
        <p className="mt-2 text-xs opacity-90">Chi bao gom flow manager, khong dung chung giao dien admin.</p>
      </Link>
    </div>
  );
}
