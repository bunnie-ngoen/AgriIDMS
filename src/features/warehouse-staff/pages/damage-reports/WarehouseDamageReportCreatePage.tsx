import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera, Search, Send, Upload } from "lucide-react";
import { decodeQrFromImageFile } from "../../../../shared/lib/decodeQrFromImage";
import QrCameraScannerModal from "../../../../shared/components/QrCameraScannerModal";
import { uploadFileToCloudinary } from "../../../../shared/lib/cloudinaryUpload";
import { useLazyGetBoxByQrQuery } from "../../../goods-receipt/api/goods-receipt.api";
import type { BoxByQrResponse } from "../../../goods-receipt/types/goods-receipt.type";
import {
  useCreateDamageReportMutation,
  useLazyHasPendingDamageForBoxQuery,
} from "../../../damage-report/api/damage-report.api";
import type { DamageProcessingOutcome } from "../../../damage-report/types/damage-report.types";
import { outcomeToApiValue } from "../../../damage-report/api/damage-report.api";
import {
  DAMAGE_FORM_LABEL,
  DAMAGE_OUTCOME_LABEL,
  DAMAGE_REPORT_PAGE,
} from "../../../damage-report/constants/damage-report-ui.constants";

export default function WarehouseDamageReportCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [qr, setQr] = useState("");
  const [box, setBox] = useState<BoxByQrResponse | null>(null);
  const [damageType, setDamageType] = useState<DamageProcessingOutcome>("CompleteDamaged");
  const [damagedKgInput, setDamagedKgInput] = useState("");
  const [damageReason, setDamageReason] = useState("");
  const [note, setNote] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isQrCameraOpen, setIsQrCameraOpen] = useState(false);
  const qrImageRef = useRef<HTMLInputElement | null>(null);
  const evidenceFileRef = useRef<HTMLInputElement | null>(null);

  const [triggerBox, { isFetching: findingBox }] = useLazyGetBoxByQrQuery();
  const [checkPending, { data: pendingData }] = useLazyHasPendingDamageForBoxQuery();
  const [createDamageReport, { isLoading: isSubmitting }] = useCreateDamageReportMutation();
  const prefillQr = searchParams.get("qr")?.trim() ?? "";
  const prefillLotCode = searchParams.get("lotCode")?.trim() ?? "";

  const damagedKg = useMemo(() => {
    const raw = damagedKgInput.trim().replace(",", ".");
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }, [damagedKgInput]);

  const goodRemaining = useMemo(() => {
    if (damageType !== "PartialDamaged" || !box) return null;
    if (!Number.isFinite(damagedKg) || damagedKg <= 0) return null;
    return Math.max(0, box.weight - damagedKg);
  }, [damageType, box, damagedKg]);

  useEffect(() => {
    if (!box?.id) return;
    void checkPending(box.id);
  }, [box?.id, checkPending]);

  useEffect(() => {
    if (!prefillQr) return;
    setQr(prefillQr);
    void loadBox(prefillQr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillQr]);

  const blockReason = useMemo(() => {
    if (!box) return null;
    if (pendingData?.hasPending) return "Thùng đang có phiếu hỏng chờ duyệt.";
    if (box.status !== "Stored") return `Thùng không ở trạng thái Stored (hiện: ${box.status}).`;
    if (!box.weight || box.weight <= 0) return "Thùng không còn khối lượng.";
    return null;
  }, [box, pendingData?.hasPending]);

  const canSubmit =
    !!box &&
    !blockReason &&
    damageReason.trim().length > 0 &&
    !!evidenceFile &&
    (damageType === "CompleteDamaged" ||
      (damageType === "PartialDamaged" &&
        Number.isFinite(damagedKg) &&
        damagedKg > 0 &&
        damagedKg <= box.weight));

  const loadBox = async (value: string) => {
    if (!value.trim()) {
      toast.error("Vui lòng nhập mã QR.");
      return;
    }
    try {
      const b = await triggerBox(value.trim()).unwrap();
      setBox(b);
      toast.success(`Đã chọn thùng ${b.boxCode}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "")
          : "";
      toast.error(msg || "Không tìm thấy thùng theo QR.");
      setBox(null);
    }
  };

  const handleSubmit = async () => {
    if (!box || !evidenceFile) return;
    if (blockReason) {
      toast.error(blockReason);
      return;
    }
    if (!damageReason.trim()) {
      toast.error("Vui lòng nhập lý do hỏng.");
      return;
    }
    if (damageType === "PartialDamaged") {
      if (!Number.isFinite(damagedKg) || damagedKg <= 0) {
        toast.error("Nhập khối lượng hỏng hợp lệ (> 0).");
        return;
      }
      if (damagedKg > box.weight) {
        toast.error("Khối lượng hỏng không được vượt quá khối lượng hiện có.");
        return;
      }
    }

    try {
      const loading = toast.loading("Đang tải ảnh chứng cứ…");
      setIsUploadingEvidence(true);
      const evidenceImageUrl = await uploadFileToCloudinary(evidenceFile, {
        folder: "damage-reports",
      });
      toast.dismiss(loading);
      setIsUploadingEvidence(false);

      await createDamageReport({
        targetType: 0,
        targetId: box.id,
        targetCode: box.boxCode,
        productVariantId: box.productVariantId ?? null,
        productName: box.productName ?? box.productVariantName ?? null,
        lotId: box.lotId ?? null,
        lotCode: box.lotCode ?? null,
        warehouseId: box.warehouseId ?? null,
        warehouseName: box.warehouseName ?? null,
        damageReason: damageReason.trim(),
        damagePercent: 0,
        suggestedDiscountPercent: 0,
        requestedProcessingOutcome: outcomeToApiValue(damageType),
        requestedDamagedWeightKg: damageType === "PartialDamaged" ? damagedKg : null,
        note: note.trim() ? note.trim() : null,
        evidenceImageUrl,
      }).unwrap();

      toast.success("Đã gửi phiếu báo hỏng.");
      navigate("/warehouse/damage-reports");
    } catch (err: unknown) {
      setIsUploadingEvidence(false);
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "")
          : "";
      toast.error(msg || "Không gửi được phiếu.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link
          to="/warehouse/damage-reports"
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          ← {DAMAGE_FORM_LABEL.backToList}
        </Link>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{DAMAGE_REPORT_PAGE.warehouseCreateTitle}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Chọn thùng bằng QR, chọn loại hỏng, nhập lý do và gửi phiếu.
        </p>
        {prefillLotCode ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Đang xử lý từ lô <span className="font-semibold">{prefillLotCode}</span>. Vui lòng quét/chọn thùng thuộc lô này để tạo phiếu.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600">Quét / nhập QR thùng</label>
          <div className="mt-1 flex flex-wrap gap-2">
            <input
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              placeholder="QR thùng…"
              className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void loadBox(qr)}
              disabled={findingBox}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Search className="inline" size={16} />
            </button>
            <button
              type="button"
              onClick={() => qrImageRef.current?.click()}
              className="rounded-lg border border-slate-300 px-3 py-2"
              title="Ảnh QR"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsQrCameraOpen(true)}
              className="rounded-lg border border-slate-300 px-3 py-2"
              title="Camera"
            >
              <Camera size={16} />
            </button>
            <input
              ref={qrImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                const t = await decodeQrFromImageFile(f);
                if (!t) {
                  toast.error("Không đọc được QR.");
                  return;
                }
                setQr(t);
                await loadBox(t);
              }}
            />
          </div>
        </div>

        {box ? (
          <div
            className={`rounded-lg border p-3 text-sm ${
              blockReason ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            <div className="font-semibold">{DAMAGE_FORM_LABEL.box}: {box.boxCode}</div>
            <div className="mt-1 grid gap-1 text-xs sm:grid-cols-2">
              <div>
                {DAMAGE_FORM_LABEL.product}: {box.productName ?? box.productVariantName ?? "—"}
              </div>
              <div>
                {DAMAGE_FORM_LABEL.lot}: {box.lotCode ?? "—"}
              </div>
              <div>
                {DAMAGE_FORM_LABEL.currentWeight}: <strong>{box.weight} kg</strong>
              </div>
              <div>
                {DAMAGE_FORM_LABEL.boxStatus}: <strong>{box.status}</strong>
              </div>
            </div>
            {blockReason ? <div className="mt-2 font-medium">{blockReason}</div> : null}
          </div>
        ) : null}

        <div>
          <label className="text-xs font-medium text-slate-600">{DAMAGE_FORM_LABEL.damageType} *</label>
          <select
            value={damageType}
            onChange={(e) => setDamageType(e.target.value as DamageProcessingOutcome)}
            disabled={!box || !!blockReason}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          >
            <option value="CompleteDamaged">{DAMAGE_OUTCOME_LABEL.CompleteDamaged}</option>
            <option value="PartialDamaged">{DAMAGE_OUTCOME_LABEL.PartialDamaged}</option>
          </select>
        </div>

        {damageType === "PartialDamaged" && box && !blockReason ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600">{DAMAGE_FORM_LABEL.damagedQty} *</label>
              <input
                type="number"
                min={0.001}
                step="0.001"
                value={damagedKgInput}
                onChange={(e) => setDamagedKgInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              {Number.isFinite(damagedKg) && damagedKg > box.weight ? (
                <p className="mt-1 text-xs text-rose-600">Vượt quá khối lượng hiện có.</p>
              ) : null}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">{DAMAGE_FORM_LABEL.goodQty}</label>
              <input
                readOnly
                value={goodRemaining != null ? `${goodRemaining.toFixed(3)}` : "—"}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
              />
            </div>
          </div>
        ) : null}

        {damageType === "CompleteDamaged" && box && !blockReason ? (
          <div>
            <label className="text-xs font-medium text-slate-600">{DAMAGE_FORM_LABEL.damagedQty}</label>
            <input
              readOnly
              value={`${box.weight} kg (toàn bộ thùng)`}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
          </div>
        ) : null}

        <div>
          <label className="text-xs font-medium text-slate-600">{DAMAGE_FORM_LABEL.reason} *</label>
          <textarea
            value={damageReason}
            onChange={(e) => setDamageReason(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Mô tả hư hỏng…"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Ghi chú thêm</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">{DAMAGE_FORM_LABEL.evidence} *</label>
          <input
            ref={evidenceFileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Link
            to="/warehouse/damage-reports"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </Link>
          <button
            type="button"
            disabled={!canSubmit || isSubmitting || isUploadingEvidence}
            onClick={() => void handleSubmit()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send size={16} />
            {DAMAGE_FORM_LABEL.submit}
          </button>
        </div>
      </div>

      <QrCameraScannerModal
        open={isQrCameraOpen}
        title="Quét QR thùng"
        onClose={() => setIsQrCameraOpen(false)}
        onDetected={(v) => {
          setQr(v);
          void loadBox(v);
        }}
      />
    </div>
  );
}
