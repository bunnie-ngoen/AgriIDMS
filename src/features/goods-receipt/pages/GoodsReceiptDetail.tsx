import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  useGetGoodsReceiptByIdQuery,
  useAddGoodsReceiptDetailMutation,
  useUpdateTruckWeightMutation,
} from "../api/goods-receipt.api";
import { useGetPurchaseOrderByIdQuery } from "../../purchase-order/api/purchase-order.api";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type TruckWeightForm = {
  grossWeight: number;
  tareWeight: number;
};

type AddDetailForm = {
  purchaseOrderDetailId: number;
  receivedWeight: number;
};

export default function GoodsReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const receiptId = id ? Number(id) : 0;

  const {
    data: receipt,
    isLoading,
    error,
  } = useGetGoodsReceiptByIdQuery(receiptId, {
    skip: !receiptId || Number.isNaN(receiptId),
  });

  const [addDetail, { isLoading: isAdding }] =
    useAddGoodsReceiptDetailMutation();
  const [updateTruckWeight, { isLoading: isUpdatingTruck }] =
    useUpdateTruckWeightMutation();

  const poId = receipt?.purchaseOrderId ?? 0;
  const {
    data: purchaseOrder,
    isLoading: isLoadingPo,
  } = useGetPurchaseOrderByIdQuery(poId, {
    skip: !poId,
  });

  const truckForm = useForm<TruckWeightForm>({
    defaultValues: {
      grossWeight: 0,
      tareWeight: 0,
    },
  });

  const addDetailForm = useForm<AddDetailForm>({
    defaultValues: {
      purchaseOrderDetailId: 0,
      receivedWeight: 0,
    },
  });

  if (Number.isNaN(receiptId) || receiptId < 1) {
    navigate("/admin/goods-receipts");
    return null;
  }

  if (isLoading || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        {isLoading ? (
          <Loader2 size={32} className="animate-spin text-slate-400" />
        ) : error ? (
          <p>Không tải được phiếu nhập.</p>
        ) : null}
      </div>
    );
  }

  const statusClass = (status: string) => {
    if (status === "Approved") return "text-emerald-600";
    if (status === "PendingManagerApproval" || status === "Pending")
      return "text-amber-600";
    if (status === "Rejected") return "text-red-600";
    return "text-slate-600";
  };

  const canEditDetails =
    receipt.status === "Draft" || receipt.status === "Received";
  const canUpdateTruckWeight =
    receipt.status === "Draft" || receipt.status === "Received";

  const handleSubmitTruckWeight = async (values: TruckWeightForm) => {
    const toastId = toast.loading("Đang cập nhật trọng lượng xe...");
    try {
      await updateTruckWeight({
        goodsReceiptId: receipt.id,
        grossWeight: Number(values.grossWeight),
        tareWeight: Number(values.tareWeight),
      }).unwrap();
      toast.success("Cập nhật trọng lượng xe thành công.", { id: toastId });
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        "Cập nhật trọng lượng xe thất bại.";
      toast.error(msg, { id: toastId });
    }
  };

  const handleSubmitAddDetail = async (values: AddDetailForm) => {
    if (!purchaseOrder) return;
    const detail = purchaseOrder.details.find(
      (d) => d.id === values.purchaseOrderDetailId,
    );
    if (!detail) {
      toast.error("Vui lòng chọn dòng đơn mua hợp lệ.");
      return;
    }
    if (!values.receivedWeight || Number(values.receivedWeight) <= 0) {
      toast.error("Khối lượng nhận phải lớn hơn 0.");
      return;
    }

    const toastId = toast.loading("Đang thêm chi tiết phiếu nhập...");
    try {
      await addDetail({
        goodsReceiptId: receipt.id,
        purchaseOrderDetailId: detail.id,
        productVariantId: detail.productVariantId,
        receivedWeight: Number(values.receivedWeight),
      }).unwrap();
      toast.success("Thêm chi tiết phiếu nhập thành công.", { id: toastId });
      addDetailForm.reset({ purchaseOrderDetailId: 0, receivedWeight: 0 });
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        "Thêm chi tiết phiếu nhập thất bại.";
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-5 py-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin/goods-receipts")}
              className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Bước 1 · Nhập hàng vào kho · {receipt.receiptCode}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {receipt.supplierName} · {receipt.warehouseName} ·{" "}
                <span className={statusClass(receipt.status)}>
                  {receipt.status}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(`/admin/goods-receipts/${receipt.id}/qc`)
            }
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Mở màn QC
          </button>
        </div>

        {/* Summary card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500 block text-xs font-medium">
                Nhà cung cấp
              </span>
              <p className="font-medium text-slate-900 mt-1">
                {receipt.supplierName}
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">
                Kho
              </span>
              <p className="font-medium text-slate-900 mt-1">
                {receipt.warehouseName}
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">
                Ngày nhận
              </span>
              <p className="font-medium text-slate-900 mt-1">
                {receipt.receivedDate
                  ? new Date(receipt.receivedDate).toLocaleDateString("vi-VN")
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">
                KL nhận / dùng được
              </span>
              <p className="font-medium text-slate-900 mt-1">
                {receipt.totalReceivedWeight} kg /{" "}
                <span className="font-semibold">
                  {receipt.totalUsableWeight} kg
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bước 1: nhập hàng (trọng lượng xe + dòng chi tiết) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Truck weight */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Bước 1 · Trọng lượng xe
              </h2>
              {!canUpdateTruckWeight && (
                <p className="text-[11px] text-slate-400">
                  Đã khoá sau khi phiếu được duyệt.
                </p>
              )}
            </div>
            <form
              onSubmit={truckForm.handleSubmit(handleSubmitTruckWeight)}
              className="space-y-3 text-sm"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tổng trọng lượng xe (gross weight, kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    {...truckForm.register("grossWeight", {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Trọng lượng bì (tare weight, kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    {...truckForm.register("tareWeight", {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isUpdatingTruck || !canUpdateTruckWeight}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdatingTruck ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Lưu trọng lượng xe"
                )}
              </button>
            </form>
          </div>

          {/* Add detail */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Bước 1 · Thêm dòng chi tiết phiếu
              </h2>
              {!canEditDetails && (
                <p className="text-[11px] text-slate-400">
                  Chỉ thêm khi phiếu đang Nháp / Đã nhập số liệu.
                </p>
              )}
            </div>
            {isLoadingPo && (
              <p className="text-xs text-slate-500">
                Đang tải đơn mua liên quan...
              </p>
            )}
            {!poId && (
              <p className="text-xs text-slate-500">
                Phiếu nhập này chưa gắn với đơn mua nào, không thể thêm chi
                tiết.
              </p>
            )}
            {poId && purchaseOrder && (
              <form
                onSubmit={addDetailForm.handleSubmit(handleSubmitAddDetail)}
                className="space-y-3 text-sm"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Chọn dòng sản phẩm từ đơn mua *
                  </label>
                  <select
                    {...addDetailForm.register("purchaseOrderDetailId", {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                  >
                    <option value={0}>
                      Chọn sản phẩm / dòng chi tiết trong đơn mua
                    </option>
                    {purchaseOrder.details.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.productName} — KL đặt: {d.orderedWeight} kg, còn lại:{" "}
                        {d.remainingWeight} kg
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Khối lượng nhận (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0.01}
                    {...addDetailForm.register("receivedWeight", {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAdding || !canEditDetails}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Đang thêm chi tiết...
                    </>
                  ) : (
                    "Thêm chi tiết"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bảng chi tiết (chỉ đọc) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">
              Dòng chi tiết phiếu nhập
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Sản phẩm
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    KL nhận
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    KL dùng được
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    KL loại
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Kết quả QC
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipt.details.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-6 text-center text-slate-500 text-sm"
                    >
                      Chưa có dòng chi tiết nào. Hãy thêm chi tiết phía trên.
                    </td>
                  </tr>
                ) : (
                  receipt.details.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50"
                    >
                      <td className="px-5 py-3 text-slate-800">
                        {d.productName}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-700">
                        {d.receivedWeight}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-700">
                        {d.usableWeight}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-700">
                        {d.rejectWeight}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {d.qcResult || "Chưa QC"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

