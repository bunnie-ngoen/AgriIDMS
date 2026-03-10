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
import { Link, useNavigate } from "react-router-dom";

async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary chưa được cấu hình (thiếu CLOUD_NAME hoặc UPLOAD_PRESET).");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (apiKey) {
    formData.append("api_key", apiKey);
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const json = (await res.json()) as any;

  if (!res.ok) {
    const cloudinaryMsg: string | undefined =
      json?.error?.message || json?.message;
    console.error("Cloudinary upload error:", json);
    throw new Error(
      cloudinaryMsg
        ? `Upload ảnh thất bại: ${cloudinaryMsg}`
        : "Upload ảnh thất bại."
    );
  }

  if (!json?.secure_url) {
    console.error("Cloudinary response missing secure_url:", json);
    throw new Error("Không lấy được URL ảnh từ Cloudinary.");
  }

  return json.secure_url as string;
}

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
        imageUrl = await uploadImageToCloudinary(imageFile);
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

  return (
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-8 shadow-sm max-w-2xl mx-auto">
        <Link
          to="/admin/products"
          className="inline-block text-sm text-emerald-600 hover:underline mb-4"
        >
          ← Quay lại danh sách sản phẩm
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-center mb-6">TẠO SẢN PHẨM</h1>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-slate-700">
              Tên sản phẩm *
            </label>
            <input
              {...form.register("name")}
              placeholder="Ví dụ: Cam sành loại 1..."
              className="w-full p-3 rounded-xl border border-gray-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 max-w-sm">
            <label className="font-medium text-sm text-slate-700">
              Danh mục *
            </label>
            <select
              {...form.register("categoryId", { valueAsNumber: true })}
              className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value={0}>Chọn danh mục</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {isLoadingCategories && (
              <p className="text-xs text-slate-500">Đang tải danh sách danh mục...</p>
            )}
            {form.formState.errors.categoryId && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.categoryId.message}
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
              placeholder="Mô tả ngắn về sản phẩm (tùy chọn)"
              className="w-full p-3 rounded-xl border border-gray-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-slate-700">
              Ảnh sản phẩm
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setImageFile(null);
                  setImagePreview(null);
                  return;
                }
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
              className="w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {imagePreview && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1">Xem trước:</p>
                <img
                  src={imagePreview}
                  alt="Xem trước sản phẩm"
                  className="h-32 w-32 rounded-lg object-cover border border-slate-200"
                />
              </div>
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
            {isLoading ? "Đang tạo sản phẩm..." : "Lưu sản phẩm"}
          </button>
        </form>
      </div>
    </div>
  );
}

