/**
 * Tạo ảnh QR qua api.qrserver.com, upload unsigned lên Cloudinary (preset trong .env),
 * trả về secure_url để gọi API backend PUT .../qr-image.
 */
const QR_SIZE = 200;

function getCloudName(): string {
  const v = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  if (!v) throw new Error("Thiếu VITE_CLOUDINARY_CLOUD_NAME trong .env.local");
  return v;
}

function getUploadPreset(): string {
  const v = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
  if (!v) throw new Error("Thiếu VITE_CLOUDINARY_UPLOAD_PRESET trong .env.local");
  return v;
}

/** URL PNG từ qrserver (GET trả về image/png). */
export function buildQrServerImageUrl(payload: string, size = QR_SIZE): string {
  const data = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}`;
}

/** Tải PNG từ qrserver rồi upload Cloudinary, trả về secure_url. */
export async function uploadQrPayloadToCloudinary(
  payload: string,
  options?: { folder?: string },
): Promise<string> {
  const imageUrl = buildQrServerImageUrl(payload);
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Không tải được ảnh QR từ qrserver (${res.status})`);
  }
  const blob = await res.blob();

  const cloud = getCloudName();
  const preset = getUploadPreset();
  const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;

  const form = new FormData();
  form.append("file", blob, `qr-${Date.now()}.png`);
  form.append("upload_preset", preset);
  if (options?.folder) {
    form.append("folder", options.folder);
  }

  const up = await fetch(endpoint, { method: "POST", body: form });
  const json = (await up.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!up.ok) {
    throw new Error(
      json?.error?.message ?? `Upload Cloudinary thất bại (${up.status})`,
    );
  }
  if (!json.secure_url) {
    throw new Error("Cloudinary không trả secure_url");
  }
  return json.secure_url;
}
