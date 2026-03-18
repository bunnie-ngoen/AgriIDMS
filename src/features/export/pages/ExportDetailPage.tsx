import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileOutput, Loader2, Package, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
    useGetExportReceiptQuery,
    useConfirmPickMutation,
    useApproveExportMutation,
    useCancelExportMutation,
} from "../api/export.api";

const STATUS_PENDING_PICK = "PendingPick";
const STATUS_READY_TO_EXPORT = "ReadyToExport";
const STATUS_APPROVED = "Approved";
const STATUS_CANCELLED = "Cancelled";

export default function ExportDetailPage() {
    const { id } = useParams<{ id: string }>();
    const exportId = id ? parseInt(id, 10) : 0;
    const { data: receipt, isLoading, isError } = useGetExportReceiptQuery(exportId, { skip: exportId < 1 });
    const [confirmPick, { isLoading: isConfirming }] = useConfirmPickMutation();
    const [approveExport, { isLoading: isApproving }] = useApproveExportMutation();
    const [cancelExport, { isLoading: isCancelling }] = useCancelExportMutation();

    const handleConfirmPick = async () => {
        const t = toast.loading("Đang xác nhận đã lấy hàng...");
        try {
            await confirmPick(exportId).unwrap();
            toast.success("Đã xác nhận lấy hàng. Phiếu chuyển sang ReadyToExport.", { id: t });
        } catch (e: unknown) {
            const msg = (e as { data?: { error?: string } })?.data?.error ?? "Thao tác thất bại.";
            toast.error(msg, { id: t });
        }
    };

    const handleApprove = async () => {
        const t = toast.loading("Đang duyệt phiếu xuất...");
        try {
            await approveExport(exportId).unwrap();
            toast.success("Đã duyệt phiếu xuất. Đơn hàng chuyển sang Shipping.", { id: t });
        } catch (e: unknown) {
            const msg = (e as { data?: { error?: string } })?.data?.error ?? "Thao tác thất bại.";
            toast.error(msg, { id: t });
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("Bạn có chắc muốn hủy phiếu xuất này?")) return;
        const t = toast.loading("Đang hủy phiếu xuất...");
        try {
            await cancelExport(exportId).unwrap();
            toast.success("Đã hủy phiếu xuất.", { id: t });
        } catch (e: unknown) {
            const msg = (e as { data?: { error?: string } })?.data?.error ?? "Thao tác thất bại.";
            toast.error(msg, { id: t });
        }
    };

    if (exportId < 1) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 text-center text-slate-600">
                Mã phiếu xuất không hợp lệ. <Link to="/admin/exports" className="text-[#1a5f2a] underline">Quay lại</Link>.
            </div>
        );
    }

    if (isLoading || !receipt) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 flex items-center justify-center gap-2 text-slate-600">
                <Loader2 size={24} className="animate-spin" />
                Đang tải...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 text-center text-red-600">
                Không tải được phiếu xuất. <Link to="/admin/exports" className="text-[#1a5f2a] underline">Quay lại</Link>.
            </div>
        );
    }

    const status = receipt.status;
    const canConfirmPick = status === STATUS_PENDING_PICK;
    const canApprove = status === STATUS_READY_TO_EXPORT;
    const canCancel = status !== STATUS_APPROVED && status !== STATUS_CANCELLED;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
                <Link
                    to="/admin/exports"
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center gap-2">
                    <FileOutput className="text-[#1a5f2a]" size={24} />
                    <h1 className="text-xl font-semibold text-slate-800">Phiếu xuất #{receipt.exportCode}</h1>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                            <dt className="text-slate-500">Mã phiếu</dt>
                            <dd className="font-medium text-slate-800">{receipt.exportCode}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Đơn hàng</dt>
                            <dd className="font-medium text-slate-800">#{receipt.orderId}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Trạng thái</dt>
                            <dd>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                    {receipt.status}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Ngày tạo</dt>
                            <dd className="text-slate-700">{receipt.createdAt ? new Date(receipt.createdAt).toLocaleString("vi-VN") : "—"}</dd>
                        </div>
                    </dl>
                </div>

                {receipt.details && receipt.details.length > 0 && (
                    <div className="p-5 border-t border-slate-100">
                        <h2 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                            <Package size={16} />
                            Chi tiết box ({receipt.details.length})
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-500 border-b border-slate-200">
                                        <th className="pb-2 pr-3">Box</th>
                                        <th className="pb-2 pr-3">Số lượng</th>
                                        <th className="pb-2">Trạng thái box</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receipt.details.map((d) => (
                                        <tr key={d.id} className="border-b border-slate-100">
                                            <td className="py-2 pr-3 font-medium text-slate-800">{d.boxCode}</td>
                                            <td className="py-2 pr-3">{d.actualQuantity}</td>
                                            <td className="py-2">{d.boxStatus}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {canConfirmPick && (
                    <div className="p-5 border-t border-slate-100 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleConfirmPick}
                            disabled={isConfirming}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-60"
                        >
                            {isConfirming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            Xác nhận đã lấy hàng
                        </button>
                    </div>
                )}
                {canApprove && (
                    <div className="p-5 border-t border-slate-100 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleApprove}
                            disabled={isApproving}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a5f2a] text-white font-medium hover:bg-[#145026] disabled:opacity-60"
                        >
                            {isApproving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            Duyệt phiếu xuất
                        </button>
                    </div>
                )}
                {canCancel && (
                    <div className="p-5 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-300 text-red-700 font-medium hover:bg-red-50 disabled:opacity-60"
                        >
                            {isCancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                            Hủy phiếu xuất
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
