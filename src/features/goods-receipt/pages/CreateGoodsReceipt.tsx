import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Truck, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { useGetWarehousesQuery } from "../../admin/api/create-user.api";
import { useGetPurchaseOrdersQuery } from "../../purchase-order/api/purchase-order.api";
import { useGetPurchaseOrderByIdQuery } from "../../purchase-order/api/purchase-order.api";
import { useGetPurchaseOrderStructuredByIdQuery } from "../../purchase-order/api/purchase-order.api";
import { useCreateGoodsReceiptMutation } from "../api/goods-receipt.api";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";

const Schema = z
  .object({
    warehouseId: z.number().min(1, "Vui lòng chọn kho."),
    vehicleNumber: z
      .string()
      .trim()
      .min(1, "Biển số xe không được để trống.")
      .max(50),
    driverName: z
      .string()
      .trim()
      .min(1, "Tên tài xế không được để trống.")
      .max(100),
    transportCompany: z
      .string()
      .trim()
      .min(1, "Đơn vị vận chuyển không được để trống.")
      .max(100, "Tên công ty vận chuyển tối đa 100 ký tự."),
    purchaseOrderId: z.number().min(1, "Vui lòng chọn đơn mua."),
  });

type FormValues = z.infer<typeof Schema>;

type ReceiptLine = {
  purchaseOrderDetailId: number;
  supplierPlanDetailId?: number;
  productName: string;
  orderedWeight: number;
  remainingWeight: number;
  unitPriceAtOrder?: number;
  priceDate?: string;
  receivedWeight: number;
};

type SupplierCard = {
  supplierId: number;
  supplierName: string;
  orderDate?: string;
  supplierPlanId?: number;
  lines: ReceiptLine[];
};

export default function CreateGoodsReceipt() {
  const navigate = useNavigate();
  const { isAdmin, isManager, isWarehouseStaff } = useRoleGuard();
  const isPrivilegedCreator = isAdmin() || isManager();
  const basePath = isWarehouseStaff()
    ? "/warehouse/goods-receipts"
    : isManager()
      ? "/manager/goods-receipts"
      : "/admin/goods-receipts";
  const {
    data: warehouses = [],
    isLoading: isLoadingWarehouses,
    isError: isWarehousesError,
  } = useGetWarehousesQuery();
  const { data: purchaseOrders = [] } = useGetPurchaseOrdersQuery();
  const [createReceipt, { isLoading }] = useCreateGoodsReceiptMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    mode: "onChange",
    defaultValues: {
      warehouseId: 0,
      vehicleNumber: "",
      driverName: "",
      transportCompany: "",
      purchaseOrderId: 0,
    },
  });

  const watchedPurchaseOrderId = form.watch("purchaseOrderId");
  const watchedWarehouseId = form.watch("warehouseId");

  const selectedPo = purchaseOrders.find((po) => po.id === watchedPurchaseOrderId);

  const [supplierCards, setSupplierCards] = useState<SupplierCard[]>([]);

  const {
    data: purchaseOrderForDetails,
    isLoading: isLoadingPoDetails,
  } = useGetPurchaseOrderByIdQuery(watchedPurchaseOrderId, {
    skip: !watchedPurchaseOrderId || Number.isNaN(watchedPurchaseOrderId),
  });
  const { data: purchaseOrderStructuredForDetails } = useGetPurchaseOrderStructuredByIdQuery(
    watchedPurchaseOrderId,
    {
      skip: !watchedPurchaseOrderId || Number.isNaN(watchedPurchaseOrderId),
    },
  );

  useEffect(() => {
    setSupplierCards([]);
  }, [watchedPurchaseOrderId]);

  const procurementMode = purchaseOrderStructuredForDetails?.procurement?.mode ?? selectedPo?.procurementMode;
  const isMultiSupplier = procurementMode === "MultiSupplierStrictReceipt";

  useEffect(() => {
    if (!watchedPurchaseOrderId || watchedPurchaseOrderId <= 0) return;
    const structuredPlans = purchaseOrderStructuredForDetails?.supplierPlans ?? [];
    if (structuredPlans.length > 0) {
      const mapped: SupplierCard[] = structuredPlans.map((plan) => ({
        supplierId: plan.supplier.supplierId,
        supplierName: plan.supplier.supplierName,
        orderDate: plan.orderDate,
        supplierPlanId: plan.supplierPlanId,
        lines: (plan.details ?? []).map((line) => {
          const oldDetail = purchaseOrderForDetails?.details?.find((d) => d.id === line.lineId);
          const ordered = Number(line.orderedWeight ?? 0);
          return {
            purchaseOrderDetailId: line.lineId,
            supplierPlanDetailId:
              plan.supplierPlanId > 0
                ? (line.supplierPlanDetailId ?? undefined)
                : undefined,
            productName: line.productName,
            orderedWeight: ordered,
            remainingWeight: Number(oldDetail?.remainingWeight ?? ordered),
            unitPriceAtOrder: Number(line.unitPriceAtOrder ?? 0),
            priceDate: line.priceDate,
            receivedWeight: isMultiSupplier ? ordered : Number(oldDetail?.remainingWeight ?? 0),
          };
        }),
      }));
      setSupplierCards(mapped);
      return;
    }

    const legacyDetails = purchaseOrderForDetails?.details ?? [];
    if (legacyDetails.length > 0) {
      setSupplierCards([
        {
          supplierId: selectedPo?.supplierId ?? 0,
          supplierName: selectedPo?.supplierName ?? "Không xác định",
          orderDate: selectedPo?.orderDate,
          lines: legacyDetails.map((d) => ({
            purchaseOrderDetailId: d.id,
            supplierPlanDetailId: undefined,
            productName: d.productName,
            orderedWeight: Number(d.orderedWeight ?? 0),
            remainingWeight: Number(d.remainingWeight ?? d.orderedWeight ?? 0),
            unitPriceAtOrder: Number(d.unitPrice ?? 0),
            priceDate: selectedPo?.orderDate,
            receivedWeight: Number(d.remainingWeight ?? 0),
          })),
        },
      ]);
    }
  }, [
    watchedPurchaseOrderId,
    purchaseOrderStructuredForDetails,
    purchaseOrderForDetails,
    selectedPo,
    isMultiSupplier,
  ]);

  const selectedWarehouse = useMemo(
    () => warehouses.find((w) => w.id === watchedWarehouseId),
    [warehouses, watchedWarehouseId],
  );
  const MAX_WAREHOUSE_UTILIZATION = 0.8;

  const occupiedWeightOfWarehouse = useMemo(() => {
    if (!selectedWarehouse) return 0;
    return Number(selectedWarehouse.storedInSlotsWeight ?? 0) +
      Number(selectedWarehouse.unassignedStockWeight ?? 0);
  }, [selectedWarehouse]);

  const totalCapacityOfWarehouse =
    Number(selectedWarehouse?.totalCapacity ?? 0) * MAX_WAREHOUSE_UTILIZATION;
  const remainingCapacityOfWarehouse = Math.max(
    0,
    totalCapacityOfWarehouse - occupiedWeightOfWarehouse,
  );

  const totalIncomingWeight = useMemo(
    () =>
      supplierCards
        .flatMap((card) => card.lines)
        .reduce((sum, line) => sum + Number(line.receivedWeight ?? 0), 0),
    [supplierCards],
  );

  const cardSummaries = useMemo(() => {
    return supplierCards.map((card) => {
      const totalOrdered = card.lines.reduce((sum, x) => sum + Number(x.orderedWeight ?? 0), 0);
      const totalReceived = card.lines.reduce((sum, x) => sum + Number(x.receivedWeight ?? 0), 0);
      const validLines = card.lines.filter((line) => {
        if (isMultiSupplier) return Math.abs(line.receivedWeight - line.orderedWeight) <= 0.0001;
        return line.receivedWeight > 0 && line.receivedWeight <= line.remainingWeight;
      }).length;
      const isValidCard = validLines === card.lines.length && card.lines.length > 0;
      return { ...card, totalOrdered, totalReceived, validLines, isValidCard };
    });
  }, [supplierCards, isMultiSupplier]);

  const isMultiFormValid = useMemo(
    () =>
      cardSummaries.length > 0 &&
      cardSummaries.every((c) => c.isValidCard) &&
      cardSummaries.every((c) => c.lines.every((l) => l.supplierPlanDetailId != null)),
    [cardSummaries],
  );

  const hasLegacyAtLeastOneLine = useMemo(
    () => cardSummaries.some((c) => c.lines.some((l) => l.receivedWeight > 0)),
    [cardSummaries],
  );

  const canSubmit = isMultiSupplier ? isMultiFormValid : hasLegacyAtLeastOneLine;

  const updateLineWeight = (supplierId: number, purchaseOrderDetailId: number, value: number) => {
    setSupplierCards((prev) =>
      prev.map((card) =>
        card.supplierId !== supplierId
          ? card
          : {
              ...card,
              lines: card.lines.map((line) =>
                line.purchaseOrderDetailId === purchaseOrderDetailId
                  ? { ...line, receivedWeight: Number.isNaN(value) ? 0 : value }
                  : line,
              ),
            },
      ),
    );
  };

  const onSubmit = async (values: FormValues) => {
    setServerMessage(null);
    const toastId = toast.loading("Đang tạo phiếu nhập kho...");
    try {
      const allLines = supplierCards.flatMap((c) => c.lines.map((l) => ({ ...l, supplierId: c.supplierId })));
      const submitLines = isMultiSupplier
        ? allLines
        : allLines.filter((l) => l.receivedWeight > 0);
      if (submitLines.length === 0) throw new Error("Vui lòng nhập khối lượng nhận cho ít nhất 1 dòng.");
      if (isMultiSupplier && !isMultiFormValid) {
        throw new Error("Đơn đa NCC chưa hợp lệ. Vui lòng kiểm tra tất cả card NCC và các dòng nhận đủ.");
      }

      const result = await createReceipt({
        warehouseId: values.warehouseId,
        vehicleNumber: values.vehicleNumber.trim(),
        driverName: values.driverName.trim(),
        transportCompany: values.transportCompany?.trim() || undefined,
        purchaseOrderId: values.purchaseOrderId,
        details: submitLines.map((d) => ({
          purchaseOrderDetailId: d.purchaseOrderDetailId,
          supplierPlanDetailId: d.supplierPlanDetailId,
          receivedWeight: d.receivedWeight,
        })),
      }).unwrap();

      const successMsg =
        "Tạo phiếu nhập thành công. Đang chuyển sang màn chi tiết phiếu.";
      toast.success(successMsg, { id: toastId });
      setServerMessage(successMsg);

      setTimeout(() => {
        if (result?.receiptId) {
          navigate(`${basePath}/${result.receiptId}`);
        } else {
          navigate(basePath);
        }
      }, 600);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "Tạo phiếu nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      toast.error(msg, { id: toastId });
      setServerMessage(msg);
    }
  };

  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    if (po.status !== "Approved") return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-5 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Tạo phiếu nhập kho
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhập thông tin xe, nhà cung cấp, kho và đơn mua liên quan.
            </p>
            <p className="text-xs text-slate-600 mt-2 max-w-xl leading-relaxed">
              {isPrivilegedCreator ? (
                <>
                  <span className="font-medium text-slate-800">Admin / Quản lý:</span>{" "}
                  phiếu tạo xong sẽ bỏ qua duyệt bước 1 (sang trạng thái Đã nhận để
                  kiểm tra chất lượng), nhưng vẫn phải QC và duyệt nhập kho (bước 2)
                  như phiếu do kho tạo.
                </>
              ) : (
                <>
                  <span className="font-medium text-slate-800">Nhân viên kho:</span>{" "}
                  phiếu mới ở trạng thái Nháp; cần Admin/Quản lý duyệt bước 1 trước
                  khi kiểm tra chất lượng. Sau khi QC xong vẫn cần duyệt bước 2 để
                  nhập kho.
                </>
              )}
            </p>
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Đơn mua liên quan */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-sm">
                <FileText size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                Liên kết đơn mua hàng
              </span>
            </div>
            <div className="p-6 text-sm space-y-3">
              <p className="text-xs text-slate-500">
                Chỉ hiển thị các đơn mua đã được duyệt (Approved). Khi chọn đơn mua,
                hệ thống sẽ tự điền nhà cung cấp tương ứng.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Đơn mua hàng *
                </label>
                <select
                  {...form.register("purchaseOrderId", { valueAsNumber: true })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                >
                  <option value={0}>
                    Chọn đơn mua đã duyệt
                  </option>
                  {filteredPurchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.orderCode} — {po.supplierName} (
                      {po.orderDate
                        ? new Date(po.orderDate).toLocaleDateString("vi-VN")
                        : "-"}
                      )
                    </option>
                  ))}
                </select>
                {form.formState.errors.purchaseOrderId && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {form.formState.errors.purchaseOrderId.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Nhà cung cấp & chi tiết hàng nhập */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                <FileText size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                Nhà cung cấp & chi tiết hàng nhập
              </span>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <p className="text-xs text-slate-500">
                {isMultiSupplier
                  ? "PO đa NCC: mỗi NCC là một card riêng, các dòng nhận phải theo đúng kế hoạch NCC."
                  : "PO 1 NCC: hiển thị 1 card NCC, bạn có thể điều chỉnh khối lượng nhận theo rule luồng cũ."}
              </p>

              {watchedPurchaseOrderId <= 0 && (
                <p className="text-xs text-slate-500">
                  Vui lòng chọn đơn mua trước để thêm dòng chi tiết.
                </p>
              )}

              {watchedPurchaseOrderId > 0 && isLoadingPoDetails && (
                <p className="text-xs text-slate-500">Đang tải chi tiết đơn mua...</p>
              )}

              {watchedPurchaseOrderId > 0 && !isLoadingPoDetails && (
                <div className="space-y-4">
                  {cardSummaries.map((card) => (
                    <div key={`${card.supplierId}-${card.supplierPlanId ?? "legacy"}`} className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{card.supplierName}</p>
                          <p className="text-xs text-slate-500">
                            Ngày đặt: {card.orderDate ? new Date(card.orderDate).toLocaleDateString("vi-VN") : "-"} ·
                            Số dòng: {card.lines.length} ·
                            Tổng KL đặt: {card.totalOrdered.toLocaleString("vi-VN")} kg
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            card.isValidCard ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {card.isValidCard ? "Hợp lệ" : "Chưa đủ điều kiện"}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sản phẩm</th>
                              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">KL đặt</th>
                              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Đơn giá</th>
                              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ngày giá</th>
                              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">KL nhận</th>
                              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {card.lines.map((line) => {
                              const lineValid = isMultiSupplier
                                ? Math.abs(line.receivedWeight - line.orderedWeight) <= 0.0001
                                : line.receivedWeight > 0 && line.receivedWeight <= line.remainingWeight;
                              return (
                                <tr key={line.purchaseOrderDetailId} className="border-b border-slate-100">
                                  <td className="px-3 py-2.5 text-slate-800">{line.productName}</td>
                                  <td className="px-3 py-2.5 text-right text-slate-700">{line.orderedWeight}</td>
                                  <td className="px-3 py-2.5 text-right text-slate-700">
                                    {(line.unitPriceAtOrder ?? 0).toLocaleString("vi-VN")}
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-slate-600">
                                    {line.priceDate ? new Date(line.priceDate).toLocaleDateString("vi-VN") : "-"}
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min={0}
                                      value={line.receivedWeight}
                                      onChange={(e) =>
                                        updateLineWeight(
                                          card.supplierId,
                                          line.purchaseOrderDetailId,
                                          Number(e.target.value),
                                        )
                                      }
                                      className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <span className={`text-xs font-medium ${lineValid ? "text-emerald-700" : "text-amber-700"}`}>
                                      {lineValid ? "Đủ điều kiện" : isMultiSupplier ? "Phải nhận đủ" : "Chưa hợp lệ"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between text-xs">
                        <p className="text-slate-600">
                          Tổng KL đặt: <span className="font-semibold text-slate-900">{card.totalOrdered.toLocaleString("vi-VN")} kg</span>
                        </p>
                        <p className="text-slate-600">
                          Tổng KL nhận: <span className="font-semibold text-slate-900">{card.totalReceived.toLocaleString("vi-VN")} kg</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Kho nhập */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                <Truck size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Kho nhập</span>
            </div>
            <div className="p-6 text-sm">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Kho nhập *
              </label>
              <select
                {...form.register("warehouseId", { valueAsNumber: true })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                disabled={isLoadingWarehouses || isWarehousesError}
              >
                <option value={0}>
                  {isLoadingWarehouses
                    ? "Đang tải danh sách kho..."
                    : "Chọn kho"}
                </option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.warehouseId && (
                <p className="text-[11px] text-red-500 mt-1">
                  {form.formState.errors.warehouseId.message}
                </p>
              )}
              {!isWarehousesError && selectedWarehouse && (
                <div className="mt-2 space-y-1">
                  <p className="text-[11px] text-slate-500">
                    Đang chứa: {occupiedWeightOfWarehouse.toLocaleString("vi-VN")} /{" "}
                    {totalCapacityOfWarehouse.toLocaleString("vi-VN")} m³ (80%)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Còn trống: {remainingCapacityOfWarehouse.toLocaleString("vi-VN")} m³ ·
                    Phiếu này (tổng khối lượng nhận): {totalIncomingWeight.toLocaleString("vi-VN")} kg
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Thông tin vận chuyển */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                <Truck size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                Thông tin vận chuyển
              </span>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Biển số xe *
                  </label>
                  <input
                    {...form.register("vehicleNumber")}
                    placeholder="Ví dụ: 51C-123.45"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                  />
                  {form.formState.errors.vehicleNumber && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {form.formState.errors.vehicleNumber.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tên tài xế *
                  </label>
                  <input
                    {...form.register("driverName")}
                    placeholder="Tên tài xế"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                  />
                  {form.formState.errors.driverName && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {form.formState.errors.driverName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Đơn vị vận chuyển *
                </label>
                <input
                  {...form.register("transportCompany")}
                  placeholder="Nhập tên công ty vận chuyển"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                />
                {form.formState.errors.transportCompany && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {form.formState.errors.transportCompany.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {serverMessage && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                serverMessage.toLowerCase().includes("thành công")
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {serverMessage}
            </div>
          )}

          <div className="flex gap-3 pt-1 pb-4">
            <button
              type="button"
              onClick={() => navigate(basePath)}
              className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 bg-white shadow-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                !canSubmit ||
                !form.formState.isValid
              }
              className="flex-[2] rounded-2xl py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Đang tạo phiếu nhập...
                </>
              ) : (
                "Lưu phiếu nhập"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

