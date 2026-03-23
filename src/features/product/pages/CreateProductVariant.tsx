import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useCreateProductVariantMutation } from "../api/product-variant.api";
import { useGetProductsQuery } from "../api/product.api";
import { ProductVariantSchema, type ProductVariantDto } from "../schemas/product-variant.schema";
import { ImagePlus, Loader2, X, ArrowLeft, ChevronDown, Sparkles, Tag, Clock, BadgeDollarSign } from "lucide-react";
import toast from "react-hot-toast";
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

const CreateProductVariant = () => {
  const navigate = useNavigate();
  const [createVariant, { isLoading: isCreating }] = useCreateProductVariantMutation();
  const { data: products, isLoading: isLoadingProducts } = useGetProductsQuery();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProductVariantDto>({
    resolver: zodResolver(ProductVariantSchema),
    defaultValues: { imageUrl: "", minReceiptWeight: undefined },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    form.setValue("imageUrl", "pending");
    form.clearErrors("imageUrl");
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue("imageUrl", "");
  };

  const onSubmit = async (values: ProductVariantDto) => {
    const toastId = toast.loading("Đang tạo variant...");
    try {
      let imageUrl = values.imageUrl;
      if (imageFile) {
        setIsUploading(true);
        imageUrl = await uploadFileToCloudinary(imageFile);
        setIsUploading(false);
      }
      await createVariant({ ...values, imageUrl }).unwrap();
      toast.success("Tạo variant thành công!", { id: toastId });
      navigate("/admin/product-variants");
    } catch (err: any) {
      setIsUploading(false);
      toast.error(err?.message ?? err?.data?.message ?? "Có lỗi xảy ra", { id: toastId });
    }
  };

  const isLoading = isCreating || isUploading;
  const selectedProductId = form.watch("productId");
  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-5 py-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button type="button" onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 hover:shadow-md transition-all duration-200 shadow-sm">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-500" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tạo Product Variant</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-6">Thêm biến thể mới cho sản phẩm trong hệ thống</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-600">New</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* Section 1 — Image */}
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
                    <img src={imagePreview} alt="preview"
                      className="w-40 h-40 rounded-2xl object-cover border-2 border-slate-200 shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
                    <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/10 transition-all duration-200" />
                    <button type="button" onClick={handleRemoveImage}
                      className="absolute -top-2.5 -right-2.5 h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-200">
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
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-600">Upload ảnh sản phẩm</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Ảnh đại diện sẽ hiển thị trong danh sách và được lưu trên Cloudinary CDN.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[["Kích thước", "800 × 800px"], ["Dung lượng", "Tối đa 5MB"], ["Định dạng", "PNG, JPG, WEBP"], ["Tỉ lệ", "1:1 (vuông)"]].map(([k, v]) => (
                      <div key={k} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400">{k}</p>
                        <p className="text-[11px] font-semibold text-slate-600">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {form.formState.errors.imageUrl && !imagePreview && (
                <p className="text-red-400 text-[11px] mt-3 flex items-center gap-1">⚠ {form.formState.errors.imageUrl.message}</p>
              )}
            </div>
          </div>

          {/* Section 2 — Product & Grade */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Tag size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Thông tin sản phẩm</span>
            </div>
            <div className="p-6 space-y-5">
              {/* Product Select */}
              <Field label="Sản phẩm *" error={form.formState.errors.productId?.message}>
                <div className="relative">
                  <select
                    {...form.register("productId", { valueAsNumber: true })}
                    disabled={isLoadingProducts}
                    className={`w-full appearance-none rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 bg-slate-50 focus:bg-white focus:shadow-md pr-10 ${
                      form.formState.errors.productId
                        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    }`}
                  >
                    <option value="">{isLoadingProducts ? "Đang tải danh sách..." : "Chọn sản phẩm..."}</option>
                    {products?.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {selectedProduct && (
                  <div className="mt-2.5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                    {selectedProduct.imageUrl ? (
                      <img src={selectedProduct.imageUrl} alt="" className="h-9 w-9 rounded-xl object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Tag size={14} className="text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{selectedProduct.name}</p>
                      {selectedProduct.category && (
                        <p className="text-[11px] text-slate-400 truncate">{selectedProduct.category}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-100 px-2 py-0.5 rounded-full">ID #{selectedProduct.id}</span>
                  </div>
                )}
              </Field>

              {/* Grade */}
              <Field label="Grade *" error={form.formState.errors.grade?.message}>
                <input
                  type="number"
                  {...form.register("grade", { valueAsNumber: true })}
                  placeholder="Nhập cấp độ grade, VD: 1"
                  className={inputCls(!!form.formState.errors.grade)}
                />
              </Field>
            </div>
          </div>

          {/* Section 3 — Price, ShelfLife & MinReceiptWeight */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                <BadgeDollarSign size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Giá, Hạn sử dụng & Định mức nhập</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-5">
                <Field label="Giá bán (VNĐ) *" error={form.formState.errors.price?.message}>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      {...form.register("price", { valueAsNumber: true })}
                      placeholder="0"
                      className={inputCls(!!form.formState.errors.price) + " pr-10"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">₫</span>
                  </div>
                </Field>

                <Field label="Hạn sử dụng *" error={form.formState.errors.shelfLifeDays?.message}>
                  <div className="relative">
                    <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    <input
                      type="number"
                      {...form.register("shelfLifeDays", { valueAsNumber: true })}
                      placeholder="0"
                      className={inputCls(!!form.formState.errors.shelfLifeDays) + " pl-10 pr-16"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">ngày</span>
                  </div>
                </Field>

                <Field
                  label="Định mức tối thiểu (kg) *"
                  error={form.formState.errors.minReceiptWeight?.message}
                >
                  <input
                    type="number"
                    step="0.01"
                    {...form.register("minReceiptWeight", {
                      valueAsNumber: true,
                    })}
                    placeholder="Nhập định mức tối thiểu (kg)"
                    className={inputCls(
                      !!form.formState.errors.minReceiptWeight,
                    )}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-6">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 bg-white shadow-sm">
              Hủy bỏ
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-[2] rounded-2xl py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:translate-y-0">
              {isLoading
                ? <><Loader2 size={15} className="animate-spin" />{isUploading ? "Đang upload ảnh..." : "Đang tạo..."}</>
                : <><Sparkles size={14} />Tạo Variant</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductVariant;