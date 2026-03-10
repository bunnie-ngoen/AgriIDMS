import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CategorySchema, type CategoryFormValues } from "../schemas/category.schema";
import { useCreateCategoryMutation } from "../api/category.api";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

export default function CreateCategory() {
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
      form.reset({
        name: "",
        description: "",
      });
      setTimeout(() => navigate("/admin/categories"), 400);
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
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-8 shadow-sm max-w-2xl mx-auto">
        <Link
          to="/admin/categories"
          className="inline-block text-sm text-emerald-600 hover:underline mb-4"
        >
          ← Quay lại danh sách danh mục
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-center mb-6">
          TẠO DANH MỤC SẢN PHẨM
        </h1>

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
              placeholder="Ví dụ: Trái cây, Rau củ..."
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
              placeholder="Mô tả ngắn về danh mục (tùy chọn)"
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
                serverMessage.toLowerCase().includes("thành công")
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {serverMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 bg-[#7FBB35] p-3 rounded-xl text-white font-semibold text-sm hover:bg-[#598325] transition disabled:opacity-50"
          >
            {isLoading ? "Đang tạo danh mục..." : "Lưu danh mục"}
          </button>
        </form>
      </div>
    </div>
  );
}

