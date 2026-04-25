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
    error: warehousesError,
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
  const selectedSupplierName =
    selectedPo?.supplierName || "";

  type DetailLine = {
    purchaseOrderDetailId: number;
    supplierPlanDetailId?: number;
    supplierId: number;
    supplierName: string;
    productName: string;
    orderedWeight: number;
    remainingWeight: number;
    receivedWeight: number;
  };

  const [detailLines, setDetailLines] = useState<DetailLine[]>([]);
  const [selectedPoDetailId, setSelectedPoDetailId] = useState<number>(0);
  // Dùng string để tránh ô input luôn hiển thị "0" khi mới vào form
  const [receivedWeightInput, setReceivedWeightInput] = useState<string>("");
  const [detailInputErrors, setDetailInputErrors] = useState<{
    poDetail?: string;
    receivedWeight?: string;
    details?: string;
  }>({});

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
    // Khi đổi PO thì reset các dòng chi tiết đã thêm
    setDetailLines([]);
    setSelectedPoDetailId(0);
    setReceivedWeightInput("");
    setDetailInputErrors({});
  }, [watchedPurchaseOrderId]);

  const poDetailOptions = useMemo(() => {
    const structuredPlans = purchaseOrderStructuredForDetails?.supplierPlans ?? [];
    const structuredRows = structuredPlans.flatMap((plan) =>
      (plan.details ?? []).map((line) => {
        const oldDetail = purchaseOrderForDetails?.details?.find((d) => d.id === line.lineId);
        return {
          id: line.lineId,
          supplierPlanDetailId: plan.supplierPlanId > 0 ? line.lineId : undefined,
          supplierId: plan.supplier.supplierId,
          supplierName: plan.supplier.supplierName,
          productName: line.productName,
          orderedWeight: line.orderedWeight,
          remainingWeight: oldDetail?.remainingWeight ?? line.orderedWeight,
        };
      }),
    );

    if (structuredRows.length > 0) return structuredRows;

    return (purchaseOrderForDetails?.details ?? []).map((d) => ({
      id: d.id,
      supplierPlanDetailId: undefined,
      supplierId: selectedPo?.supplierId ?? 0,
      supplierName: selectedPo?.supplierName ?? "",
      productName: d.productName,
      orderedWeight: d.orderedWeight,
      remainingWeight: d.remainingWeight,
    }));
  }, [purchaseOrderStructuredForDetails, purchaseOrderForDetails, selectedPo]);

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
    () => detailLines.reduce((sum, line) => sum + Number(line.receivedWeight ?? 0), 0),
    [detailLines],
  );

  const onSubmit = async (values: FormValues) => {
    setServerMessage(null);
    const toastId = toast.loading("Đang tạo phiếu nhập kho...");
    try {
      if (detailLines.length === 0) {
        const msg = "Vui lòng thêm ít nhất 1 dòng chi tiết sản phẩm trước khi lưu phiếu.";
        setDetailInputErrors((prev) => ({ ...prev, details: msg }));
        toast.error(msg);
        return;
      }

      const result = await createReceipt({
        warehouseId: values.warehouseId,
        vehicleNumber: values.vehicleNumber.trim(),
        driverName: values.driverName.trim(),
        transportCompany: values.transportCompany?.trim() || undefined,
        purchaseOrderId: values.purchaseOrderId,
        details: detailLines.map((d) => ({
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

  const handleAddDetailLine = () => {
    setDetailInputErrors({});
    if (!selectedPoDetailId || selectedPoDetailId <= 0) {
      const msg = "Vui lòng chọn chi tiết sản phẩm từ đơn mua.";
      setDetailInputErrors((prev) => ({ ...prev, poDetail: msg }));
      toast.error(msg);
      return;
    }
    const receivedWeight = Number(receivedWeightInput);
    if (Number.isNaN(receivedWeight) || receivedWeight <= 0) {
      const msg = "Vui lòng nhập khối lượng nhận hợp lệ và lớn hơn 0.";
      setDetailInputErrors((prev) => ({ ...prev, receivedWeight: msg }));
      toast.error(msg);
      return;
    }
    if (receivedWeight < 0) {
      toast.error("Khối lượng nhận không được âm.");
      return;
    }

    const matched = poDetailOptions.find((d) => d.id === selectedPoDetailId);
    if (!matched) {
      toast.error("Không tìm thấy dòng đơn mua hợp lệ.");
      return;
    }

    const supplierIdsInCart = Array.from(
      new Set(detailLines.map((x) => x.supplierId).filter((id) => id > 0)),
    );
    if (
      supplierIdsInCart.length > 0 &&
      matched.supplierId > 0 &&
      !supplierIdsInCart.includes(matched.supplierId)
    ) {
      toast.error("Phiếu nhập đa NCC chỉ nhận từ một NCC nguồn. Vui lòng tách phiếu theo từng NCC.");
      return;
    }

    if (receivedWeight > matched.remainingWeight) {
      toast.error(
        `Khối lượng nhận không được vượt quá còn lại của dòng PO (còn lại ${matched.remainingWeight} kg).`,
      );
      return;
    }

    setDetailLines((prev) => {
      // nếu đã thêm line cùng PO detail -> update receivedWeight
      const exists = prev.find((x) => x.purchaseOrderDetailId === matched.id);
      if (exists) {
        return prev.map((x) =>
          x.purchaseOrderDetailId === matched.id
            ? {
                ...x,
                receivedWeight,
                remainingWeight: matched.remainingWeight,
              }
            : x,
        );
      }
      return [
        ...prev,
        {
          purchaseOrderDetailId: matched.id,
          supplierPlanDetailId: matched.supplierPlanDetailId,
          supplierId: matched.supplierId,
          supplierName: matched.supplierName,
          productName: matched.productName,
          orderedWeight: matched.orderedWeight,
          remainingWeight: matched.remainingWeight,
          receivedWeight,
        },
      ];
    });

    setSelectedPoDetailId(0);
    setReceivedWeightInput("");
    setDetailInputErrors((prev) => ({ ...prev, details: undefined }));
    toast.success("Đã thêm dòng chi tiết.");
  };

  const handleRemoveDetailLine = (purchaseOrderDetailId: number) => {
    setDetailLines((prev) =>
      prev.filter((x) => x.purchaseOrderDetailId !== purchaseOrderDetailId),
    );
    toast.success("Đã xoá dòng chi tiết.");
  };
  const selectedSupplierNameForReceipt = useMemo(() => {
    const names = Array.from(new Set(detailLines.map((x) => x.supplierName).filter(Boolean)));
    if (names.length > 0) return names[0];
    return selectedSupplierName;
  }, [detailLines, selectedSupplierName]);

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

          {/* Nhập chi tiết sản phẩm */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                <FileText size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                Nhập chi tiết sản phẩm
              </span>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <p className="text-xs text-slate-500">
                Chọn chi tiết sản phẩm từ đơn mua đã chọn và nhập khối lượng nhận.
                Bạn có thể thêm nhiều chi tiết.
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
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Chi tiết sản phẩm từ đơn mua *
                      </label>
                      <select
                        value={selectedPoDetailId}
                        onChange={(e) => {
                          setSelectedPoDetailId(Number(e.target.value));
                          setDetailInputErrors((prev) => ({ ...prev, poDetail: undefined }));
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                      >
                        <option value={0}>
                          Chọn chi tiết sản phẩm trong đơn mua
                        </option>
                        {poDetailOptions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.supplierName ? `[${d.supplierName}] ` : ""}
                            {d.productName} — KL đặt: {d.orderedWeight} kg, còn lại: {d.remainingWeight} kg
                          </option>
                        ))}
                      </select>
                      {detailInputErrors.poDetail && (
                        <p className="text-[11px] text-red-500 mt-1">
                          {detailInputErrors.poDetail}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Khối lượng nhận (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={0.01}
                        value={receivedWeightInput}
                        onChange={(e) => {
                          setReceivedWeightInput(e.target.value);
                          setDetailInputErrors((prev) => ({ ...prev, receivedWeight: undefined }));
                        }}
                        placeholder="Ví dụ: 1000"
                        onBlur={() => {
                          // Chuẩn hoá input rỗng -> ""
                          if (receivedWeightInput.trim() === "") {
                            setReceivedWeightInput("");
                            return;
                          }
                          const n = Number(receivedWeightInput);
                          if (Number.isNaN(n)) return;
                          if (n < 0) setReceivedWeightInput(String(0));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddDetailLine();
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                      />
                      {detailInputErrors.receivedWeight && (
                        <p className="text-[11px] text-red-500 mt-1">
                          {detailInputErrors.receivedWeight}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleAddDetailLine}
                      disabled={
                        !selectedPoDetailId ||
                        selectedPoDetailId <= 0 ||
                          Number.isNaN(Number(receivedWeightInput)) ||
                          Number(receivedWeightInput) <= 0 ||
                        isLoadingPoDetails
                      }
                      className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      Thêm chi tiết sản phẩm
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Sản phẩm
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            KL nhận
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailLines.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-5 text-center text-slate-500"
                            >
                              Chưa có chi tiết sản phẩm nào.
                            </td>
                          </tr>
                        ) : (
                          detailLines.map((d) => {
                            return (
                              <tr
                                key={d.purchaseOrderDetailId}
                                className="border-t border-slate-100 hover:bg-slate-50/50"
                              >
                                <td className="px-4 py-3 text-slate-800">
                                  {d.productName}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-700">
                                  {d.receivedWeight} kg
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveDetailLine(
                                        d.purchaseOrderDetailId,
                                      )
                                    }
                                    className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                                  >
                                    Xoá
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {detailInputErrors.details && (
                    <p className="text-[11px] text-red-500 -mt-1">
                      {detailInputErrors.details}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Thông tin chung */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                <Truck size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                Thông tin xe & nhà cung cấp
              </span>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nhà cung cấp *
                  </label>
                  <input
                    value={selectedSupplierNameForReceipt || ""}
                    readOnly
                    placeholder="Chọn đơn mua để tự điền nhà cung cấp"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 text-slate-700 focus:outline-none"
                  />
                  {watchedPurchaseOrderId > 0 && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Nhà cung cấp được tự động lấy theo đơn mua đã chọn.
                    </p>
                  )}
                  {watchedPurchaseOrderId <= 0 && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Vui lòng chọn đơn mua để hệ thống tự điền nhà cung cấp.
                    </p>
                  )}
                </div>
                <div>
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
                  {isWarehousesError && !form.formState.errors.warehouseId && (
                    <p className="text-[11px] text-red-500 mt-1">
                      Không tải được danh sách kho.{" "}
                      {(warehousesError as { status?: number })?.status === 401 &&
                        "Vui lòng đăng nhập lại với tài khoản Admin/Quản lí."}
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
                detailLines.length === 0 ||
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

