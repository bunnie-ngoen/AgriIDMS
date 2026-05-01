import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";

type AiQcResponse = {
  decision: "PASS" | "FAIL" | string;
  label?: string;
  label_vi?: string;
  confidence?: number;
  confidence_pct?: number;
  message_vi?: string;
};

function confidencePercent(result: AiQcResponse): number {
  if (typeof result.confidence_pct === "number") return result.confidence_pct;
  if (typeof result.confidence === "number") return result.confidence * 100;
  return 0;
}

function stripPercentInMessage(message?: string): string {
  if (!message) return "—";
  return message
    .replace(/\s*\(\d+(?:[.,]\d+)?%\)\.?/gi, "")
    .replace(/\s*\(độ tin cậy:\s*\d+(?:[.,]\d+)?%\)\.?/gi, "")
    .trim();
}

export default function AiQcStandalonePage() {
  const AI_QC_BASE_URL =
    (import.meta as any)?.env?.VITE_AI_QC_BASE_URL || "http://localhost:8000";

  const [aiQcImageFile, setAiQcImageFile] = useState<File | null>(null);
  const [aiQcImagePreview, setAiQcImagePreview] = useState<string>("");
  const [aiQcResult, setAiQcResult] = useState<AiQcResponse | null>(null);
  const [isAiQcRunning, setIsAiQcRunning] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (aiQcImagePreview) URL.revokeObjectURL(aiQcImagePreview);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [aiQcImagePreview]);

  useEffect(() => {
    if (!isCameraOpen) return;
    const video = cameraVideoRef.current;
    const stream = cameraStreamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => {
      // no-op
    });
  }, [isCameraOpen]);

  const runAiQc = async (file: File) => {
    setIsAiQcRunning(true);
    setAiQcResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch(`${AI_QC_BASE_URL}/predict`, {
        method: "POST",
        body: fd,
      });
      const json = (await resp.json()) as AiQcResponse;
      if (!resp.ok) {
        throw new Error(
          (json as any)?.message_vi ||
            (json as any)?.detail ||
            "Kiểm tra chất lượng bằng AI thất bại.",
        );
      }
      setAiQcResult(json);
    } catch (e: any) {
      toast.error(e?.message || "Kiểm tra chất lượng bằng AI thất bại.");
    } finally {
      setIsAiQcRunning(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    setIsStartingCamera(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Trình duyệt không hỗ trợ mở camera trực tiếp.");
        return;
      }
      stopCamera();
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
    } catch (e: any) {
      toast.error(
        e?.message || "Không mở được camera. Vui lòng kiểm tra quyền truy cập camera.",
      );
    } finally {
      setIsStartingCamera(false);
    }
  };

  const captureFromCamera = async () => {
    const video = cameraVideoRef.current;
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
      toast.error("Camera chưa sẵn sàng để chụp.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Không tạo được ảnh từ camera.");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) {
      toast.error("Không chụp được ảnh từ camera.");
      return;
    }
    const file = new File([blob], `qc-${Date.now()}.jpg`, { type: "image/jpeg" });
    setAiQcImageFile(file);
    if (aiQcImagePreview) URL.revokeObjectURL(aiQcImagePreview);
    setAiQcImagePreview(URL.createObjectURL(file));
    await runAiQc(file);
  };

  return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-900">Kiểm tra chất lượng bằng AI</h1>
        <p className="mt-1 text-xs text-slate-500">
          Luồng AI tách riêng: tải ảnh lên hoặc chụp ảnh để AI đánh giá chất lượng.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Upload size={14} />
            Tải ảnh lên
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0] ?? null;
                if (!f) return;
                setAiQcImageFile(f);
                if (aiQcImagePreview) URL.revokeObjectURL(aiQcImagePreview);
                setAiQcImagePreview(URL.createObjectURL(f));
                await runAiQc(f);
              }}
            />
          </label>
          <button
            type="button"
            onClick={startCamera}
            disabled={isStartingCamera}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <Camera size={14} />
            {isStartingCamera ? "Đang mở camera..." : "Mở camera"}
          </button>
          {isCameraOpen ? (
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Tắt camera
            </button>
          ) : null}
        </div>

        {isCameraOpen ? (
          <div className="space-y-2">
            <video
              ref={cameraVideoRef}
              autoPlay
              playsInline
              muted
              className="h-56 w-full rounded-xl border border-slate-200 bg-black object-cover"
            />
            <button
              type="button"
              onClick={captureFromCamera}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              <Camera size={14} />
              Chụp ảnh & đánh giá
            </button>
          </div>
        ) : null}

        {aiQcImageFile ? (
          <div className="space-y-2">
            <div className="text-xs text-slate-600">
              Ảnh đã chọn: <span className="font-semibold text-slate-800">{aiQcImageFile.name}</span>
            </div>
            {aiQcImagePreview ? (
              <img
                src={aiQcImagePreview}
                alt="Ảnh kiểm tra chất lượng"
                className="h-44 w-auto max-w-full rounded-xl border border-slate-200 bg-white object-contain"
              />
            ) : null}
          </div>
        ) : null}

        {isAiQcRunning ? (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Loader2 size={14} className="animate-spin" />
            Đang kiểm tra bằng AI...
          </div>
        ) : null}

        {aiQcResult ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              String(aiQcResult.decision).toUpperCase() === "PASS"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <div className="text-xs">
              Độ tin cậy:{" "}
              <span className="font-semibold">
                {Number(confidencePercent(aiQcResult)).toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 text-sm font-semibold">
              {aiQcResult.label_vi || aiQcResult.label || "—"}
            </div>
            <div className="mt-1 text-sm">
              {stripPercentInMessage(aiQcResult.message_vi)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

