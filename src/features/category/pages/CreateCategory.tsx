import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CategorySchema, type CategoryFormValues } from "../schemas/category.schema";
import { useCreateCategoryMutation } from "../api/category.api";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Package, Loader2 } from "lucide-react";
import { useRoleGuard } from "../../auth/hooks/useRoleGuard";

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

export default function CreateCategory() {
  const { isManager } = useRoleGuard();
  const categoryBasePath = isManager() ? "/manager/categories" : "/admin/categories";
  const [createCategory, { isLoading }] = useCreateCategoryMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: CategoryFormValues) => {
    setServerMessage(null);
    const toastId = toast.loading("Đang tạo danh mục...");
    try {
      await createCategory({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      }).unwrap();
      toast.success("Tạo danh mục thành công", { id: toastId });
      form.reset({ name: "", description: "" });
      setTimeout(() => navigate(categoryBasePath), 400);
    } catch (error: any) {
      const msg =
        error?.data?.error ||
        error?.data?.message ||
        "Tạo danh mục thất bại. Vui lòng kiểm tra lại thông tin.";
      toast.error(msg, { id: toastId });
      setServerMessage(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8 sm:flex-nowrap sm:gap-4">
          <button
            type="button"
            onClick={() => navigate(categoryBasePath)}
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 hover:shadow-md transition-all duration-200 shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-500" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tạo danh mục sản phẩm</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-6">Thêm danh mục mới dùng cho sản phẩm</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-600">New</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Section — Thông tin danh mục */}
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-50 px-4 py-4 sm:px-6">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Package size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Thông tin danh mục</span>
            </div>
            <div className="space-y-5 p-4 sm:p-6">
              <Field label="Tên danh mục *" error={form.formState.errors.name?.message}>
                <input
                  {...form.register("name")}
                  placeholder="Ví dụ: Trái cây, Rau củ..."
                  className={inputCls(!!form.formState.errors.name)}
                />
              </Field>

              <Field label="Mô tả (tùy chọn)" error={form.formState.errors.description?.message}>
                <textarea
                  {...form.register("description")}
                  rows={3}
                  placeholder="Mô tả ngắn về danh mục"
                  className={inputCls(!!form.formState.errors.description) + " resize-none"}
                />
              </Field>
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
          <div className="flex flex-col gap-2 pt-1 pb-4 sm:flex-row sm:gap-3 sm:pb-6">
            <button
              type="button"
              onClick={() => navigate(categoryBasePath)}
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
                <><Loader2 size={15} className="animate-spin" />Đang tạo danh mục...</>
              ) : (
                <><Sparkles size={14} />Lưu danh mục</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

