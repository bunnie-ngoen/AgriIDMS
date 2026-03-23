/**
 * Unsigned upload lên Cloudinary (chỉ cần upload_preset trong Dashboard).
 * Không gửi api_key / api_secret — tránh lỗi "Unknown API key" khi key sai hoặc chỉ có khoảng trắng.
 */
export async function uploadFileToCloudinary(
  file: File,
  options?: { folder?: string },
): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary chưa được cấu hình (thiếu CLOUD_NAME hoặc UPLOAD_PRESET).",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (options?.folder) {
    formData.append("folder", options.folder);
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );

  const json = (await res.json()) as {
    secure_url?: string;
    error?: { message?: string };
    message?: string;
  };

  if (!res.ok) {
    const cloudinaryMsg = json?.error?.message ?? json?.message;
    console.error("Cloudinary upload error:", json);
    throw new Error(
      cloudinaryMsg
        ? `Upload ảnh thất bại: ${cloudinaryMsg.trim()}`
        : "Upload ảnh thất bại.",
    );
  }

  if (!json.secure_url) {
    console.error("Cloudinary response missing secure_url:", json);
    throw new Error("Không lấy được URL ảnh từ Cloudinary.");
  }

  return json.secure_url;
}
