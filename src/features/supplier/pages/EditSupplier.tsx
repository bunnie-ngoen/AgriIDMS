import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetSupplierByIdQuery,
  useUpdateSupplierMutation,
} from "../api/supplier.api";
import { SupplierSchema, type SupplierFormValues } from "../schemas/supplier.schema";
import {
  getVnDistricts,
  getVnProvinces,
  getVnWards,
  type VnDistrict,
  type VnProvince,
  type VnWard,
} from "../api/vn-address.api";

export default function EditSupplier() {
  const { id } = useParams<{ id: string }>();
  const supplierId = Number(id);
  const navigate = useNavigate();

  const { data, isLoading: isLoadingSupplier } = useGetSupplierByIdQuery(
    supplierId,
    { skip: Number.isNaN(supplierId) }
  );

  const [updateSupplier, { isLoading }] = useUpdateSupplierMutation();

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

  const normalizeName = (s: string) => {
    const x = (s || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
    return x
      .replace(/\b(tp\.?|thanh pho|tinh|quan|huyen|thi xa|phuong|xa|thi tran)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const [parsedAddress, setParsedAddress] = useState<{
    provinceName: string;
    districtName: string;
    wardName: string;
    detail: string;
  } | null>(null);

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

  useEffect(() => {
    if (data) {
      const parts = (data.address ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const provinceName = parts.at(-1) ?? "";
      const districtName = parts.at(-2) ?? "";
      const wardName = parts.at(-3) ?? "";
      const detailAddress =
        parts.length >= 4 ? parts.slice(0, -3).join(", ") : (data.address ?? "");

      setParsedAddress({
        provinceName,
        districtName,
        wardName,
        detail: detailAddress,
      });

      form.reset({
        name: data.name ?? "",
        provinceCode: 0,
        districtCode: 0,
        wardCode: 0,
        detailAddress: detailAddress,
        phone: data.phone ?? "",
      });
    }
  }, [data, form]);

  useEffect(() => {
    if (!parsedAddress || provinces.length === 0) return;
    const want = normalizeName(parsedAddress.provinceName);
    if (!want) return;
    const p =
      provinces.find((x) => normalizeName(x.name) === want) ||
      provinces.find((x) => normalizeName(x.name).includes(want)) ||
      provinces.find((x) => want.includes(normalizeName(x.name)));
    if (!p) return;

    form.setValue("provinceCode", p.code, { shouldValidate: true });
    form.setValue("districtCode", 0);
    form.setValue("wardCode", 0);
    setDistricts([]);
    setWards([]);
    loadDistricts(p.code);
  }, [parsedAddress, provinces, form]);

  useEffect(() => {
    if (!parsedAddress || !provinceCode || districts.length === 0) return;
    const want = normalizeName(parsedAddress.districtName);
    if (!want) return;
    const d =
      districts.find((x) => normalizeName(x.name) === want) ||
      districts.find((x) => normalizeName(x.name).includes(want)) ||
      districts.find((x) => want.includes(normalizeName(x.name)));
    if (!d) return;
    form.setValue("districtCode", d.code, { shouldValidate: true });
    form.setValue("wardCode", 0);
    setWards([]);
    loadWards(d.code);
  }, [parsedAddress, provinceCode, districts, form]);

  useEffect(() => {
    if (!parsedAddress || !districtCode || wards.length === 0) return;
    const want = normalizeName(parsedAddress.wardName);
    if (!want) return;
    const w =
      wards.find((x) => normalizeName(x.name) === want) ||
      wards.find((x) => normalizeName(x.name).includes(want)) ||
      wards.find((x) => want.includes(normalizeName(x.name)));
    if (!w) return;
    form.setValue("wardCode", w.code, { shouldValidate: true });
  }, [parsedAddress, districtCode, wards, form]);

  const onSubmit = async (values: SupplierFormValues) => {
    if (Number.isNaN(supplierId)) return;
    setServerMessage(null);
    try {
      const provinceName =
        provinces.find((p) => p.code === values.provinceCode)?.name ?? "";
      const districtName =
        districts.find((d) => d.code === values.districtCode)?.name ?? "";
      const wardName = wards.find((w) => w.code === values.wardCode)?.name ?? "";

      await updateSupplier({
        id: supplierId,
        data: {
          name: values.name,
          address: `${values.detailAddress}, ${wardName}, ${districtName}, ${provinceName}`,
          phone: values.phone,
        },
      }).unwrap();

      setServerMessage({ type: "success", text: "Cập nhật nhà cung cấp thành công" });
    } catch (error: any) {
      const msg =
        error?.data?.error ||
        error?.data?.message ||
        "Cập nhật nhà cung cấp thất bại. Vui lòng kiểm tra lại thông tin.";
      setServerMessage({ type: "error", text: msg });
    }
  };

  return (
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-8 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-center mb-6">
          CẬP NHẬT NHÀ CUNG CẤP
        </h1>

        {isLoadingSupplier && (
          <p className="text-center text-sm text-slate-500 mb-4">
            Đang tải thông tin nhà cung cấp...
          </p>
        )}

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
              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/suppliers")}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
            >
              Quay lại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

