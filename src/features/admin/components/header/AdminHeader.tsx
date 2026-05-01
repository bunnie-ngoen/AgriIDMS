import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import AdminHeaderQrMiniScan from "./AdminHeaderQrMiniScan";
import AdminHeaderNotificationBell from "./AdminHeaderNotificationBell";
import { Camera, Loader2, Menu, Sparkles, Upload } from "lucide-react";
import toast from "react-hot-toast";

const ROUTE_LABELS: Record<string, string> = {
  admin: "Quản trị",
  manager: "Quản lý",
  sales: "Bán hàng",
  warehouse: "Nhân viên kho",
  "warehouse-staff": "Nhân viên kho",
  "sales-staff": "Nhân viên bán hàng",
  "purchase-staff": "Nhân viên mua hàng",
  dashboard: "Bảng điều khiển",
  profile: "Hồ sơ",
  "user-management": "Quản lý người dùng",
  "create-user": "Tạo người dùng",
  users: "Người dùng",
  deleted: "Đã xóa",
  reports: "Báo cáo",
  "revenue-profit-specific": "Doanh thu - lợi nhuận",
  "goods-receipts": "Phiếu nhập kho",
  print: "In phiếu",
  qc: "Kiểm định",
  "purchase-orders": "Đơn mua hàng",
  orders: "Đơn hàng",
  suppliers: "Nhà cung cấp",
  products: "Sản phẩm",
  "product-variants": "Biến thể sản phẩm",
  categories: "Danh mục",
  exports: "Xuất hàng",
  shipping: "Giao hàng",
  complaints: "Khiếu nại",
  pending: "Chờ xử lý",
  processed: "Đã xử lý",
  "sale-confirm": "Chờ xác nhận bán",
  "pending-cod": "Chờ thanh toán COD",
  "approved-export": "Đã duyệt xuất hàng",
  "pos-create": "Tạo đơn tại quầy",
  "unpaid-pos": "Đơn quầy chưa thanh toán",
  warehouses: "Kho",
  map: "Sơ đồ kho",
  config: "Cấu hình",
  lots: "Lô hàng",
  "stock-checks": "Kiểm kê",
  putaway: "Xếp hàng vào vị trí",
  "unassigned-inventory": "Hàng chưa xếp vị trí",
  "inventory-issues": "Hàng hư hỏng / quá hạn",
  "near-expiry-discount-config": "Cấu hình giảm giá cận date",
  "variant-discount-config": "Cấu hình giảm giá biến thể",
  "damage-discount-approvals": "Duyệt giảm giá hàng hỏng",
  "box-type-config": "Cấu hình loại thùng",
  "disposal-requests": "Yêu cầu tiêu hủy",
  "damage-reports": "Phiếu hỏng",
  "ai-qc": "AI QC",
  create: "Tạo mới",
  new: "Tạo mới",
  proposals: "Đề xuất",
  edit: "Chỉnh sửa",
  detail: "Chi tiết",
};

const toVietnameseLabel = (segment = "") => {
  if (!segment) return "";
  const normalized = segment.trim().toLowerCase();
  if (/^\d+$/.test(normalized)) return `#${normalized}`;
  const direct = ROUTE_LABELS[normalized];
  if (direct) return direct;
  return normalized
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

type AdminHeaderProps = {
  onToggleSidebar?: () => void;
};

const HIDDEN_BREADCRUMB_SEGMENTS = new Set(["config"]);

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

const AdminHeader = ({ onToggleSidebar }: AdminHeaderProps) => {
    const location = useLocation(); //lấy thông tin của url hiện tại 
  const AI_QC_BASE_URL =
    (import.meta as any)?.env?.VITE_AI_QC_BASE_URL || "http://localhost:8000";
  const [isAiQcModalOpen, setIsAiQcModalOpen] = useState(false);
  const [aiQcImagePreview, setAiQcImagePreview] = useState("");
  const [aiQcResult, setAiQcResult] = useState<AiQcResponse | null>(null);
  const [isAiQcRunning, setIsAiQcRunning] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const pathnames = location.pathname
    .split("/")  //["", "admin", "user-management", "create"]
    .filter((x) => x); // bỏ chuỗi rỗng
  const displayPathnames = pathnames
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => !HIDDEN_BREADCRUMB_SEGMENTS.has(segment.trim().toLowerCase()));

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
      toast.error(e?.message || "Không mở được camera.");
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
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) return;
    const file = new File([blob], `qc-${Date.now()}.jpg`, { type: "image/jpeg" });
    if (aiQcImagePreview) URL.revokeObjectURL(aiQcImagePreview);
    setAiQcImagePreview(URL.createObjectURL(file));
    await runAiQc(file);
  };

    return (
        <>
        <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:items-start lg:justify-between lg:px-5">
            <div className="flex min-w-0 items-start gap-3">
                {onToggleSidebar ? (
                  <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 lg:hidden"
                    aria-label="Mở menu"
                  >
                    <Menu size={18} />
                  </button>
                ) : null}
            <div className="min-w-0">
                <div className="min-w-0">
                    <nav className="mb-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs sm:text-sm text-gray-500">
                        {displayPathnames.map(({ segment, index: originalIndex }, index) => {
                            const to = "/" + pathnames.slice(0, originalIndex + 1).join("/");
                            const isLast = index === displayPathnames.length - 1;

                            return (
                                <span key={to} className="inline-flex items-center">
                                    {!isLast ? (    
                                        <>
                                            <Link to={to} className="hover:text-emerald-700">
                                                {toVietnameseLabel(segment)}
                                            </Link>
                                            <span className="mx-1.5">/</span>
                                        </>
                                    ) : (
                                        <span className="font-semibold text-gray-800">
                                            {toVietnameseLabel(segment)}
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </nav>

                    <h1 className="text-lg font-bold text-gray-900 leading-6">
                        {formatTitle(displayPathnames[displayPathnames.length - 1]?.segment) || "Bảng điều khiển"}
                    </h1>
                </div>
            </div>
            </div>
            <div className="flex w-full items-center justify-end gap-2 lg:w-auto">
              <button
                type="button"
                onClick={() => setIsAiQcModalOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                aria-label="Kiểm tra chất lượng bằng AI"
                title="Kiểm tra chất lượng bằng AI"
              >
                <Sparkles size={14} />
                <span className="hidden sm:inline">AI</span>
              </button>
              <AdminHeaderNotificationBell />
              <AdminHeaderQrMiniScan />
            </div>
        </div>
        {isAiQcModalOpen ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-3 py-4 sm:px-4">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Kiểm tra chất lượng bằng AI</h4>
                  <p className="mt-1 text-xs text-slate-500">Tải ảnh hoặc chụp ảnh để AI đánh giá nhanh.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsAiQcModalOpen(false);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>

              <div className="max-h-[78vh] space-y-3 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
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
                </div>

                {isCameraOpen ? (
                  <div className="space-y-2">
                    <video
                      ref={cameraVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-52 w-full rounded-xl border border-slate-200 bg-black object-cover"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={captureFromCamera}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        <Camera size={14} />
                        Chụp ảnh
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Tắt camera
                      </button>
                    </div>
                  </div>
                ) : null}

                {aiQcImagePreview ? (
                  <img
                    src={aiQcImagePreview}
                    alt="Ảnh kiểm tra chất lượng"
                    className="h-40 w-auto max-w-full rounded-xl border border-slate-200 bg-white object-contain"
                  />
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
                      Độ tin cậy: <span className="font-semibold">{Number(confidencePercent(aiQcResult)).toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      {aiQcResult.label_vi || aiQcResult.label || "—"}
                    </div>
                    <div className="mt-1 text-sm">{stripPercentInMessage(aiQcResult.message_vi)}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        </>
    )
}

export default AdminHeader

export const formatTitle = (str = "") =>
  toVietnameseLabel(str);