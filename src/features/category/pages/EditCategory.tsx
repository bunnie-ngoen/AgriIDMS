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
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function EditCategory() {
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id);
  const navigate = useNavigate();

  const [serverMessage, setServerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data, isLoading: isLoadingCategory } = useGetCategoryByIdQuery(
    categoryId,
    { skip: Number.isNaN(categoryId) }
  );

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
    if (Number.isNaN(categoryId)) return;
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
      setServerMessage({
        type: "success",
        text: "Cập nhật danh mục thành công",
      });
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
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-8 shadow-sm max-w-2xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-center mb-6">
          CẬP NHẬT DANH MỤC
        </h1>

        {isLoadingCategory && (
          <p className="text-center text-sm text-slate-500 mb-4">
            Đang tải thông tin danh mục...
          </p>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-slate-700">
              Tên danh mục *
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

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-slate-700">
              Mô tả
            </label>
            <textarea
              {...form.register("description")}
              rows={3}
              className="w-full p-3 rounded-xl border border-gray-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
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
              onClick={() => navigate("/admin/categories")}
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

