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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-category-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2
            id="edit-category-title"
            className="text-lg font-semibold text-slate-900"
          >
            Cập nhật danh mục
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-6 flex flex-col gap-4"
        >
          {isLoadingCategory && (
            <p className="text-sm text-slate-500">
              Đang tải thông tin danh mục...
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-slate-700">
              Tên danh mục *
            </label>
            <input
              {...form.register("name")}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-slate-700">
              Mô tả
            </label>
            <textarea
              {...form.register("description")}
              rows={3}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none text-sm"
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.description.message}
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

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#7FBB35] px-4 py-2.5 rounded-lg text-white text-sm font-semibold hover:bg-[#598325] disabled:opacity-50"
            >
              {isLoading ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

