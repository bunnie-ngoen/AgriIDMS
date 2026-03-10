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
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

const normalizeName = (s: string | null | undefined) =>
  (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

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

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();

  const [serverMessage, setServerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data, isLoading: isLoadingProduct } = useGetProductByIdQuery(
    productId,
    { skip: Number.isNaN(productId) }
  );

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
    if (Number.isNaN(productId)) return;
    setServerMessage(null);
    const toastId = toast.loading("Đang cập nhật sản phẩm...");
    try {
      let imageUrl = imagePreview ?? data?.imageUrl ?? undefined;
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
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
      setServerMessage({
        type: "success",
        text: "Cập nhật sản phẩm thành công",
      });
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
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-8 shadow-sm max-w-2xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-center mb-6">
          CẬP NHẬT SẢN PHẨM
        </h1>

        {isLoadingProduct && (
          <p className="text-center text-sm text-slate-500 mb-4">
            Đang tải thông tin sản phẩm...
          </p>
        )}

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
              <p className="text-xs text-slate-500">
                Đang tải danh sách danh mục...
              </p>
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
                  setImagePreview(data?.imageUrl ?? null);
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
                  alt="Ảnh sản phẩm"
                  className="h-32 w-32 rounded-lg object-cover border border-slate-200"
                />
              </div>
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
              onClick={() => navigate("/admin/products")}
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

