import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateWarehouseSchema,
  type CreateWarehouseFormValues,
} from "../schemas/create-warehouse.schema";
import {
  useGetWarehouseQuery,
  useUpdateWarehouseMutation,
} from "../api/create-user.api";

const VinhTuongWards = [
  "Thị trấn Thổ Tang",
  "Thị trấn Tứ Trưng",
  "Thị trấn Vĩnh Tường",
  "An Tường",
  "Bình Dương",
  "Bồ Sao",
  "Cao Đại",
  "Chấn Hưng",
  "Đại Đồng",
  "Kim Xá",
  "Lũng Hòa",
  "Lý Nhân",
  "Nghĩa Hưng",
  "Ngũ Kiên",
  "Phú Đa",
  "Tam Phúc",
  "Tân Phú",
  "Tân Tiến",
  "Thượng Trưng",
  "Tuân Chính",
  "Vân Xuân",
  "Việt Xuân",
  "Vĩnh Ninh",
  "Vĩnh Sơn",
  "Vĩnh Thịnh",
  "Vũ Di",
  "Yên Bình",
  "Yên Lập",
] as const;

type Props = {
  warehouseId: number;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditWarehouseModal({
  warehouseId,
  onClose,
  onSuccess,
}: Props) {
  const [serverMessage, setServerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data, isLoading: isLoadingWarehouse } =
    useGetWarehouseQuery(warehouseId);

  const [updateWarehouse, { isLoading }] = useUpdateWarehouseMutation();

  const form = useForm<CreateWarehouseFormValues>({
    resolver: zodResolver(CreateWarehouseSchema),
    defaultValues: {
      name: "",
      province: "Vĩnh Phúc",
      district: "Vĩnh Tường",
      ward: "",
      detailAddress: "",
      titleWarehouse: "Normal",
    },
  });

  useEffect(() => {
    if (data) {
      const parts = data.location.split(",").map((s) => s.trim());
      const detailAddress = parts[0] ?? "";
      const ward = parts[1] ?? "";

      form.reset({
        name: data.name,
        province: "Vĩnh Phúc",
        district: "Vĩnh Tường",
        ward,
        detailAddress,
        titleWarehouse: data.titleWarehouse,
      });
    }
  }, [data, form]);

  const onSubmit = async (values: CreateWarehouseFormValues) => {
    setServerMessage(null);
    try {
      await updateWarehouse({ id: warehouseId, data: values }).unwrap();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Update warehouse failed:", error);
      const anyErr = error as any;
      const msg =
        anyErr?.data?.message ||
        "Cập nhật kho thất bại. Vui lòng kiểm tra lại thông tin.";
      setServerMessage({ type: "error", text: msg });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-warehouse-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2
            id="edit-warehouse-title"
            className="text-lg font-semibold text-slate-900"
          >
            Cập nhật thông tin kho
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-6 flex flex-col gap-4"
        >
          {isLoadingWarehouse && (
            <p className="text-sm text-slate-500">Đang tải thông tin kho...</p>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-slate-700">
              Tên kho *
            </label>
            <input
              {...form.register("name")}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-medium text-sm text-slate-700">
                Tỉnh / Thành phố *
              </label>
              <input
                value="Vĩnh Phúc"
                readOnly
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium text-sm text-slate-700">
                Quận / Huyện *
              </label>
              <input
                value="Vĩnh Tường"
                readOnly
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium text-sm text-slate-700">
                Phường / Xã *
              </label>
              <select
                {...form.register("ward")}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
              >
                <option value="">Chọn phường / xã</option>
                {(() => {
                  const wards: string[] = [...VinhTuongWards];
                  const currentWard = form.watch("ward");
                  if (currentWard && !wards.includes(currentWard)) {
                    wards.unshift(currentWard);
                  }
                  return wards;
                })().map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              {form.formState.errors.ward && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.ward.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-slate-700">
              Địa chỉ chi tiết *
            </label>
            <textarea
              {...form.register("detailAddress")}
              rows={2}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none text-sm"
            />
            {form.formState.errors.detailAddress && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.detailAddress.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 max-w-xs">
            <label className="font-medium text-sm text-slate-700">
              Loại kho *
            </label>
            <select
              {...form.register("titleWarehouse")}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
            >
              <option value="Normal">Kho thường</option>
              <option value="Cold">Kho lạnh</option>
            </select>
            {form.formState.errors.titleWarehouse && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.titleWarehouse.message}
              </p>
            )}
          </div>

          {serverMessage && (
            <p
              className={`text-xs px-3 py-2 rounded-lg border ${
                serverMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {serverMessage.text}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || isLoadingWarehouse}
              className="px-4 py-2 rounded-lg bg-[#7FBB35] text-white text-sm font-semibold hover:bg-[#598325] disabled:opacity-50"
            >
              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
