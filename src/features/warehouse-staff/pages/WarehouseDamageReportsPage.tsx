import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Camera, Search, Send, Upload } from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import { decodeQrFromImageFile } from "../../../shared/lib/decodeQrFromImage";
import QrCameraScannerModal from "../../../shared/components/QrCameraScannerModal";
import { uploadFileToCloudinary } from "../../../shared/lib/cloudinaryUpload";
import {
  useLazyGetBoxByQrQuery,
  useLazyGetLotByQrQuery,
} from "../../goods-receipt/api/goods-receipt.api";
import {
  useCreateDamageReportMutation,
  useGetDamageReportsQuery,
} from "../../manager/api/damage-report.api";

type TargetType = "Box" | "Lot";

export default function WarehouseDamageReportsPage() {
  const auth = useAuth();
  const [targetType, setTargetType] = useState<TargetType>("Box");
  const [qr, setQr] = useState("");
  const [damageReason, setDamageReason] = useState("Hỏng do va đập");
  const [damagePercent, setDamagePercent] = useState(20);
  const [suggestedDiscountPercent, setSuggestedDiscountPercent] = useState(20);
  const [note, setNote] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isQrCameraOpen, setIsQrCameraOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{
    targetId: number;
    targetCode: string;
    productVariantId: number | null;
    productName: string | null;
    lotId: number | null;
    lotCode: string | null;
    warehouseId: number | null;
    warehouseName: string | null;
  } | null>(null);
  const qrImageRef = useRef<HTMLInputElement | null>(null);
  const evidenceFileRef = useRef<HTMLInputElement | null>(null);

  const [triggerBox, { isFetching: findingBox }] = useLazyGetBoxByQrQuery();
  const [triggerLot, { isFetching: findingLot }] = useLazyGetLotByQrQuery();
  const [createDamageReport, { isLoading: isSubmitting }] = useCreateDamageReportMutation();
  const { data: reports = [] } = useGetDamageReportsQuery();
  const isFinding = findingBox || findingLot;
  const isBusy = isSubmitting || isUploadingEvidence;

  const myReports = useMemo(() => {
    const me = auth.user?.id;
    return reports.filter((r) => r.reportedByUserId === me);
  }, [auth.user?.id, reports]);
  const evidencePreviewUrl = useMemo(
    () => (evidenceFile ? URL.createObjectURL(evidenceFile) : null),
    [evidenceFile],
  );

  useEffect(() => {
    if (!evidencePreviewUrl) return;
    return () => URL.revokeObjectURL(evidencePreviewUrl);
  }, [evidencePreviewUrl]);

  const handleFindByQrWithValue = async (value: string) => {
    if (!value.trim()) {
      toast.error("Vui lòng nhập mã QR.");
      return;
    }
    try {
      if (targetType === "Box") {
        const box = await triggerBox(value.trim()).unwrap();
        setSelectedTarget({
          targetId: box.id,
          targetCode: box.boxCode,
          productVariantId: box.productVariantId ?? null,
          productName: box.productName ?? null,
          lotId: box.lotId ?? null,
          lotCode: box.lotCode ?? null,
          warehouseId: box.warehouseId ?? null,
          warehouseName: box.warehouseName ?? null,
        });
        toast.success(`Đã chọn thùng ${box.boxCode}`);
        return;
      }

      const lot = await triggerLot(value.trim()).unwrap();
      setSelectedTarget({
        targetId: lot.id,
        targetCode: lot.lotCode,
        productVariantId: lot.productVariantId ?? null,
        productName: lot.productName ?? null,
        lotId: lot.id,
        lotCode: lot.lotCode,
        warehouseId: lot.warehouseId ?? null,
        warehouseName: null,
      });
      toast.success(`Đã chọn lô ${lot.lotCode}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Không tìm thấy dữ liệu theo QR.");
    }
  };

  const handleFindByQr = async () => {
    await handleFindByQrWithValue(qr);
  };

  const handleQrFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const loading = toast.loading("Đang đọc QR từ ảnh...");
    try {
      const text = await decodeQrFromImageFile(file);
      if (!text) {
        toast.error("Không tìm thấy QR trong ảnh.", { id: loading });
        return;
      }
      setQr(text);
      await handleFindByQrWithValue(text);
      toast.success("Đã đọc QR từ ảnh.", { id: loading });
    } catch {
      toast.error("Không đọc được QR từ ảnh.", { id: loading });
    }
  };

  const handleSubmit = async () => {
    if (!auth.user) {
      toast.error("Không xác định được tài khoản đăng nhập.");
      return;
    }
    if (!selectedTarget) {
      toast.error("Vui lòng quét QR và chọn đối tượng hỏng.");
      return;
    }
    if (!damageReason.trim()) {
      toast.error("Vui lòng nhập lý do hỏng.");
      return;
    }
    if (!evidenceFile) {
      toast.error("Vui lòng đính kèm ảnh minh chứng vấn đề trước khi gửi.");
      return;
    }
    const validDamage = Math.max(0, Math.min(100, Number(damagePercent) || 0));
    const validDiscount = Math.max(0, Math.min(100, Number(suggestedDiscountPercent) || 0));

    try {
      const loading = toast.loading("Đang tải ảnh minh chứng...");
      setIsUploadingEvidence(true);
      const evidenceImageUrl = await uploadFileToCloudinary(evidenceFile, {
        folder: "damage-reports",
      });
      toast.success("Đã tải ảnh minh chứng.", { id: loading });
      setIsUploadingEvidence(false);

      await createDamageReport({
        targetType: targetType === "Box" ? 0 : 1,
        targetId: selectedTarget.targetId,
        targetCode: selectedTarget.targetCode,
        productVariantId: selectedTarget.productVariantId,
        productName: selectedTarget.productName,
        lotId: selectedTarget.lotId,
        lotCode: selectedTarget.lotCode,
        warehouseId: selectedTarget.warehouseId,
        warehouseName: selectedTarget.warehouseName,
        damageReason: damageReason.trim(),
        damagePercent: validDamage,
        suggestedDiscountPercent: validDiscount,
        note: note.trim() ? note.trim() : null,
        evidenceImageUrl,
      }).unwrap();
      toast.success("Đã gửi phiếu hỏng, chờ quản lý/admin duyệt.");
      setQr("");
      setNote("");
      setEvidenceFile(null);
      if (evidenceFileRef.current) evidenceFileRef.current.value = "";
      setSelectedTarget(null);
    } catch (err: any) {
      setIsUploadingEvidence(false);
      toast.error(err?.data?.message ?? "Không gửi được phiếu hỏng.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Báo hỏng thùng/lô và đề xuất giảm giá</h2>
        <p className="mt-1 text-sm text-slate-600">
          Khi phát hiện hàng hỏng, tạo phiếu ngay để quản lý/admin kiểm tra và áp mức giảm giá.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value as TargetType);
                setSelectedTarget(null);
              }}
              className="min-w-[110px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="Box">Thùng</option>
              <option value="Lot">Lô</option>
            </select>
            <input
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              placeholder="Nhập/quét QR..."
              className="min-w-[220px] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void handleFindByQr()}
              disabled={isFinding}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              title="Tìm theo QR"
            >
              <Search size={16} />
            </button>
            <button
              type="button"
              onClick={() => qrImageRef.current?.click()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              title="Tải ảnh QR"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsQrCameraOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              title="Quét QR bằng camera"
            >
              <Camera size={16} />
            </button>
            <input
              ref={qrImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleQrFromImage}
            />
          </div>
          {isFinding ? <div className="mt-2 text-xs text-slate-500">Đang tìm theo mã QR...</div> : null}
        </div>

        {selectedTarget ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="font-semibold">Đã chọn: {selectedTarget.targetCode}</div>
            <div className="mt-1">
              Sản phẩm: {selectedTarget.productName ?? "—"} · Lô: {selectedTarget.lotCode ?? "—"}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Lý do hỏng</label>
            <input
              value={damageReason}
              onChange={(e) => setDamageReason(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Mức hỏng (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={damagePercent}
              onChange={(e) => setDamagePercent(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Đề xuất giảm giá (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={suggestedDiscountPercent}
              onChange={(e) => setSuggestedDiscountPercent(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Ghi chú thêm</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="Ví dụ: phát hiện mốc nhẹ ở 1/3 số thùng..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Ảnh minh chứng (bắt buộc)</label>
          <input
            ref={evidenceFileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          {evidenceFile ? (
            <div className="mt-2 space-y-2 text-xs text-slate-600">
              <div>
                Đã chọn: <span className="font-semibold text-slate-800">{evidenceFile.name}</span>
              </div>
              {evidencePreviewUrl ? (
                <img
                  src={evidencePreviewUrl}
                  alt="Xem trước ảnh minh chứng"
                  className="h-28 w-28 rounded-lg border border-slate-200 object-cover"
                />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setEvidenceFile(null);
                  if (evidenceFileRef.current) evidenceFileRef.current.value = "";
                }}
                className="text-rose-700 underline"
              >
                Gỡ ảnh
              </button>
            </div>
          ) : (
            <div className="mt-2 text-xs text-rose-600">Bạn cần chọn ảnh để gửi phiếu.</div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <Send size={14} />
            {isUploadingEvidence ? "Đang tải ảnh..." : isSubmitting ? "Đang gửi..." : "Gửi phiếu hỏng"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Phiếu bạn đã gửi</div>
        <div className="mt-3 space-y-2">
          {myReports.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có phiếu nào.</div>
          ) : (
            myReports.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-slate-900">
                    {r.targetType === "Box" ? "Thùng" : "Lô"} {r.targetCode}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                      r.status === "Pending"
                        ? "bg-amber-100 text-amber-700"
                        : r.status === "Approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {r.status === "Pending"
                      ? "Chờ duyệt"
                      : r.status === "Approved"
                        ? "Đã duyệt"
                        : "Từ chối"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Lý do: {r.damageReason} · Đề xuất giảm: {r.suggestedDiscountPercent}%
                </div>
                {r.evidenceImageUrl ? (
                  <a href={r.evidenceImageUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                    <img
                      src={r.evidenceImageUrl}
                      alt={`Minh chứng ${r.targetCode}`}
                      className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                    />
                  </a>
                ) : null}
                {r.status !== "Pending" ? (
                  <div className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600">
                    <AlertTriangle size={12} />
                    {r.status === "Approved"
                      ? `Mức giảm đã áp: ${r.appliedDiscountPercent ?? 0}%`
                      : `Lý do từ chối: ${r.reviewNote ?? "—"}`}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <QrCameraScannerModal
        open={isQrCameraOpen}
        title={`Quét QR ${targetType === "Box" ? "thùng" : "lô"} hỏng`}
        onClose={() => setIsQrCameraOpen(false)}
        onDetected={(value) => {
          setQr(value);
          void handleFindByQrWithValue(value);
        }}
      />
    </div>
  );
}
