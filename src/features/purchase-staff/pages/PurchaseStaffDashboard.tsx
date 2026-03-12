import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus, Search, LayoutDashboard, ChevronRight, List } from "lucide-react";

const CARD_CLASS =
  "flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md transition-all text-left w-full";

export default function PurchaseStaffDashboard() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");

  const handleViewOrder = () => {
    const id = orderId.trim();
    if (!id) return;
    const num = parseInt(id, 10);
    if (Number.isNaN(num) || num < 1) return;
    navigate(`/purchase-staff/orders/${num}`);
  };

  return (
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={20} className="text-slate-600" />
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
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

          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm sm:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                <Search size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-800">Xem đơn mua</h2>
                <p className="text-sm text-slate-500">
                  Nhập ID đơn để xem chi tiết
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleViewOrder()}
                placeholder="ID đơn"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={handleViewOrder}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700"
              >
                Xem
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
