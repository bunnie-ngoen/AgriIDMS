import { Link } from "react-router-dom";
import { ClipboardList, ShieldCheck } from "lucide-react";

export default function WarehouseStaffDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Kho - Đơn hàng và thanh toán
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Theo BE mới, kho tập trung các bước giữ hàng, kho xác nhận và tiền mặt.
            </p>
          </div>
        </div>
      </div>

      <Link
        to="/warehouse/orders"
        className="block rounded-xl border p-4 transition hover:shadow-sm text-emerald-700 bg-emerald-50 border-emerald-200"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Mở hàng đợi đơn hàng và thanh toán</p>
          <ClipboardList size={17} />
        </div>
        <p className="mt-2 text-xs opacity-90">
          Gồm hàng đợi giữ hàng, chờ kho xác nhận và tiền mặt chờ xác nhận.
        </p>
      </Link>
    </div>
  );
}

