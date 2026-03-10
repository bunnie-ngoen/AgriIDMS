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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-product-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2
            id="edit-product-title"
            className="text-lg font-semibold text-slate-900"
          >
            Cập nhật sản phẩm
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
          {isLoadingProduct && (
            <p className="text-sm text-slate-500">
              Đang tải thông tin sản phẩm...
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-slate-700">
              Tên sản phẩm *
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

          <div className="flex flex-col gap-2 max-w-sm">
            <label className="font-medium text-sm text-slate-700">
              Danh mục *
            </label>
            <select
              {...form.register("categoryId", { valueAsNumber: true })}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
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
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none text-sm"
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

