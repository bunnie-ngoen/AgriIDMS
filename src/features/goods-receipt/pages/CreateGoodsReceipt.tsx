import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Truck, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { useGetSuppliersQuery } from "../../supplier/api/supplier.api";
import { useGetWarehousesQuery } from "../../admin/api/create-user.api";
import { useGetPurchaseOrdersQuery } from "../../purchase-order/api/purchase-order.api";
import { useCreateGoodsReceiptMutation } from "../api/goods-receipt.api";

const Schema = z.object({
  supplierId: z.number().min(1, "Vui lòng chọn nhà cung cấp."),
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
    .max(100, "Tên công ty vận chuyển tối đa 100 ký tự.")
    .optional()
    .or(z.literal("")),
  purchaseOrderId: z.number().min(1, "Vui lòng chọn đơn mua."),
});

type FormValues = z.infer<typeof Schema>;

export default function CreateGoodsReceipt() {
  const navigate = useNavigate();
  const { data: suppliers = [], isLoading: isLoadingSuppliers, isError: isSuppliersError } = useGetSuppliersQuery();
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
    defaultValues: {
      supplierId: 0,
      warehouseId: 0,
      vehicleNumber: "",
      driverName: "",
      transportCompany: "",
      purchaseOrderId: 0,
    },
  });

  const watchedSupplierId = form.watch("supplierId");
  const watchedPurchaseOrderId = form.watch("purchaseOrderId");

  // Nếu đổi nhà cung cấp thì reset lại đơn mua, tránh chọn nhầm PO của NCC khác
  useEffect(() => {
    if (!watchedSupplierId || !purchaseOrders?.length) {
      if (form.getValues("purchaseOrderId") !== 0) {
        form.setValue("purchaseOrderId", 0, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      return;
    }

    const currentPo = purchaseOrders.find(
      (po) => po.id === form.getValues("purchaseOrderId"),
    );

    if (currentPo && currentPo.supplierId !== watchedSupplierId) {
      form.setValue("purchaseOrderId", 0, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watchedSupplierId, purchaseOrders, form]);

  const onSubmit = async (values: FormValues) => {
    setServerMessage(null);
    const toastId = toast.loading("Đang tạo phiếu nhập kho...");
    try {
      const result = await createReceipt({
        supplierId: values.supplierId,
        warehouseId: values.warehouseId,
        vehicleNumber: values.vehicleNumber.trim(),
        driverName: values.driverName.trim(),
        transportCompany: values.transportCompany?.trim() || undefined,
        purchaseOrderId: values.purchaseOrderId,
      }).unwrap();

      const successMsg = "Tạo phiếu nhập thành công. Đang chuyển sang màn chi tiết để thêm dòng.";
      toast.success(successMsg, { id: toastId });
      setServerMessage(successMsg);

      setTimeout(() => {
        if (result?.receiptId) {
          navigate(`/admin/goods-receipts/${result.receiptId}`);
        } else {
          navigate("/admin/goods-receipts");
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
    // Bắt buộc phải chọn nhà cung cấp trước khi nhìn thấy đơn mua
    if (!watchedSupplierId || watchedSupplierId === 0) return false;
    if (po.supplierId !== watchedSupplierId) return false;
    return po.status === "Approved";
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-5 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate("/admin/goods-receipts")}
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
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
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
                  <select
                    {...form.register("supplierId", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                    disabled={
                      isLoadingSuppliers || isSuppliersError
                    }
                  >
                    <option value={0}>
                      {isLoadingSuppliers
                        ? "Đang tải nhà cung cấp..."
                        : "Chọn nhà cung cấp"}
                    </option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.supplierId && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {form.formState.errors.supplierId.message}
                    </p>
                  )}
                  {!watchedSupplierId && !form.formState.errors.supplierId && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Hãy chọn nhà cung cấp trước, sau đó mới chọn đơn mua tương ứng.
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
                        "Vui lòng đăng nhập lại với tài khoản Admin/Manager."}
                    </p>
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
                  Đơn vị vận chuyển (tuỳ chọn)
                </label>
                <input
                  {...form.register("transportCompany")}
                  placeholder="Tên công ty vận chuyển, nếu có"
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
                Chỉ hiển thị các đơn mua đã được duyệt (Approved) của nhà cung cấp đã chọn.
                Bạn cần chọn nhà cung cấp ở bước trên trước khi chọn đơn mua.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Đơn mua hàng * (theo nhà cung cấp đã chọn)
                </label>
                <select
                  {...form.register("purchaseOrderId", { valueAsNumber: true })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                  disabled={!watchedSupplierId || watchedSupplierId === 0}
                >
                  <option value={0}>
                    {(!watchedSupplierId || watchedSupplierId === 0)
                      ? "Vui lòng chọn nhà cung cấp trước"
                      : "Chọn đơn mua đã duyệt của nhà cung cấp này"}
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
              onClick={() => navigate("/admin/goods-receipts")}
              className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 bg-white shadow-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
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

