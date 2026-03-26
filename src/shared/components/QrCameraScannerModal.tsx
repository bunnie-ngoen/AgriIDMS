import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, Loader2, X } from "lucide-react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onDetected: (value: string) => void;
};

export default function QrCameraScannerModal({
  open,
  title = "Quét QR bằng camera",
  onClose,
  onDetected,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const lastScanRef = useRef<number>(0);

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const stopAll = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const initCamera = async () => {
      setIsStarting(true);
      setError("");
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Trình duyệt không hỗ trợ truy cập camera.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();

        const W = window as any;
        if (W.BarcodeDetector && !detectorRef.current) {
          detectorRef.current = new W.BarcodeDetector({ formats: ["qr_code"] });
        }

        const scanLoop = async () => {
          if (!open || !videoRef.current) return;
          const now = Date.now();
          if (now - lastScanRef.current > 180) {
            lastScanRef.current = now;
            const payload = await decodeFrame();
            if (payload) {
              onDetected(payload);
              onClose();
              return;
            }
          }
          rafRef.current = requestAnimationFrame(() => {
            void scanLoop();
          });
        };

        const decodeFrame = async (): Promise<string | null> => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return null;

          if (detectorRef.current) {
            try {
              const codes = await detectorRef.current.detect(video);
              const value = codes?.[0]?.rawValue?.trim();
              if (value) return value;
            } catch {
              // fallback to jsQR
            }
          }

          const canvas = canvasRef.current;
          if (!canvas) return null;
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (!w || !h) return null;
          canvas.width = w;
          canvas.height = h;

          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return null;
          ctx.drawImage(video, 0, 0, w, h);
          const image = ctx.getImageData(0, 0, w, h);
          const found = jsQR(image.data, image.width, image.height, {
            inversionAttempts: "attemptBoth",
          });
          return found?.data?.trim() || null;
        };

        await scanLoop();
      } catch {
        setError(
          "Không thể mở camera. Hãy cấp quyền camera trong trình duyệt rồi thử lại.",
        );
      } finally {
        setIsStarting(false);
      }
    };

    void initCamera();
    return () => {
      cancelled = true;
      stopAll();
    };
  }, [open, onClose, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-slate-900">
            <Camera size={16} />
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-[320px] object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="pointer-events-none absolute inset-0 border-[3px] border-emerald-400/70 m-8 rounded-xl" />
          </div>

          {isStarting ? (
            <div className="mt-3 text-xs text-slate-600 inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Đang khởi động camera...
            </div>
          ) : null}
          {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}
          <p className="mt-2 text-[11px] text-slate-500">
            Đưa mã QR vào giữa khung, hệ thống sẽ tự nhận.
          </p>
        </div>
      </div>
    </div>
  );
}
