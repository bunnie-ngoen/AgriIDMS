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
import toast from "react-hot-toast";
import {
  getVnDistricts,
  getVnProvinces,
  getVnWards,
  type VnDistrict,
  type VnProvince,
  type VnWard,
} from "../../../shared/api/vn-address.api";
import { Package, MapPin, Sparkles, Loader2, ChevronDown, X } from "lucide-react";

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</label>
    {children}
    {error && <p className="text-red-400 text-[11px] flex items-center gap-1">⚠ {error}</p>}
  </div>
);

const inputCls = (hasError?: boolean) =>
  `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 bg-slate-50 placeholder:text-slate-300 focus:bg-white focus:shadow-md ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
  }`;

const selectCls = (hasError?: boolean) =>
  `w-full appearance-none rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 bg-slate-50 focus:bg-white focus:shadow-md pr-10 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
  }`;

type Props = {
  warehouseId: number;
  onClose: () => void;
  onSuccess: () => void;
};

const normalizeName = (s: string) => {
  const x = (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return x
    .replace(
      /\b(tp\.?|thanh pho|tinh|quan|huyen|thi xa|phuong|xa|thi tran)\b/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
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
      provinceCode: 0,
      districtCode: 0,
      wardCode: 0,
      detailAddress: "",
      titleWarehouse: "Normal",
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

  const [parsedLocation, setParsedLocation] = useState<{
    provinceName: string;
    districtName: string;
    wardName: string;
    detail: string;
  } | null>(null);

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
      const parts = (data.location ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const provinceFromApi = parts.at(-1) ?? "";
      const districtFromApi = parts.at(-2) ?? "";
      const wardFromApi = parts.at(-3) ?? "";
      const detailAddress =
        parts.length >= 4
          ? parts.slice(0, -3).join(", ")
          : (data.location ?? "");
      setParsedLocation({
        provinceName: provinceFromApi,
        districtName: districtFromApi,
        wardName: wardFromApi,
        detail: detailAddress,
      });
      form.reset({
        name: data.name,
        provinceCode: 0,
        districtCode: 0,
        wardCode: 0,
        detailAddress: detailAddress,
        titleWarehouse: data.titleWarehouse,
      });
    }
  }, [data, form]);

  useEffect(() => {
    if (!parsedLocation || provinces.length === 0) return;
    const want = normalizeName(parsedLocation.provinceName);
    const p =
      provinces.find((x) => normalizeName(x.name) === want) ||
      provinces.find((x) => normalizeName(x.name).includes(want)) ||
      provinces.find((x) => want.includes(normalizeName(x.name))) ||
      provinces[0];
    if (!p) return;
    form.setValue("provinceCode", p.code, { shouldValidate: false });
    form.setValue("districtCode", 0, { shouldValidate: false });
    form.setValue("wardCode", 0, { shouldValidate: false });
  }, [parsedLocation, provinces, form]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setDistricts([]);
      setWards([]);
      form.setValue("districtCode", 0, { shouldValidate: false });
      form.setValue("wardCode", 0, { shouldValidate: false });
      form.clearErrors(["districtCode", "wardCode"]);
      if (!provinceCode || provinceCode < 1) return;
      setLoadingDistricts(true);
      try {
        const res = await getVnDistricts(provinceCode);
        if (!mounted) return;
        setDistricts(res);
      } finally {
        if (mounted) setLoadingDistricts(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceCode]);

  useEffect(() => {
    if (!parsedLocation || districts.length === 0) return;
    const want = normalizeName(parsedLocation.districtName);
    const d =
      districts.find((x) => normalizeName(x.name) === want) ||
      districts.find((x) => normalizeName(x.name).includes(want)) ||
      districts.find((x) => want.includes(normalizeName(x.name))) ||
      districts[0];
    if (!d) return;
    form.setValue("districtCode", d.code, { shouldValidate: false });
    form.setValue("wardCode", 0, { shouldValidate: false });
  }, [parsedLocation, districts, form]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setWards([]);
      form.setValue("wardCode", 0, { shouldValidate: false });
      form.clearErrors("wardCode");
      if (!districtCode || districtCode < 1) return;
      setLoadingWards(true);
      try {
        const res = await getVnWards(districtCode);
        if (!mounted) return;
        setWards(res);
      } finally {
        if (mounted) setLoadingWards(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtCode]);

  useEffect(() => {
    if (!parsedLocation || wards.length === 0) return;
    const want = normalizeName(parsedLocation.wardName);
    const w =
      wards.find((x) => normalizeName(x.name) === want) ||
      wards.find((x) => normalizeName(x.name).includes(want)) ||
      wards.find((x) => want.includes(normalizeName(x.name))) ||
      wards[0];
    if (!w) return;
    form.setValue("wardCode", w.code, { shouldValidate: false });
  }, [parsedLocation, wards, form]);

  const onSubmit = async (values: CreateWarehouseFormValues) => {
    setServerMessage(null);
    const provinceName =
      provinces.find((p) => p.code === values.provinceCode)?.name ?? "";
    const districtName =
      districts.find((d) => d.code === values.districtCode)?.name ?? "";
    const wardName =
      wards.find((w) => w.code === values.wardCode)?.name ?? "";
    const location = `${values.detailAddress}, ${wardName}, ${districtName}, ${provinceName}`;
    const toastId = toast.loading("Đang cập nhật kho...");
    try {
      await updateWarehouse({
        id: warehouseId,
        data: {
          name: values.name,
          location,
          titleWarehouse: values.titleWarehouse,
        },
      }).unwrap();
      toast.success("Cập nhật kho thành công", { id: toastId });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const msg =
        (error as { data?: { message?: string } })?.data?.message ||
        "Cập nhật kho thất bại. Vui lòng kiểm tra lại thông tin.";
      toast.error(msg, { id: toastId });
      setServerMessage({ type: "error", text: msg });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-warehouse-title"
    >
      <div
        className="bg-white rounded-3xl border border-slate-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — giống CreateWarehouse */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Package size={14} className="text-white" />
            </div>
            <div>
              <h2
                id="edit-warehouse-title"
                className="text-base font-semibold text-slate-900"
              >
                Cập nhật thông tin kho
              </h2>
              <p className="text-[11px] text-slate-400">Chỉnh sửa thông tin kho trong hệ thống</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-6 flex flex-col gap-4"
        >
          {isLoadingWarehouse && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Đang tải thông tin kho...
            </div>
          )}

          {/* Section 1 — Thông tin kho */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Package size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Thông tin kho</span>
            </div>
            <div className="p-6 space-y-5">
              <Field label="Tên kho *" error={form.formState.errors.name?.message}>
                <input
                  {...form.register("name")}
                  placeholder="Ví dụ: Kho chính, Kho lạnh số 1"
                  className={inputCls(!!form.formState.errors.name)}
                />
              </Field>
              <Field label="Loại kho *" error={form.formState.errors.titleWarehouse?.message}>
                <div className="relative max-w-xs">
                  <select
                    {...form.register("titleWarehouse")}
                    className={selectCls(!!form.formState.errors.titleWarehouse)}
                  >
                    <option value="Normal">Kho thường</option>
                    <option value="Cold">Kho lạnh</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </div>

          {/* Section 2 — Địa chỉ */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                <MapPin size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Địa chỉ</span>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Tỉnh / Thành phố *" error={form.formState.errors.provinceCode?.message}>
                  <div className="relative">
                    <select
                      {...form.register("provinceCode", { valueAsNumber: true })}
                      className={selectCls(!!form.formState.errors.provinceCode)}
                      onChange={(e) => {
                        const code = Number(e.target.value) || 0;
                        form.setValue("provinceCode", code, { shouldValidate: true });
                        form.setValue("districtCode", 0, { shouldValidate: false });
                        form.setValue("wardCode", 0, { shouldValidate: false });
                        form.clearErrors(["districtCode", "wardCode"]);
                      }}
                    >
                      <option value={0}>{loadingProvinces ? "Đang tải..." : "Chọn tỉnh / thành"}</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </Field>

                <Field label="Quận / Huyện *" error={form.formState.errors.districtCode?.message}>
                  <div className="relative">
                    <select
                      {...form.register("districtCode", { valueAsNumber: true })}
                      className={selectCls(!!form.formState.errors.districtCode)}
                      disabled={!provinceCode || provinceCode < 1}
                      onChange={(e) => {
                        const code = Number(e.target.value) || 0;
                        form.setValue("districtCode", code, { shouldValidate: true });
                        form.setValue("wardCode", 0, { shouldValidate: false });
                        form.clearErrors("wardCode");
                      }}
                    >
                      <option value={0}>{loadingDistricts ? "Đang tải..." : "Chọn quận / huyện"}</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.code}>{d.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </Field>

                <Field label="Phường / Xã *" error={form.formState.errors.wardCode?.message}>
                  <div className="relative">
                    <select
                      {...form.register("wardCode", { valueAsNumber: true })}
                      className={selectCls(!!form.formState.errors.wardCode)}
                      disabled={!districtCode || districtCode < 1}
                    >
                      <option value={0}>{loadingWards ? "Đang tải..." : "Chọn phường / xã"}</option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.code}>{w.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </Field>
              </div>

              <Field label="Địa chỉ chi tiết *" error={form.formState.errors.detailAddress?.message}>
                <textarea
                  {...form.register("detailAddress")}
                  rows={2}
                  placeholder="Số nhà, tên đường..."
                  className={inputCls(!!form.formState.errors.detailAddress) + " resize-none"}
                />
              </Field>
            </div>
          </div>

          {serverMessage && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                serverMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {serverMessage.text}
            </div>
          )}

          {/* Actions — giống CreateWarehouse */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 bg-white shadow-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || isLoadingWarehouse}
              className="flex-[2] rounded-2xl py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:translate-y-0"
            >
              {isLoading ? (
                <><Loader2 size={15} className="animate-spin" />Đang lưu...</>
              ) : (
                <><Sparkles size={14} />Lưu thay đổi</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
