import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateWarehouseSchema,
  type CreateWarehouseFormValues,
} from "../schemas/create-warehouse.schema";
import { useCreateWarehouseMutation } from "../api/create-user.api";
import { useState } from "react";

const provinces = ["Vĩnh Phúc", "Hà Nội", "TP Hồ Chí Minh", "Đà Nẵng"] as const;

const districtOptions: Record<(typeof provinces)[number], string[]> = {
  "Vĩnh Phúc": ["Vĩnh Tường"],
  "Hà Nội": ["Ba Đình", "Hoàn Kiếm", "Cầu Giấy"],
  "TP Hồ Chí Minh": ["Quận 1", "Quận 3", "Gò Vấp"],
  "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà"],
};

const wardOptions: Record<string, string[]> = {
  // Huyện Vĩnh Tường - Vĩnh Phúc
  "Vĩnh Tường": [
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
  ],
};

const CreateWarehouse = () => {
  const [createWarehouse, { isLoading }] = useCreateWarehouseMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);

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

  const watchProvince = form.watch("province");
  const watchDistrict = form.watch("district");

  const onSubmit = async (values: CreateWarehouseFormValues) => {
    setServerMessage(null);
    try {
      const res = await createWarehouse(values).unwrap();
      setServerMessage(res.message ?? "Tạo kho thành công");
      form.reset({
        name: "",
        province: "Vĩnh Phúc",
        district: "Vĩnh Tường",
        ward: "",
        detailAddress: "",
        titleWarehouse: "Normal",
      });
    } catch (error: any) {
      const msg =
        error?.data?.message ||
        "Tạo kho thất bại. Vui lòng kiểm tra lại thông tin.";
      setServerMessage(msg);
    }
  };

  const currentDistricts =
    (watchProvince && districtOptions[watchProvince as (typeof provinces)[number]]) ||
    [];

  const currentWards = (watchDistrict && wardOptions[watchDistrict]) || [];

  return (
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-8 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-center mb-6">
          TẠO THÔNG TIN KHO
        </h1>

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
              placeholder="Ví dụ: Kho chính, Kho lạnh số 1"
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
              <select
                {...form.register("province")}
                className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                disabled
              >
                <option value="">Chọn tỉnh / thành</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {form.formState.errors.province && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.province.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-slate-700">
                Quận / Huyện *
              </label>
              <select
                {...form.register("district")}
                className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                disabled
              >
                <option value="">Chọn quận / huyện</option>
                {currentDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {form.formState.errors.district && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.district.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-slate-700">
                Phường / Xã *
              </label>
              <select
                {...form.register("ward")}
                className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                disabled={!watchDistrict}
              >
                <option value="">Chọn phường / xã</option>
                {currentWards.map((w) => (
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
              placeholder="Số nhà, tên đường..."
              className="w-full p-3 rounded-xl border border-gray-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
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

          {serverMessage && (
            <p
              className={`text-xs px-3 py-2 rounded-lg border ${
                serverMessage.toLowerCase().includes("thành công")
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {serverMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 bg-[#7FBB35] p-3 rounded-xl text-white font-semibold text-sm hover:bg-[#598325] transition disabled:opacity-50"
          >
            {isLoading ? "Đang tạo kho..." : "Lưu thông tin kho"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateWarehouse;

