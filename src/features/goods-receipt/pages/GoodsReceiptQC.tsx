import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  useGetGoodsReceiptByIdQuery,
  useGetGoodsReceiptForApprovalByIdQuery,
  useQcInspectionMutation,
  useApproveGoodsReceiptMutation,
  useManagerApproveGoodsReceiptMutation,
  useManagerRejectGoodsReceiptMutation,
  useCreateBoxesMutation,
  useGetLotsByGoodsReceiptIdQuery,
  useUpdateGoodsReceiptWarehouseMutation,
} from "../api/goods-receipt.api";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";
import { useGetWarehousesQuery } from "../../admin/api/create-user.api";

type QCForm = {
  usableWeight: number;
  qcResult: "Passed" | "Failed";
  qcNote?: string;
};

type CreateBoxesForm = {
  lotId: number;
  boxSize: number;
};

export default function GoodsReceiptQC() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const receiptId = id ? Number(id) : 0;
  const { isAdmin, isManager } = useRoleGuard();

  const {
    data: receipt,
    isLoading,
    error,
    refetch,
  } = useGetGoodsReceiptByIdQuery(receiptId, {
    skip: !receiptId || Number.isNaN(receiptId),
  });

  const {
    data: lots = [],
    isLoading: isLoadingLots,
    error: lotsError,
  } = useGetLotsByGoodsReceiptIdQuery(receiptId, {
    skip: !receiptId || Number.isNaN(receiptId),
  });

  const [qcInspection, { isLoading: isQcLoading }] = useQcInspectionMutation();
  const [approveReceipt, { isLoading: isApproving }] =
    useApproveGoodsReceiptMutation();
  const [managerApprove, { isLoading: isManagerApproving }] =
    useManagerApproveGoodsReceiptMutation();
  const [managerReject, { isLoading: isManagerRejecting }] =
    useManagerRejectGoodsReceiptMutation();
  const [createBoxes, { isLoading: isCreatingBoxes }] =
    useCreateBoxesMutation();
  const [updateReceiptWarehouse, { isLoading: isUpdatingWarehouse }] =
    useUpdateGoodsReceiptWarehouseMutation();

  const { data: warehouses = [] } = useGetWarehousesQuery();

  const [selectedDetailIdForQc, setSelectedDetailIdForQc] = useState<
    number | null
  >(null);

  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(0);

  const qcForm = useForm<QCForm>({
    defaultValues: {
      usableWeight: 0,
      qcResult: "Passed",
      qcNote: "",
    },
  });

  const createBoxesForm = useForm<CreateBoxesForm>({
    defaultValues: {
      lotId: 0,
      boxSize: 0,
    },
  });

  useEffect(() => {
    if (lots && lots.length > 0) {
      const currentLotId = createBoxesForm.getValues("lotId");
      if (!currentLotId || currentLotId <= 0) {
        createBoxesForm.setValue("lotId", lots[0].id);
      }
    }
  }, [lots, createBoxesForm]);

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

  const canQC =
    receipt.status === "Draft" ||
    receipt.status === "Received" ||
    receipt.status === "QCCompleted" ||
    receipt.status === "PendingManagerApproval";
  const canApprove =
    receipt.status === "Draft" ||
    receipt.status === "Received" ||
    receipt.status === "QCCompleted";
  const canManagerAction = receipt.status === "PendingManagerApproval";
  const canViewPrice = isAdmin() || isManager();
  const moneyFmt = useMemo(
    () => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }),
    [],
  );

  const {
    data: receiptForApproval,
    refetch: refetchForApproval,
  } = useGetGoodsReceiptForApprovalByIdQuery(receiptId, {
    skip: !canViewPrice || !receiptId || Number.isNaN(receiptId),
  });

  const detailsForTable =
    canViewPrice && receiptForApproval?.details?.length
      ? receiptForApproval.details
      : receipt.details;

  const handleOpenQcForDetail = (detailId: number, currentUsable: number) => {
    setSelectedDetailIdForQc(detailId);
    qcForm.reset({
      usableWeight: currentUsable,
      qcResult: "Passed",
      qcNote: "",
    });
  };

  const handleSubmitQc = async (values: QCForm) => {
    if (!selectedDetailIdForQc) {
      toast.error("Vui lòng chọn dòng chi tiết cần QC.");
      return;
    }
    const detail = receipt.details.find((d) => d.id === selectedDetailIdForQc);
    if (!detail) {
      toast.error("Không tìm thấy dòng chi tiết cần QC.");
      return;
    }

    const usable = Number(values.usableWeight);
    if (Number.isNaN(usable) || usable < 0) {
      toast.error("Khối lượng dùng được phải >= 0.");
      return;
    }
    if (usable > Number(detail.receivedWeight)) {
      toast.error(
        `Khối lượng dùng được không được vượt quá khối lượng nhận (${detail.receivedWeight} kg).`,
      );
      return;
    }
    if (values.qcResult === "Failed" && usable !== 0) {
      toast.error(
        "Khi QC không đạt (Failed), khối lượng dùng được phải bằng 0.",
      );
      return;
    }

    const toastId = toast.loading("Đang cập nhật QC cho dòng chi tiết...");
    try {
      await qcInspection({
        detailId: selectedDetailIdForQc,
        usableWeight: usable,
        qcResult: values.qcResult,
        qcNote: values.qcNote,
        goodsReceiptId: receipt.id,
      }).unwrap();
      toast.success("Cập nhật QC thành công.", { id: toastId });
      setSelectedDetailIdForQc(null);
      await refetch();
      if (canViewPrice) await refetchForApproval();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        "Cập nhật QC thất bại.";
      toast.error(msg, { id: toastId });
    }
  };

  const handleApprove = async () => {
    if (!window.confirm("Bạn chắc chắn muốn duyệt phiếu nhập này?")) return;
    const toastId = toast.loading("Đang duyệt phiếu nhập...");
    try {
      await approveReceipt(receipt.id).unwrap();
      toast.success("Duyệt phiếu nhập thành công.", { id: toastId });
      await refetch();
      if (canViewPrice) await refetchForApproval();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        "Duyệt phiếu nhập thất bại.";
      toast.error(msg, { id: toastId });

      // Nếu lỗi do kho không đủ dung lượng, mở popup cho chọn lại kho
      if (
        typeof msg === "string" &&
        (msg.includes("Không đủ dung lượng") || msg.includes("kg trống"))
      ) {
        setSelectedWarehouseId(receipt.warehouseId || 0);
        setIsWarehouseModalOpen(true);
      }
    }
  };

  const handleConfirmChangeWarehouse = async () => {
    if (!selectedWarehouseId || selectedWarehouseId <= 0) {
      toast.error("Vui lòng chọn kho hợp lệ.");
      return;
    }
    const toastId = toast.loading("Đang cập nhật kho cho phiếu nhập...");
    try {
      await updateReceiptWarehouse({
        receiptId: receipt.id,
        warehouseId: selectedWarehouseId,
      }).unwrap();
      toast.success("Đã cập nhật kho cho phiếu nhập.", { id: toastId });
      setIsWarehouseModalOpen(false);
      await refetch();
      if (canViewPrice) await refetchForApproval();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        "Cập nhật kho thất bại.";
      toast.error(msg, { id: toastId });
    }
  };

  const handleManagerApprove = async () => {
    if (!window.confirm("Manager xác nhận DUYỆT phiếu nhập này?")) return;
    const toastId = toast.loading("Manager đang duyệt phiếu nhập...");
    try {
      await managerApprove(receipt.id).unwrap();
      toast.success("Manager duyệt phiếu nhập thành công.", { id: toastId });
      await refetch();
      if (canViewPrice) await refetchForApproval();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        "Manager duyệt phiếu nhập thất bại.";
      toast.error(msg, { id: toastId });
    }
  };

  const handleManagerReject = async () => {
    if (!window.confirm("Manager xác nhận TỪ CHỐI phiếu nhập này?")) return;
    const toastId = toast.loading("Manager đang từ chối phiếu nhập...");
    try {
      await managerReject(receipt.id).unwrap();
      toast.success("Manager từ chối phiếu nhập thành công.", {
        id: toastId,
      });
      await refetch();
      if (canViewPrice) await refetchForApproval();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        "Manager từ chối phiếu nhập thất bại.";
      toast.error(msg, { id: toastId });
    }
  };

  const handleSubmitCreateBoxes = async (values: CreateBoxesForm) => {
    if (!lots || lots.length === 0) {
      toast.error(
        "Phiếu nhập này chưa có Lot nào. Vui lòng tạo Lot trước khi tạo box.",
      );
      return;
    }

    if (!values.lotId || values.lotId <= 0) {
      toast.error("Vui lòng chọn Lot hợp lệ.");
      return;
    }
    if (!values.boxSize || values.boxSize <= 0) {
      toast.error("Kích thước box phải > 0.");
      return;
    }

    const toastId = toast.loading("Đang tạo box cho lot...");
    try {
      await createBoxes({
        lotId: Number(values.lotId),
        boxSize: Number(values.boxSize),
      }).unwrap();
      toast.success("Tạo box thành công.", { id: toastId });
      createBoxesForm.reset({ lotId: 0, boxSize: 0 });
      // Sau khi tạo box thành công, quay về danh sách phiếu nhập
      setTimeout(() => {
        navigate("/admin/goods-receipts");
      }, 600);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        "Tạo box thất bại.";
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-5 py-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/goods-receipts/${receipt.id}`)}
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Bước 2 · QC & duyệt phiếu nhập · {receipt.receiptCode}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {receipt.supplierName} · {receipt.warehouseName} ·{" "}
              <span className={statusClass(receipt.status)}>
                {receipt.status}
              </span>
            </p>
          </div>
        </div>

        {/* Summary + approve */}
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
                Khối lượng nhận / dùng được
              </span>
              <p className="font-medium text-slate-900 mt-1">
                {receipt.totalReceivedWeight} kg /{" "}
                <span className="font-semibold">
                  {receipt.totalUsableWeight} kg
                </span>
              </p>
            </div>
          </div>
          <div className="px-6 py-3 border-t border-slate-100 space-y-1.5">
            <p className="text-xs font-semibold text-slate-600">
              Bước 3 · Duyệt phiếu / Manager duyệt
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Trạng thái hiện tại:{" "}
                <span className={statusClass(receipt.status)}>
                  {receipt.status}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {canApprove && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white px-3 py-1.5 disabled:opacity-60"
                  >
                    {isApproving && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    Duyệt phiếu (Admin)
                  </button>
                )}
                {canManagerAction && (
                  <>
                    <button
                      type="button"
                      onClick={handleManagerApprove}
                      disabled={isManagerApproving}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white px-3 py-1.5 disabled:opacity-60"
                    >
                      {isManagerApproving && (
                        <Loader2 size={12} className="animate-spin" />
                      )}
                      Manager duyệt
                    </button>
                    <button
                      type="button"
                      onClick={handleManagerReject}
                      disabled={isManagerRejecting}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white px-3 py-1.5 disabled:opacity-60"
                    >
                      {isManagerRejecting && (
                        <Loader2 size={12} className="animate-spin" />
                      )}
                      Manager từ chối
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* QC table + form */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Bước 2 · QC dòng chi tiết phiếu nhập
              </h2>
              {!canQC && (
                <p className="text-[11px] text-slate-400">
                  QC chỉ thực hiện trước khi phiếu được duyệt / tạo box.
                </p>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Sản phẩm
                  </th>
                  {canViewPrice && (
                    <>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Đơn giá
                      </th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Thành tiền
                      </th>
                    </>
                  )}
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
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {detailsForTable.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canViewPrice ? 8 : 6}
                      className="px-5 py-6 text-center text-slate-500 text-sm"
                    >
                      Chưa có dòng chi tiết nào.
                    </td>
                  </tr>
                ) : (
                  detailsForTable.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50"
                    >
                      <td className="px-5 py-3 text-slate-800">
                        {d.productName}
                      </td>
                      {canViewPrice && (
                        <>
                          <td className="px-5 py-3 text-right text-slate-700 tabular-nums">
                            {d.unitPrice != null
                              ? `${moneyFmt.format(Number(d.unitPrice))} ₫`
                              : "—"}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-700 tabular-nums">
                            {d.lineTotal != null
                              ? `${moneyFmt.format(Number(d.lineTotal))} ₫`
                              : "—"}
                          </td>
                        </>
                      )}
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
                      <td className="px-5 py-3 text-right">
                        {canQC ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenQcForDetail(d.id, d.usableWeight)
                            }
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200"
                          >
                            QC dòng
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Đã khoá QC
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* QC form */}
          {selectedDetailIdForQc && canQC && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <h3 className="text-xs font-semibold text-slate-800 mb-3">
                QC cho dòng chi tiết #{selectedDetailIdForQc}
              </h3>
              <form
                onSubmit={qcForm.handleSubmit(handleSubmitQc)}
                className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm items-end"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Khối lượng dùng được (kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    {...qcForm.register("usableWeight", {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Kết quả QC
                  </label>
                  <select
                    {...qcForm.register("qcResult")}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                  >
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    {...qcForm.register("qcNote")}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                    placeholder="Ghi chú QC (tuỳ chọn)"
                  />
                </div>
                <div className="flex gap-2 md:col-span-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailIdForQc(null)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    disabled={isQcLoading}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    {isQcLoading && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Lưu QC
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Create boxes section */}
          {receipt.status === "Approved" && (
            <div className="px-6 py-4 border-t border-slate-100 bg-emerald-50/40">
              <h3 className="text-xs font-semibold text-slate-800 mb-2">
                Tạo box từ Lot
              </h3>
              {lotsError && (
                <p className="text-xs text-rose-600 mb-2">
                  Không tải được danh sách Lot cho phiếu nhập này.
                </p>
              )}
              {lots.length === 0 && !isLoadingLots && !lotsError && (
                <p className="text-xs text-slate-500 mb-2">
                  Chưa có Lot nào được tạo cho phiếu nhập này.
                </p>
              )}
              <form
                onSubmit={createBoxesForm.handleSubmit(
                  handleSubmitCreateBoxes,
                )}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm items-end"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Chọn Lot
                  </label>
                  <select
                    {...createBoxesForm.register("lotId", {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                    disabled={isLoadingLots || lots.length === 0}
                  >
                    {isLoadingLots && (
                      <option value="">Đang tải danh sách Lot...</option>
                    )}
                    {!isLoadingLots &&
                      lots.map((lot) => (
                        <option key={lot.id} value={lot.id}>
                          #{lot.id} · {lot.lotCode} · còn{" "}
                          {lot.remainingQuantity} kg
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Box size (kg)
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    {...createBoxesForm.register("boxSize", {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                    placeholder="VD: 5 (kg mỗi box)"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      isCreatingBoxes || isLoadingLots || lots.length === 0
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    {isCreatingBoxes && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Tạo box
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Popup đổi kho khi kho hiện tại không đủ dung lượng */}
        {isWarehouseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">
                  Kho hiện tại không đủ dung lượng
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Vui lòng chọn kho khác để tiếp tục duyệt phiếu nhập.
                </p>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Chọn kho mới
                  </label>
                  <select
                    value={selectedWarehouseId || ""}
                    onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                  >
                    <option value="">Chọn kho</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        #{w.id} · {w.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Lưu ý: BE sẽ kiểm tra lại dung lượng kho mới khi duyệt.
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  disabled={isUpdatingWarehouse}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmChangeWarehouse}
                  disabled={isUpdatingWarehouse}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {isUpdatingWarehouse && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Cập nhật kho
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

