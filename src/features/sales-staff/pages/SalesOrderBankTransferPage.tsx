import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import SalesStaffPageShell from "../components/SalesStaffPageShell";

type LocationState = {
  checkoutUrl?: string;
  amount?: number;
};

function vnd(n: number) {
  return n.toLocaleString("vi-VN");
}

export default function SalesOrderBankTransferPage() {
  const { id } = useParams();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const checkoutUrl = state?.checkoutUrl?.trim() ?? "";
  const amount = typeof state?.amount === "number" && Number.isFinite(state.amount) ? state.amount : null;
  const [popupBlocked, setPopupBlocked] = useState(false);

  useEffect(() => {
    if (!checkoutUrl) return;
    const win = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    if (!win) setPopupBlocked(true);
  }, [checkoutUrl]);

  if (!id || !/^\d+$/.test(id)) {
    return (
      <SalesStaffPageShell maxWidthClass="max-w-lg">
        <p className="text-sm text-rose-700">Mã đơn không hợp lệ.</p>
        <Link to="/sales/orders/sale-confirm" className="mt-3 inline-block text-sm font-semibold text-[#1a5f2a] hover:underline">
          Quay lại danh sách đơn
        </Link>
      </SalesStaffPageShell>
    );
  }

  if (!checkoutUrl) {
    return (
      <SalesStaffPageShell maxWidthClass="max-w-lg">
        <p className="text-sm text-slate-700">
          Không có link thanh toán. Hãy tạo lại thanh toán chuyển khoản từ chi tiết đơn (link PayOS chỉ hiện ngay sau khi tạo).
        </p>
        <Link
          to={`/sales/orders/${id}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Quay lại chi tiết đơn
        </Link>
      </SalesStaffPageShell>
    );
  }

  return (
    <SalesStaffPageShell maxWidthClass="max-w-5xl">
      <header className="mb-6">
        <Link
          to={`/sales/orders/${id}`}
          className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-[#1a5f2a] hover:shadow-sm hover:ring-1 hover:ring-slate-200/80"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          Quay lại chi tiết đơn
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Thanh toán chuyển khoản</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Đơn #{id}
          {amount != null ? (
            <>
              {" "}
              — Số tiền: <span className="font-semibold tabular-nums text-slate-900">{vnd(amount)} ₫</span>
            </>
          ) : null}
          . Đưa màn hình cho khách quét QR trên trang PayOS. Nếu trình duyệt chặn cửa sổ mới, hãy bấm nút bên dưới.
        </p>
      </header>

      {popupBlocked ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Trình duyệt có thể đã chặn tab mới. Bấm &quot;Mở trang thanh toán&quot; để mở link PayOS.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a5f2a] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-900/15 hover:bg-[#145026]"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          Mở trang thanh toán (QR)
        </a>
        <button
          type="button"
          onClick={() => {
            const win = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
            if (!win) setPopupBlocked(true);
          }}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Thử mở tab mới
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5">
        <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
          Xem nhúng (một số trang PayOS có thể không hiển thị trong khung — khi đó dùng nút trên)
        </p>
        <iframe
          title="PayOS — thanh toán chuyển khoản"
          src={checkoutUrl}
          className="h-[min(72vh,820px)] w-full border-0 bg-white"
        />
      </div>
    </SalesStaffPageShell>
  );
}
