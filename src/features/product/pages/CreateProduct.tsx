import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProductSchema,
  type ProductFormValues,
} from "../schemas/product.schema";
import { useCreateProductMutation } from "../api/product.api";
import { useGetCategoriesQuery } from "../../category/api/category.api";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Package, ImagePlus, Loader2, X, ChevronDown } from "lucide-react";
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

export default function CreateProduct() {
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const { data: categories, isLoading: isLoadingCategories } =
    useGetCategoriesQuery();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: "",
      categoryId: 0,
      description: "",
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    setServerMessage(null);
    const toastId = toast.loading("Đang tạo sản phẩm...");
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadFileToCloudinary(imageFile);
      }

      await createProduct({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        categoryId: values.categoryId,
        imageUrl,
      }).unwrap();
      toast.success("Tạo sản phẩm thành công", { id: toastId });
      form.reset({
        name: "",
        categoryId: 0,
        description: "",
      });
      setImageFile(null);
      setImagePreview(null);
      setTimeout(() => navigate("/admin/products"), 400);
    } catch (error: any) {
      const fallbackMsg = "Tạo sản phẩm thất bại. Vui lòng kiểm tra lại thông tin.";
      const msg =
        error?.data?.error ||
        error?.data?.message ||
        error?.message ||
        fallbackMsg;
      toast.error(msg, { id: toastId });
      setServerMessage(msg);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-5 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 hover:shadow-md transition-all duration-200 shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-500" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tạo sản phẩm</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-6">Thêm sản phẩm mới vào danh mục</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-600">New</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Section 1 — Thông tin cơ bản */}
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
                  placeholder="Ví dụ: Cam sành loại 1..."
                  className={inputCls(!!form.formState.errors.name)}
                />
              </Field>

              <Field label="Danh mục *" error={form.formState.errors.categoryId?.message}>
                <div className="relative">
                  <select
                    {...form.register("categoryId", { valueAsNumber: true })}
                    disabled={isLoadingCategories}
                    className={`w-full appearance-none rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 bg-slate-50 focus:bg-white focus:shadow-md pr-10 ${
                      form.formState.errors.categoryId
                        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    }`}
                  >
                    <option value={0}>{isLoadingCategories ? "Đang tải danh sách..." : "Chọn danh mục..."}</option>
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

          {/* Section 2 — Hình ảnh */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                <ImagePlus size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Hình ảnh sản phẩm</span>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-5">
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Xem trước"
                      className="w-40 h-40 rounded-2xl object-cover border-2 border-slate-200 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2.5 -right-2.5 h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-200"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <label className="relative flex flex-col items-center justify-center w-40 h-40 rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 cursor-pointer hover:border-emerald-300 hover:from-emerald-50/50 hover:to-emerald-50 transition-all duration-300 group">
                    <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm mb-2.5 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                      <ImagePlus size={20} className="text-slate-300 group-hover:text-emerald-400 transition-colors duration-300" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-500 transition-colors duration-300">Chọn ảnh</span>
                    <span className="text-[10px] text-slate-300 mt-0.5">PNG · JPG · WEBP</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
                <div className="flex-1 pt-2 space-y-3">
                  <p className="text-xs font-semibold text-slate-600">Upload ảnh sản phẩm</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Ảnh đại diện sẽ hiển thị trong danh sách và được lưu trên Cloudinary CDN.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[["Kích thước", "800 × 800px"], ["Dung lượng", "Tối đa 5MB"], ["Định dạng", "PNG, JPG, WEBP"]].map(([k, v]) => (
                      <div key={k} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400">{k}</p>
                        <p className="text-[11px] font-semibold text-slate-600">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
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

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-6">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
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
                <><Loader2 size={15} className="animate-spin" />Đang tạo sản phẩm...</>
              ) : (
                <><Sparkles size={14} />Lưu sản phẩm</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

