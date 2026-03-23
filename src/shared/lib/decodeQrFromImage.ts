import jsQR from "jsqr";

const MAX_SIDE = 1200;

/**
 * Giải mã QR từ file ảnh (PNG/JPG/WebP...). Trả về chuỗi payload hoặc null.
 */
export async function decodeQrFromImageFile(
  file: File,
): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    return await decodeViaHtmlImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function decodeFromDimensions(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): string | null {
  let w = width;
  let h = height;
  if (w > MAX_SIDE || h > MAX_SIDE) {
    const scale = MAX_SIDE / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  draw(ctx, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  return result?.data?.trim() || null;
}

function decodeViaHtmlImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const text = decodeFromDimensions(
        img.naturalWidth,
        img.naturalHeight,
        (ctx, w, h) => {
          ctx.drawImage(img, 0, 0, w, h);
        },
      );
      resolve(text);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
