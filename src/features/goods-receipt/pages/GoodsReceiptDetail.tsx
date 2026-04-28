import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetGoodsReceiptByIdQuery,
  useGetGoodsReceiptForApprovalByIdQuery,
  useApproveGoodsReceiptMutation,
} from "../api/goods-receipt.api";
import { useGetPurchaseOrderStructuredByIdQuery } from "../../purchase-order/api/purchase-order.api";
import { ArrowLeft, Loader2, FileDown, Package } from "lucide-react";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";
import toast from "react-hot-toast";

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

export default function GoodsReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const receiptId = id ? Number(id) : 0;

  const { isAdmin, isManager, isWarehouseStaff } = useRoleGuard();
  const canReviewApprovalStage = isAdmin() || isManager();
  const basePath = isWarehouseStaff()
    ? "/warehouse/goods-receipts"
    : isManager()
      ? "/manager/goods-receipts"
      : "/admin/goods-receipts";
  const canViewPrice = isAdmin() || isManager();
  const printPath = `${basePath}/print?receiptId=${receiptId}&preview=true`;

  const {
    data: receipt,
    isLoading,
    error,
    refetch,
  } = useGetGoodsReceiptByIdQuery(receiptId, {
    skip: !receiptId || Number.isNaN(receiptId),
  });
  const [approveReceipt, { isLoading: isApprovingReceipt }] =
    useApproveGoodsReceiptMutation();

  const {
    data: receiptForApproval,
  } = useGetGoodsReceiptForApprovalByIdQuery(receiptId, {
    skip: !canViewPrice || !receiptId || Number.isNaN(receiptId),
  });
  const { data: purchaseOrderStructured } = useGetPurchaseOrderStructuredByIdQuery(
    receipt?.purchaseOrderId ?? 0,
    {
      skip:
        !receipt?.purchaseOrderId ||
        !canViewPrice ||
        !receiptId ||
        Number.isNaN(receiptId),
    },
  );

  const detailsForTable =
    canViewPrice && receiptForApproval?.details?.length
      ? receiptForApproval.details
      : receipt?.details ?? [];

  const moneyFmt = useMemo(
    () => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }),
    [],
  );
  const supplierSections = useMemo(() => {
    if (!purchaseOrderStructured?.supplierPlans?.length || !detailsForTable.length) {
      return [];
    }

    const detailBySupplierPlanDetailId = new Map(
      detailsForTable
        .filter((d) => d.supplierPlanDetailId != null)
        .map((d) => [d.supplierPlanDetailId as number, d]),
    );
    const matchedDetailIds = new Set<number>();

    const sections = purchaseOrderStructured.supplierPlans
      .map((plan) => {
        const lines = plan.details
          .map((planLine) => {
            if (planLine.supplierPlanDetailId == null) return null;
            const matched = detailBySupplierPlanDetailId.get(planLine.supplierPlanDetailId);
            if (!matched) return null;
            matchedDetailIds.add(matched.id);
            return matched;
          })
          .filter((x): x is (typeof detailsForTable)[number] => x != null);

        if (!lines.length) return null;

        return {
          supplierPlanId: plan.supplierPlanId,
          supplierName: plan.supplier.supplierName,
          lines,
        };
      })
      .filter(
        (
          section,
        ): section is {
          supplierPlanId: number;
          supplierName: string;
          lines: (typeof detailsForTable)[number][];
        } => section != null,
      );

    const unassignedLines = detailsForTable.filter((d) => !matchedDetailIds.has(d.id));
    if (unassignedLines.length > 0) {
      sections.push({
        supplierPlanId: -1,
        supplierName: "Dòng chưa ghép NCC",
        lines: unassignedLines,
      });
    }

    return sections;
  }, [detailsForTable, purchaseOrderStructured]);

  if (Number.isNaN(receiptId) || receiptId < 1) {
    navigate(basePath);
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
  const canOpenQcScreen = isWarehouseStaff() && receipt.status === "Received";

  const managerQcNav = (() => {
    if (!canReviewApprovalStage) return null;
    const s = receipt.status;
    if (s === "Approved") return null;
    if (s === "Draft") {
      return {
        label: "Duyệt phiếu",
        disabled: false,
        title:
          "Duyệt phiếu để chuyển sang Đã nhận và cho phép nhân viên kho kiểm tra chất lượng.",
      } as const;
    }
    if (s === "Received") {
      return {
        label: "Mở màn kiểm tra chất lượng",
        disabled: false,
        title:
          "Bước 1 đã duyệt. Nhân viên kho thực hiện kiểm tra chất lượng tại đây; sau khi QC xong bạn quay lại để duyệt bước 2.",
      } as const;
    }
    if (
      s === "QCCompleted" ||
      s === "PendingManagerApproval" ||
      s === "PendingManagerApprovalQc"
    ) {
      return {
        label: "Mở màn kiểm tra chất lượng",
        disabled: false,
        title: "Theo dõi kiểm tra chất lượng và xử lý ngoại lệ nếu có.",
      } as const;
    }
    return {
      label: "Mở màn kiểm tra chất lượng & duyệt",
      disabled: false,
      title: undefined,
    } as const;
  })();

  const handleManagerOpenQc = async () => {
    if (!managerQcNav?.disabled && receipt.status === "Draft") {
      const toastId = toast.loading("Đang duyệt phiếu...");
      try {
        await approveReceipt(receipt.id).unwrap();
        await refetch();
        toast.success("Duyệt phiếu thành công.", { id: toastId });
        navigate(`${basePath}/${receipt.id}/qc`);
      } catch (err: any) {
        const msg =
          err?.data?.message ||
          err?.data?.error ||
          "Duyệt phiếu thất bại.";
        toast.error(msg, { id: toastId });
      }
      return;
    }
    if (!managerQcNav?.disabled) {
      navigate(`${basePath}/${receipt.id}/qc`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="mb-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(basePath)}
              className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Chi tiết phiếu nhập · {receipt.receiptCode}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {receipt.supplierName} · {receipt.warehouseName} ·{" "}
                <span className={statusClass(receipt.status)}>
                  {toVietnameseReceiptStatus(receipt.status)}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canViewPrice && (
              <button
                type="button"
                onClick={() => window.open(printPath, "_blank", "noopener,noreferrer")}
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
              >
                <FileDown size={14} />
                Xuất PDF phiếu nhập
              </button>
            )}
            {(isWarehouseStaff() || canViewPrice) && receipt.status === "Approved" && (
              <button
                type="button"
                onClick={() => navigate(`${basePath}/${receipt.id}/qc`)}
                title="Chia tạo thùng theo lô, loại thùng và kích cỡ — cùng màn kiểm tra chất lượng."
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <Package size={14} />
                Mở màn tạo thùng
              </button>
            )}
            {managerQcNav && (
              <button
                type="button"
                onClick={handleManagerOpenQc}
                disabled={managerQcNav.disabled || isApprovingReceipt}
                title={managerQcNav.title}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-default disabled:opacity-60"
              >
                {isApprovingReceipt ? "Đang duyệt..." : managerQcNav.label}
              </button>
            )}
            {isWarehouseStaff() && receipt.status !== "Approved" && (
              <button
                type="button"
                onClick={() => navigate(`${basePath}/${receipt.id}/qc`)}
                disabled={!canOpenQcScreen}
                title={!canOpenQcScreen ? "Phiếu cần được duyệt bước 1 trước khi kiểm tra chất lượng." : undefined}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {canOpenQcScreen
                  ? "Mở màn kiểm tra chất lượng"
                  : "Chờ duyệt phiếu"}
              </button>
            )}
          </div>
        </div>

        {/* Summary card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-3 py-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm sm:px-4 sm:py-4 lg:px-6">
            <div>
              <span className="text-slate-500 block text-xs font-medium">
                Nhà cung cấp
              </span>
              <p className="font-medium text-slate-900 mt-1">
                {receipt.supplierName || "—"}
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">
                Kho
              </span>
              <p className="font-medium text-slate-900 mt-1">
                {receipt.warehouseName || "—"}
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">
                Người tạo phiếu
              </span>
              <p className="font-medium text-slate-900 mt-1">
                {receipt.createdByName || "—"}
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">
                Trạng thái
              </span>
              <p className="font-medium text-slate-900 mt-1">
                <span className={statusClass(receipt.status)}>
                  {toVietnameseReceiptStatus(receipt.status)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bảng chi tiết (chỉ đọc) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">
              Dòng chi tiết phiếu nhập
            </h2>
          </div>
          {canViewPrice && supplierSections.length > 0 && (
            <div className="px-3 py-3 border-b border-slate-100 space-y-3 bg-slate-50/40 sm:px-4 sm:py-4 lg:px-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nhóm theo nhà cung cấp
              </h3>
              <div className="space-y-2">
                {supplierSections.map((section) => (
                  <div
                    key={`${section.supplierPlanId}-${section.supplierName}`}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {section.supplierName}
                    </p>
                    <div className="mt-2 space-y-1">
                      {section.lines.map((line) => (
                        <div
                          key={line.id}
                          className="flex items-center justify-between gap-3 text-xs text-slate-600"
                        >
                          <span className="text-slate-700">{line.productName}</span>
                          <span className="tabular-nums">
                            {line.receivedWeight} kg
                            {line.unitPrice != null
                              ? ` · ${moneyFmt.format(
                                  Number(line.unitPrice) * Number(line.receivedWeight),
                                )} đ`
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
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
                    KL nhận
                  </th>
                </tr>
              </thead>
              <tbody>
                {detailsForTable.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canViewPrice ? 4 : 2}
                      className="px-5 py-6 text-center text-slate-500 text-sm"
                    >
                      Phiếu hiện chưa có dòng chi tiết nào.
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
                            {d.unitPrice != null ? (
                              <>
                                {moneyFmt.format(Number(d.unitPrice))}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-700 tabular-nums">
                            {d.unitPrice != null ? (
                              <>
                                {moneyFmt.format(
                                  Number(d.unitPrice) * Number(d.receivedWeight),
                                )}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-5 py-3 text-right text-slate-700">
                        {d.receivedWeight}
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

