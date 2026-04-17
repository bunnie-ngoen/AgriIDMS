import { useNavigate } from "react-router-dom";
import { FilePlus, LayoutDashboard, ChevronRight, List } from "lucide-react";

const CARD_CLASS =
  "flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md transition-all text-left w-full";

export default function PurchaseStaffDashboard() {
  const navigate = useNavigate();

  return (
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={20} className="text-slate-600" />
            <h1 className="text-xl font-semibold text-slate-900">Bảng điều khiển</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý đơn mua hàng (thỏa thuận nhà cung cấp – quản lý).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/purchase-staff/orders/create")}
            className={CARD_CLASS}
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
              <FilePlus size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-800">Tạo đơn mua</h2>
              <p className="text-sm text-slate-500">
                Tạo đơn mua hàng mới với nhà cung cấp
              </p>
            </div>
            <ChevronRight size={18} className="text-slate-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/purchase-staff/orders")}
            className={CARD_CLASS}
          >
            <div className="h-12 w-12 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 text-sky-600">
              <List size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-800">Danh sách đơn mua</h2>
              <p className="text-sm text-slate-500">
                Xem toàn bộ đơn mua, bấm vào đơn để xem chi tiết
              </p>
            </div>
            <ChevronRight size={18} className="text-slate-400 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
