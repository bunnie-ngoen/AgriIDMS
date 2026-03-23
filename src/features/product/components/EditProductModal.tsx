import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProductSchema,
  type ProductFormValues,
} from "../schemas/product.schema";
import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "../api/product.api";
import { useGetCategoriesQuery } from "../../category/api/category.api";
import toast from "react-hot-toast";
import { Package, Image as ImageIcon, Sparkles, Loader2, ChevronDown, X } from "lucide-react";
import { uploadFileToCloudinary } from "../../../shared/lib/cloudinaryUpload";

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
  productId: number;
  onClose: () => void;
  onSuccess?: () => void;
};

const normalizeName = (s: string | null | undefined) =>
  (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

export default function EditProductModal({
  productId,
  onClose,
  onSuccess,
}: Props) {
  const [serverMessage, setServerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data, isLoading: isLoadingProduct } =
    useGetProductByIdQuery(productId);
  const {
    data: categories,
    isLoading: isLoadingCategories,
  } = useGetCategoriesQuery();

  const [updateProduct, { isLoading }] = useUpdateProductMutation();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: "",
      categoryId: 0,
      description: "",
    },
  });

  const initialCategoryId = useMemo(() => {
    if (!data || !categories) return 0;
    const target = normalizeName(data.category);
    if (!target) return categories[0]?.id ?? 0;
    const found =
      categories.find((c) => normalizeName(c.name) === target) ||
      categories.find((c) => normalizeName(c.name).includes(target)) ||
      categories.find((c) => target.includes(normalizeName(c.name)));
    return found?.id ?? categories[0]?.id ?? 0;
  }, [data, categories]);

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name ?? "",
        categoryId: initialCategoryId,
        description: data.description ?? "",
      });
      setImagePreview(data.imageUrl ?? null);
      setImageFile(null);
    }
  }, [data, form, initialCategoryId]);

  const onSubmit = async (values: ProductFormValues) => {
    setServerMessage(null);
    const toastId = toast.loading("Đang cập nhật sản phẩm...");
    try {
      let imageUrl = imagePreview ?? data?.imageUrl ?? undefined;
      if (imageFile) {
        imageUrl = await uploadFileToCloudinary(imageFile);
      }

      await updateProduct({
        id: productId,
        data: {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          categoryId: values.categoryId,
          imageUrl,
        },
      }).unwrap();

      toast.success("Cập nhật sản phẩm thành công", { id: toastId });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const msg =
        error?.data?.error ||
        error?.data?.message ||
        "Cập nhật sản phẩm thất bại. Vui lòng kiểm tra lại thông tin.";
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
      aria-labelledby="edit-product-title"
    >
      <div
        className="bg-white rounded-3xl border border-slate-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Package size={14} className="text-white" />
            </div>
            <div>
              <h2 id="edit-product-title" className="text-base font-semibold text-slate-900">
                Cập nhật sản phẩm
              </h2>
              <p className="text-[11px] text-slate-400">Chỉnh sửa thông tin sản phẩm</p>
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

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
          {isLoadingProduct && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Đang tải thông tin sản phẩm...
            </div>
          )}

          {/* Section — Thông tin sản phẩm */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Package size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Thông tin sản phẩm</span>
            </div>
            <div className="p-6 space-y-5">
              <Field label="Tên sản phẩm *" error={form.formState.errors.name?.message}>
                <input
                  {...form.register("name")}
                  placeholder="Ví dụ: Cam sành, Bưởi da xanh..."
                  className={inputCls(!!form.formState.errors.name)}
                />
              </Field>

              <Field label="Danh mục *" error={form.formState.errors.categoryId?.message}>
                <div className="relative max-w-xs">
                  <select
                    {...form.register("categoryId", { valueAsNumber: true })}
                    className={selectCls(!!form.formState.errors.categoryId)}
                  >
                    <option value={0}>{isLoadingCategories ? "Đang tải..." : "Chọn danh mục"}</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Mô tả (tùy chọn)" error={form.formState.errors.description?.message}>
                <textarea
                  {...form.register("description")}
                  rows={3}
                  placeholder="Mô tả ngắn về sản phẩm"
                  className={inputCls(!!form.formState.errors.description) + " resize-none"}
                />
              </Field>
            </div>
          </div>

          {/* Section — Ảnh sản phẩm */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                <ImageIcon size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Ảnh sản phẩm</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Chọn ảnh mới (tùy chọn)
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setImageFile(null);
                    setImagePreview(data?.imageUrl ?? null);
                    return;
                  }
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }}
                className="w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 transition-colors"
              />
              {imagePreview && (
                <div>
                  <p className="text-[11px] text-slate-400 mb-1.5">Xem trước</p>
                  <img
                    src={imagePreview}
                    alt="Ảnh sản phẩm"
                    className="h-32 w-32 rounded-xl object-cover border border-slate-200 shadow-sm"
                  />
                </div>
              )}
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
              disabled={isLoading || isLoadingProduct}
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

