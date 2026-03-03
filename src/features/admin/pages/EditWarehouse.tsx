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
import { useNavigate, useParams } from "react-router-dom";

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

const EditWarehouse = () => {
  const { id } = useParams<{ id: string }>();
  const warehouseId = Number(id);
  const navigate = useNavigate();
  const [serverMessage, setServerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data, isLoading: isLoadingWarehouse } =
    useGetWarehouseQuery(warehouseId, {
      skip: Number.isNaN(warehouseId),
    });

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
      const parts = data.location.split(",");
      const detailAddress = parts[0]?.trim() ?? "";
      const ward = parts[1]?.trim() ?? "";

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
    if (Number.isNaN(warehouseId)) return;
    try {
      await updateWarehouse({ id: warehouseId, data: values }).unwrap();
      setServerMessage({
        type: "success",
        text: "Cập nhật kho thành công",
      });
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
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-8 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-center mb-6">
          CẬP NHẬT THÔNG TIN KHO
        </h1>

        {isLoadingWarehouse && (
          <p className="text-center text-sm text-slate-500 mb-4">
            Đang tải thông tin kho...
          </p>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6 max-w-2xl mx-auto"
        >
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-slate-700">
              Tên kho *
            </label>
            <input
              {...form.register("name")}
              className="w-full p-3 rounded-xl border border-gray-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-slate-700">
                Tỉnh / Thành phố *
              </label>
              <input
                value="Vĩnh Phúc"
                readOnly
                className="w-full p-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-slate-700">
                Quận / Huyện *
              </label>
              <input
                value="Vĩnh Tường"
                readOnly
                className="w-full p-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-slate-700">
                Phường / Xã *
              </label>
              <select
                {...form.register("ward")}
                className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Chọn phường / xã</option>
                {(() => {
                  const wards: string[] = [...VinhTuongWards];
                  const currentWard = form.getValues("ward");
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
              className="w-full p-3 rounded-xl border border-gray-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
            {form.formState.errors.detailAddress && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.detailAddress.message}
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

          <div className="flex flex-col gap-2 max-w-xs">
            <label className="font-medium text-sm text-slate-700">
              Loại kho *
            </label>
            <select
              {...form.register("titleWarehouse")}
              className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
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

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 bg-[#7FBB35] p-3 rounded-xl text-white font-semibold text-sm hover:bg-[#598325] transition disabled:opacity-50"
          >
            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditWarehouse;

