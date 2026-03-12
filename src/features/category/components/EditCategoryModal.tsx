import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CategorySchema,
  type CategoryFormValues,
} from "../schemas/category.schema";
import {
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
} from "../api/category.api";
import toast from "react-hot-toast";
import { Package, Sparkles, Loader2, X } from "lucide-react";

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

type Props = {
  categoryId: number;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function EditCategoryModal({
  categoryId,
  onClose,
  onSuccess,
}: Props) {
  const [serverMessage, setServerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data, isLoading: isLoadingCategory } =
    useGetCategoryByIdQuery(categoryId);

  const [updateCategory, { isLoading }] = useUpdateCategoryMutation();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name ?? "",
        description: data.description ?? "",
      });
    }
  }, [data, form]);

  const onSubmit = async (values: CategoryFormValues) => {
    setServerMessage(null);
    const toastId = toast.loading("Đang cập nhật danh mục...");
    try {
      await updateCategory({
        id: categoryId,
        data: {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
        },
      }).unwrap();

      toast.success("Cập nhật danh mục thành công", { id: toastId });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const msg =
        error?.data?.error ||
        error?.data?.message ||
        "Cập nhật danh mục thất bại. Vui lòng kiểm tra lại thông tin.";
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
      aria-labelledby="edit-category-title"
    >
      <div
        className="bg-white rounded-3xl border border-slate-100 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — giống CreateCategory */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Package size={14} className="text-white" />
            </div>
            <div>
              <h2
                id="edit-category-title"
                className="text-base font-semibold text-slate-900"
              >
                Cập nhật danh mục
              </h2>
              <p className="text-[11px] text-slate-400">Chỉnh sửa thông tin danh mục</p>
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
          className="p-6 flex flex-col gap-5"
        >
          {isLoadingCategory && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Đang tải thông tin danh mục...
            </div>
          )}

          <div className="space-y-5">
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

          {/* Actions — giống CreateCategory */}
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
              disabled={isLoading || isLoadingCategory}
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

