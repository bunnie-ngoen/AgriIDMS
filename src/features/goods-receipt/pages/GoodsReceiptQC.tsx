import { Navigate, useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  useGetGoodsReceiptByIdQuery,
  useGetGoodsReceiptForApprovalByIdQuery,
  useQcInspectionMutation,
  useApproveGoodsReceiptMutation,
  useManagerAllowQcMutation,
  useManagerReviewMinWeightMutation,
  useManagerReviewToleranceMutation,
  useCreateBoxesMutation,
  useGetBoxesByGoodsReceiptIdQuery,
  useGetLotsByGoodsReceiptIdQuery,
  useUpdateGoodsReceiptWarehouseMutation,
  useUpdateLotQrImageMutation,
  useUpdateBoxQrImageMutation,
} from "../api/goods-receipt.api";
import { uploadQrPayloadToCloudinary } from "../../../shared/lib/qrImageCloudinary";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";
import { useGetWarehousesQuery } from "../../admin/api/create-user.api";
import { BoxTypeEnum } from "../types/goods-receipt.type";

type QCForm = {
  usableWeight: number;
};

type CreateBoxesForm = {
  lotId: number;
  boxSize: number;
  boxType: BoxTypeEnum;
};

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<{ success: number; failed: number }> {
  if (items.length === 0) return { success: 0, failed: 0 };
  const limit = Math.max(1, Math.min(concurrency, items.length));
  let cursor = 0;
  let success = 0;
  let failed = 0;

  const runners = Array.from({ length: limit }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) break;
      try {
        await worker(items[index]);
        success++;
      } catch {
        failed++;
      }
    }
  });

  await Promise.all(runners);
  return { success, failed };
}

function toVietnameseReceiptStatus(status: string): string {
  switch (status) {
    case "Draft":
      return "Nháp";
    case "Received":
      return "Đã nhận";
    case "QCCompleted":
      return "Đã hoàn tất kiểm tra chất lượng";
    case "PendingManagerApproval":
      return "Chờ quản lý duyệt";
    case "PendingManagerApprovalQc":
      return "Chờ quản lý duyệt (kiểm tra chất lượng)";
    case "Approved":
      return "Đã duyệt";
    case "Rejected":
      return "Đã từ chối";
    default:
      return status;
  }
}

function toVietnameseQcResult(qcResult?: string | null): string {
  if (!qcResult) return "Chưa kiểm tra chất lượng";
  if (qcResult === "Passed") return "Đạt";
  if (qcResult === "Rejected") return "Loại";
  return qcResult;
}

export default function GoodsReceiptQC() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const receiptId = id ? Number(id) : 0;
  const { isAdmin, isManager, isWarehouseStaff } = useRoleGuard();
  const basePath = isWarehouseStaff()
    ? "/warehouse/goods-receipts"
    : isManager()
      ? "/manager/goods-receipts"
      : "/admin/goods-receipts";

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
    refetch: refetchLots,
  } = useGetLotsByGoodsReceiptIdQuery(receiptId, {
    skip: !receiptId || Number.isNaN(receiptId),
  });
  const {
    data: receiptBoxes = [],
    isFetching: isFetchingReceiptBoxes,
    refetch: refetchReceiptBoxes,
  } = useGetBoxesByGoodsReceiptIdQuery(receiptId, {
    skip: !receiptId || Number.isNaN(receiptId),
  });

  const [qcInspection, { isLoading: isQcLoading }] = useQcInspectionMutation();
  const [approveReceipt, { isLoading: isApproving }] =
    useApproveGoodsReceiptMutation();
  const [managerAllowQc, { isLoading: isManagerAllowingQc }] =
    useManagerAllowQcMutation();
  const [managerReviewMin, { isLoading: isManagerReviewingMin }] =
    useManagerReviewMinWeightMutation();
  const [managerReviewTolerance, { isLoading: isManagerReviewingTolerance }] =
    useManagerReviewToleranceMutation();
  const [createBoxes, { isLoading: isCreatingBoxes }] =
    useCreateBoxesMutation();
  const [updateLotQrImage] = useUpdateLotQrImageMutation();
  const [updateBoxQrImage] = useUpdateBoxQrImageMutation();
  const [updateReceiptWarehouse, { isLoading: isUpdatingWarehouse }] =
    useUpdateGoodsReceiptWarehouseMutation();

  const { data: warehouses = [] } = useGetWarehousesQuery();

  // Pagination for receipt boxes table.
  const [boxesPage, setBoxesPage] = useState(1);
  const [boxesPageSize, setBoxesPageSize] = useState(10);

  useEffect(() => {
    // Reset pagination when list changes.
    setBoxesPage(1);
  }, [receiptBoxes.length]);

  const boxesTotalPages = Math.max(
    1,
    Math.ceil(receiptBoxes.length / boxesPageSize),
  );
  const safeBoxesPage = Math.min(boxesPage, boxesTotalPages);
  const boxesPaged = receiptBoxes.slice(
    (safeBoxesPage - 1) * boxesPageSize,
    safeBoxesPage * boxesPageSize,
  );

  const otherWarehouses = useMemo(
    () =>
      receipt
        ? warehouses.filter((w) => w.id !== receipt.warehouseId)
        : warehouses,
    [warehouses, receipt],
  );

  const [selectedDetailIdForQc, setSelectedDetailIdForQc] = useState<
    number | null
  >(null);

  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(0);

  const qcForm = useForm<QCForm>({
    defaultValues: {
      usableWeight: 0,
    },
  });

  const createBoxesForm = useForm<CreateBoxesForm>({
    defaultValues: {
      lotId: 0,
      boxSize: 0,
      boxType: BoxTypeEnum.StyrofoamBox,
    },
  });

  const lotsSorted = useMemo(() => {
    if (!lots) return [];
    return [...lots].sort((a, b) => b.id - a.id);
  }, [lots]);
  const selectedBoxType = createBoxesForm.watch("boxType");

  /** Sau khi phiếu được duyệt và có lot: tạo ảnh QR (qrserver → Cloudinary) rồi PUT API lưu DB. */
  const syncMissingLotQrImages = async () => {
    const lotsRes = await refetchLots();
    const lotList = lotsRes.data ?? [];
    let needQr = lotList.filter((l) => l.lotCode && !l.qrImageUrl);
    const totalNeedQr = needQr.length;
    if (needQr.length === 0) return;
    const qrToast = toast.loading(
      `Đang tạo & lưu ảnh QR cho ${needQr.length} lot...`,
    );
    let { success, failed } = await runWithConcurrency(
      needQr,
      4,
      async (lot) => {
        const url = await uploadQrPayloadToCloudinary(lot.lotCode, {
          folder: "products/lots",
        });
        await updateLotQrImage({
          lotId: lot.id,
          qrImageUrl: url,
        }).unwrap();
      },
    );
    if (failed > 0) {
      const retryRes = await refetchLots();
      needQr = (retryRes.data ?? []).filter((l) => l.lotCode && !l.qrImageUrl);
      if (needQr.length > 0) {
        const retry = await runWithConcurrency(needQr, 2, async (lot) => {
          const url = await uploadQrPayloadToCloudinary(lot.lotCode, {
            folder: "products/lots",
          });
          await updateLotQrImage({
            lotId: lot.id,
            qrImageUrl: url,
          }).unwrap();
        });
        success += retry.success;
        failed = retry.failed;
      }
    }
    if (failed === 0) {
      toast.success(`Đã lưu ảnh QR lot: ${success}/${totalNeedQr}.`, {
        id: qrToast,
      });
    } else if (success > 0) {
      toast.error(
        `Đã lưu ảnh QR lot: ${success}/${totalNeedQr}. ${failed} lot lỗi, vui lòng thử lại.`,
        { id: qrToast },
      );
    } else {
      toast.error(
        "Lưu ảnh QR lot thất bại. Kiểm tra .env Cloudinary (VITE_CLOUDINARY_*).",
        { id: qrToast },
      );
    }
    await refetchLots();
  };

  useEffect(() => {
    if (!lotsSorted || lotsSorted.length === 0) return;
    const currentLotId = createBoxesForm.getValues("lotId");
    const stillExists = lotsSorted.some((l) => l.id === currentLotId);
    if (!currentLotId || currentLotId <= 0 || !stillExists) {
      // auto chọn Lot mới nhất (id lớn nhất)
      createBoxesForm.setValue("lotId", lotsSorted[0].id);
    }
  }, [lotsSorted, createBoxesForm]);

  const statusClass = (status: string) => {
    if (status === "Approved") return "text-emerald-600";
    if (
      status === "PendingManagerApproval" ||
      status === "PendingManagerApprovalQc" ||
      status === "Pending"
    )
      return "text-amber-600";
    if (status === "Rejected") return "text-red-600";
    return "text-slate-600";
  };

  const canQC =
    receipt?.status === "Draft" || receipt?.status === "Received";
  const canApprove =
    receipt?.status === "QCCompleted" || receipt?.status === "PendingManagerApproval";
  const canManagerToleranceAction = receipt?.status === "PendingManagerApproval";
  const canManagerMinWeightAction = receipt?.status === "PendingManagerApprovalQc";
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

  if (Number.isNaN(receiptId) || receiptId < 1) {
    return <Navigate to={basePath} replace />;
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

  const detailsForTable =
    canViewPrice && receiptForApproval?.details?.length
      ? receiptForApproval.details
      : receipt.details;

  const handleOpenQcForDetail = (detailId: number, currentUsable: number) => {
    setSelectedDetailIdForQc(detailId);
    qcForm.reset({
      usableWeight: currentUsable,
    });
  };

  const handleSubmitQc = async (values: QCForm) => {
    if (!selectedDetailIdForQc) {
      toast.error("Vui lòng chọn dòng chi tiết cần kiểm tra chất lượng.");
      return;
    }
    const detail = receipt.details.find((d) => d.id === selectedDetailIdForQc);
    if (!detail) {
      toast.error("Không tìm thấy dòng chi tiết cần kiểm tra chất lượng.");
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
    const toastId = toast.loading(
      "Đang cập nhật kiểm tra chất lượng cho dòng chi tiết..."
    );
    try {
      await qcInspection({
        detailId: selectedDetailIdForQc,
        usableWeight: usable,
      }).unwrap();
      toast.success("Cập nhật kiểm tra chất lượng thành công.", {
        id: toastId,
      });
      setSelectedDetailIdForQc(null);
      await refetch();
      if (canViewPrice) await refetchForApproval();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        "Cập nhật kiểm tra chất lượng thất bại.";
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
      await refetchLots();
      if (canViewPrice) await refetchForApproval();
      await syncMissingLotQrImages();
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
        const firstOther = otherWarehouses[0]?.id ?? 0;
        setSelectedWarehouseId(firstOther);
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

  const handleManagerReviewTolerance = async (approve: boolean) => {
    if (
      !window.confirm(
        approve
          ? "Quản lí xác nhận DUYỆT phiếu nhập vượt dung sai?"
          : "Quản lí xác nhận TỪ CHỐI phiếu nhập vượt dung sai?"
      )
    )
      return;

    const toastId = toast.loading(
      approve ? "Quản lí đang duyệt..." : "Quản lí đang từ chối..."
    );
    try {
      await managerReviewTolerance({ receiptId: receipt.id, approve }).unwrap();
      toast.success(
        approve
          ? "Quản lí duyệt thành công."
          : "Quản lí từ chối thành công.",
        { id: toastId }
      );
      await refetch();
      if (canViewPrice) await refetchForApproval();
      if (approve) await syncMissingLotQrImages();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Quản lí xử lý thất bại.";
      toast.error(msg, { id: toastId });
    }
  };

  const handleManagerReviewMinWeight = async (approve: boolean) => {
    if (
      !window.confirm(
        approve
          ? "Quản lí cho phép tiếp tục kiểm tra chất lượng/Approve (ngoại lệ định mức tối thiểu)?"
          : "Quản lí xác nhận TỪ CHỐI phiếu do dưới định mức tối thiểu?"
      )
    )
      return;

    const toastId = toast.loading(
      approve ? "Quản lí đang xử lý..." : "Quản lí đang từ chối..."
    );
    try {
      await managerReviewMin({ receiptId: receipt.id, approve }).unwrap();
      toast.success("Đã xử lý phiếu theo quyết định Quản lí.", {
        id: toastId,
      });
      await refetch();
      if (canViewPrice) await refetchForApproval();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Quản lí xử lý thất bại.";
      toast.error(msg, { id: toastId });
    }
  };

  const handleManagerAllowQc = async () => {
    if (
      !window.confirm(
        "Quản lí cho phép quay lại bước kiểm tra chất lượng?"
      )
    )
      return;
    const toastId = toast.loading(
      "Đang cập nhật trạng thái để kiểm tra chất lượng tiếp..."
    );
    try {
      await managerAllowQc(receipt.id).unwrap();
      toast.success("Đã cho phép tiếp tục kiểm tra chất lượng.", {
        id: toastId,
      });
      await refetch();
      if (canViewPrice) await refetchForApproval();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        "Không thể cho phép kiểm tra chất lượng tiếp.";
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
    if (Number(values.boxType) === BoxTypeEnum.Unknown) {
      toast.error("Vui lòng chọn BoxType khác Unknown khi tạo box.");
      return;
    }

    const toastId = toast.loading("Đang tạo box cho lot...");
    try {
      const created = await createBoxes({
        lotId: Number(values.lotId),
        boxSize: Number(values.boxSize),
        boxType: values.boxType,
      }).unwrap();
      toast.success("Tạo box thành công.", { id: toastId });
      createBoxesForm.reset({
        lotId: 0,
        boxSize: 0,
        boxType: BoxTypeEnum.StyrofoamBox,
      });

      if (created.boxes?.length) {
        const qrToast = toast.loading(
          `Đang tạo & lưu ảnh QR cho ${created.boxes.length} box...`,
        );
        const { success, failed } = await runWithConcurrency(
          created.boxes,
          6,
          async (b) => {
            const payload = b.qrPayload || b.boxCode;
            const url = await uploadQrPayloadToCloudinary(payload, {
              folder: "products/boxes",
            });
            await updateBoxQrImage({
              boxId: b.id,
              qrImageUrl: url,
            }).unwrap();
          },
        );
        if (failed === 0) {
          toast.success(`Đã lưu ảnh QR box: ${success}/${created.boxes.length}.`, {
            id: qrToast,
          });
        } else if (success > 0) {
          toast.error(
            `Đã lưu ảnh QR box: ${success}/${created.boxes.length}. ${failed} box lỗi, vui lòng thử lại.`,
            { id: qrToast },
          );
        } else {
          toast.error(
            "Tạo box xong nhưng lưu ảnh QR thất bại. Kiểm tra .env Cloudinary.",
            { id: qrToast },
          );
        }
      }
      await refetchReceiptBoxes();
      await syncMissingLotQrImages();
      // Sau khi tạo box thành công, quay về danh sách phiếu nhập
      setTimeout(() => {
        navigate(basePath);
      }, 600);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.Error ||
        err?.data?.detail ||
        err?.data?.Detail ||
        (typeof err?.data === "string" ? err.data : null) ||
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
            onClick={() => navigate(`${basePath}/${receipt.id}`)}
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Bước 2 · Kiểm tra chất lượng & duyệt phiếu nhập ·{" "}
              {receipt.receiptCode}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {receipt.supplierName} · {receipt.warehouseName} ·{" "}
              <span className={statusClass(receipt.status)}>
                {toVietnameseReceiptStatus(receipt.status)}
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
                Khối lượng dùng được / nhận
              </span>
              <p className="font-medium text-slate-900 mt-1">
                {receipt.totalUsableWeight} kg /{" "}
                <span className="font-semibold">
                  {receipt.totalReceivedWeight} kg
                </span>
              </p>
            </div>
          </div>
          <div className="px-6 py-3 border-t border-slate-100 space-y-1.5">
            <p className="text-xs font-semibold text-slate-600">
              Bước 3 · Duyệt phiếu / Quản lí duyệt
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Trạng thái hiện tại:{" "}
                <span className={statusClass(receipt.status)}>
                  {toVietnameseReceiptStatus(receipt.status)}
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
                {canManagerToleranceAction && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleManagerReviewTolerance(true)}
                      disabled={isManagerReviewingTolerance}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white px-3 py-1.5 disabled:opacity-60"
                    >
                      {isManagerReviewingTolerance && (
                        <Loader2 size={12} className="animate-spin" />
                      )}
                      Quản lí duyệt (dung sai)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleManagerReviewTolerance(false)}
                      disabled={isManagerReviewingTolerance}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white px-3 py-1.5 disabled:opacity-60"
                    >
                      {isManagerReviewingTolerance && (
                        <Loader2 size={12} className="animate-spin" />
                      )}
                      Quản lí từ chối
                    </button>
                  </>
                )}

                {canManagerMinWeightAction && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleManagerReviewMinWeight(true)}
                      disabled={isManagerReviewingMin}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white px-3 py-1.5 disabled:opacity-60"
                    >
                      {isManagerReviewingMin && (
                        <Loader2 size={12} className="animate-spin" />
                      )}
                      Cho phép kiểm tra chất lượng tiếp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleManagerReviewMinWeight(false)}
                      disabled={isManagerReviewingMin}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white px-3 py-1.5 disabled:opacity-60"
                    >
                      {isManagerReviewingMin && (
                        <Loader2 size={12} className="animate-spin" />
                      )}
                      Từ chối
                    </button>
                  </>
                )}

                {/* Trường hợp đặc biệt: cho phép quay lại kiểm tra chất lượng khi đang PendingManagerApproval */}
                {canManagerToleranceAction && (
                  <button
                    type="button"
                    onClick={handleManagerAllowQc}
                    disabled={isManagerAllowingQc}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {isManagerAllowingQc && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    Cho phép kiểm tra chất lượng lại
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Kiểm tra chất lượng table + form */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Bước 2 · Kiểm tra chất lượng dòng chi tiết phiếu nhập
              </h2>
              {!canQC && (
                <p className="text-[11px] text-slate-400">
                  Kiểm tra chất lượng chỉ thực hiện trước khi phiếu được duyệt / tạo box.
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
                        Đơn giá(VNĐ)
                      </th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Thành tiền(VNĐ)
                      </th>
                    </>
                  )}
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    KL nhận (KG)
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    KL dùng được (KG)
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    KL loại (KG)
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Kết quả kiểm tra chất lượng
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
                              ? moneyFmt.format(Number(d.unitPrice))
                              : "—"}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-700 tabular-nums">
                            {d.unitPrice != null
                              ? moneyFmt.format(
                                  Number(d.unitPrice) * Number(d.receivedWeight),
                                )
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
                        {toVietnameseQcResult(d.qcResult)}
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
                            Kiểm tra chất lượng dòng
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Đã khoá kiểm tra chất lượng
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Kiểm tra chất lượng form */}
          {selectedDetailIdForQc && canQC && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <h3 className="text-xs font-semibold text-slate-800 mb-3">
                Kiểm tra chất lượng cho dòng chi tiết #{selectedDetailIdForQc}
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
                    Lưu kiểm tra chất lượng
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
                className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm items-end"
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
                      lotsSorted.map((lot) => (
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
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Loại box
                  </label>
                  <select
                    {...createBoxesForm.register("boxType", {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                  >
                    <option value={BoxTypeEnum.StyrofoamBox}>Thùng xốp</option>
                    <option value={BoxTypeEnum.Carton}>Thùng carton</option>
                    <option value={BoxTypeEnum.MeshBag}>Bao lưới</option>
                    <option value={BoxTypeEnum.Crate}>Sọt</option>
                  </select>
                  {Number(selectedBoxType) === BoxTypeEnum.Unknown && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      BoxType không được để Unknown.
                    </p>
                  )}
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

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-800">
                    Danh sách QR box theo phiếu nhập
                  </h4>
                  {isFetchingReceiptBoxes ? (
                    <span className="text-[11px] text-slate-500">
                      Đang cập nhật...
                    </span>
                  ) : null}
                </div>

                {receiptBoxes.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Chưa có box nào cho phiếu nhập này.
                  </p>
                ) : (
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">
                            Box
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">
                            Lot
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-500 uppercase tracking-wider">
                            KL (kg)
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">
                            Vị trí
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">
                            QR ảnh
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {boxesPaged.map((b) => (
                          <tr key={b.id} className="border-t border-slate-100">
                            <td className="px-3 py-2 text-slate-800 font-medium">
                              {b.boxCode}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {b.lotCode ?? `#${b.lotId}`}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700">
                              {b.weight}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {b.slotCode ?? "Chưa xếp slot"}
                            </td>
                            <td className="px-3 py-2">
                              {b.qrImageUrl ? (
                                <a
                                  href={b.qrImageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2"
                                  title={`Mở QR ${b.boxCode}`}
                                >
                                  <img
                                    src={b.qrImageUrl}
                                    alt={`QR ${b.boxCode}`}
                                    className="h-10 w-10 rounded border border-slate-200 bg-white object-contain"
                                  />
                                  <span className="text-[11px] font-medium text-emerald-700">
                                    Xem QR
                                  </span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  Chưa có ảnh QR
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination controls */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500">
                        Hiển thị{" "}
                        <span className="font-semibold text-slate-700">
                          {(safeBoxesPage - 1) * boxesPageSize + 1}
                        </span>{" "}
                        -{" "}
                        <span className="font-semibold text-slate-700">
                          {Math.min(safeBoxesPage * boxesPageSize, receiptBoxes.length)}
                        </span>{" "}
                        / {receiptBoxes.length} box
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={boxesPageSize}
                          onChange={(e) => {
                            setBoxesPageSize(Number(e.target.value));
                            setBoxesPage(1);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700"
                        >
                          <option value={10}>10 / trang</option>
                          <option value={20}>20 / trang</option>
                          <option value={50}>50 / trang</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setBoxesPage((p) => Math.max(1, p - 1))}
                          disabled={safeBoxesPage <= 1}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Trước
                        </button>
                        <span className="text-[11px] text-slate-600">
                          Trang {safeBoxesPage}/{boxesTotalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setBoxesPage((p) =>
                              Math.min(boxesTotalPages, p + 1),
                            )
                          }
                          disabled={safeBoxesPage >= boxesTotalPages}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                  {otherWarehouses.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Hiện không có kho nào khác để chuyển. Vui lòng liên hệ quản trị
                      để tạo thêm kho hoặc giải phóng dung lượng kho hiện tại.
                    </p>
                  ) : (
                    <>
                      <select
                        value={selectedWarehouseId || ""}
                        onChange={(e) =>
                          setSelectedWarehouseId(Number(e.target.value))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                      >
                        <option value="">Chọn kho</option>
                        {otherWarehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            #{w.id} · {w.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Lưu ý: BE sẽ kiểm tra lại dung lượng kho mới khi duyệt.
                      </p>
                    </>
                  )}
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
                  disabled={isUpdatingWarehouse || otherWarehouses.length === 0}
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

