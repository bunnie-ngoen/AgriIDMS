import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  ChevronRight,
  Sparkles,
  Clock3,
  BadgeCheck,
} from "lucide-react";

export default function SalesStaffDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <LayoutDashboard size={20} className="text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-900">Tổng quan Sales Staff</h1>
        </div>
        <p className="text-sm text-slate-600">
          Theo dõi các đơn cần xử lý, allocate và xác nhận theo thời gian thực.
        </p>
        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sky-700">
              <Sparkles size={16} />
              <span className="text-xs font-semibold">Xác nhận bán</span>
            </div>
            <p className="mt-1 text-xs text-sky-800">Xác nhận đơn online từ khách hàng</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <BadgeCheck size={16} />
              <span className="text-xs font-semibold">Giữ hàng</span>
            </div>
            <p className="mt-1 text-xs text-emerald-800">Giữ hàng và phối hợp kho xác nhận</p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
            <div className="flex items-center gap-2 text-violet-700">
              <Clock3 size={16} />
              <span className="text-xs font-semibold">Tiền mặt</span>
            </div>
            <p className="mt-1 text-xs text-violet-800">Xác nhận thu tiền và chốt trạng thái</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <button
          type="button"
          onClick={() => navigate("/sales/orders")}
          className="w-full sm:w-auto flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ClipboardList size={20} className="text-sky-600" />
          <span className="font-medium text-slate-800">Đi tới danh sách đơn cần xử lý</span>
          <ChevronRight size={16} className="text-slate-400" />
        </button>
      </div>
    </div>
  );
}

