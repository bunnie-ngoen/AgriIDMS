import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { SupplierSchema, type SupplierFormValues } from "../schemas/supplier.schema";
import { useCreateSupplierMutation } from "../api/supplier.api";
import toast from "react-hot-toast";
import { getVnDistricts, getVnProvinces, getVnWards, type VnDistrict, type VnProvince, type VnWard } from "../api/vn-address.api";

export default function CreateSupplier() {
  const navigate = useNavigate();
  const [createSupplier, { isLoading }] = useCreateSupplierMutation();
  const [serverMessage, setServerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: {
      name: "",
      provinceCode: 0,
      districtCode: 0,
      wardCode: 0,
      detailAddress: "",
      phone: "",
    },
  });

  const [provinces, setProvinces] = useState<VnProvince[]>([]);
  const [districts, setDistricts] = useState<VnDistrict[]>([]);
  const [wards, setWards] = useState<VnWard[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const provinceCode = form.watch("provinceCode");
  const districtCode = form.watch("districtCode");

  // Load provinces once
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProvinces(true);
      try {
        const res = await getVnProvinces();
        if (!mounted) return;
        setProvinces(res);
      } finally {
        if (mounted) setLoadingProvinces(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadDistricts = async (pCode: number) => {
    setLoadingDistricts(true);
    try {
      const res = await getVnDistricts(pCode);
      setDistricts(res);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadWards = async (dCode: number) => {
    setLoadingWards(true);
    try {
      const res = await getVnWards(dCode);
      setWards(res);
    } finally {
      setLoadingWards(false);
    }
  };

  const onSubmit = async (values: SupplierFormValues) => {
    setServerMessage(null);
    const toastId = toast.loading("Đang tạo nhà cung cấp...");
    try {
      const provinceName = provinces.find((p) => p.code === values.provinceCode)?.name ?? "";
      const districtName = districts.find((d) => d.code === values.districtCode)?.name ?? "";
      const wardName = wards.find((w) => w.code === values.wardCode)?.name ?? "";

      await createSupplier({
        name: values.name,
        address: `${values.detailAddress}, ${wardName}, ${districtName}, ${provinceName}`,
        phone: values.phone,
      }).unwrap();

      toast.success("Tạo nhà cung cấp thành công", { id: toastId });
      setServerMessage({ type: "success", text: "Tạo nhà cung cấp thành công" });
      form.reset({
        name: "",
        provinceCode: 0,
        districtCode: 0,
        wardCode: 0,
        detailAddress: "",
        phone: "",
      });
      setTimeout(() => navigate("/admin/suppliers"), 400);
    } catch (error: any) {
      const msg =
        error?.data?.error ||
        error?.data?.message ||
        "Tạo nhà cung cấp thất bại. Vui lòng kiểm tra lại thông tin.";
      toast.error(msg, { id: toastId });
      setServerMessage({ type: "error", text: msg });
    }
  };

  return (
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-8 shadow-sm">
        <Link
          to="/admin/suppliers"
          className="inline-block text-sm text-emerald-600 hover:underline mb-4"
        >
          ← Quay lại danh sách nhà cung cấp
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-center mb-6">
          TẠO NHÀ CUNG CẤP
        </h1>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6 max-w-2xl mx-auto"
        >
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-slate-700">
              Tên nhà cung cấp *
            </label>
            <input
              {...form.register("name")}
              placeholder="Ví dụ: Công ty ABC"
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
                {...form.register("provinceCode", { valueAsNumber: true })}
                className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                onChange={(e) => {
                  const pCode = Number(e.target.value) || 0;
                  form.setValue("provinceCode", pCode);
                  form.setValue("districtCode", 0);
                  form.setValue("wardCode", 0);
                  setDistricts([]);
                  setWards([]);
                  if (pCode > 0) loadDistricts(pCode);
                }}
              >
                <option value={0}>Chọn tỉnh / thành</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
              {loadingProvinces && (
                <p className="text-slate-500 text-xs">Đang tải tỉnh/thành...</p>
              )}
              {form.formState.errors.provinceCode && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.provinceCode.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-slate-700">
                Quận / Huyện *
              </label>
              <select
                {...form.register("districtCode", { valueAsNumber: true })}
                className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                disabled={!provinceCode}
                onChange={(e) => {
                  const dCode = Number(e.target.value) || 0;
                  form.setValue("districtCode", dCode);
                  form.setValue("wardCode", 0);
                  setWards([]);
                  if (dCode > 0) loadWards(dCode);
                }}
              >
                <option value={0}>Chọn quận / huyện</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
              {loadingDistricts && (
                <p className="text-slate-500 text-xs">Đang tải quận/huyện...</p>
              )}
              {form.formState.errors.districtCode && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.districtCode.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-slate-700">
                Phường / Xã *
              </label>
              <select
                {...form.register("wardCode", { valueAsNumber: true })}
                className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                disabled={!districtCode}
              >
                <option value={0}>Chọn phường / xã</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </select>
              {loadingWards && (
                <p className="text-slate-500 text-xs">Đang tải phường/xã...</p>
              )}
              {form.formState.errors.wardCode && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.wardCode.message}
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

          <div className="flex flex-col gap-2 max-w-sm">
            <label className="font-medium text-sm text-slate-700">
              Số điện thoại *
            </label>
            <input
              {...form.register("phone")}
              placeholder="Ví dụ: 0912345678"
              className="w-full p-3 rounded-xl border border-gray-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {form.formState.errors.phone && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.phone.message}
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

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#7FBB35] px-5 py-3 rounded-xl text-white font-semibold text-sm hover:bg-[#598325] transition disabled:opacity-50"
            >
              {isLoading ? "Đang tạo..." : "Lưu"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/suppliers")}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

