import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileOutput, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useCreateExportReceiptMutation } from "../api/export.api";

export default function CreateExportReceiptPage() {
    const navigate = useNavigate();
    const [orderId, setOrderId] = useState<string>("");
    const [createExport, { isLoading }] = useCreateExportReceiptMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = parseInt(orderId.trim(), 10);
        if (!Number.isFinite(id) || id < 1) {
            toast.error("Mã đơn hàng phải là số nguyên dương.");
            return;
        }
        const t = toast.loading("Đang tạo phiếu xuất kho...");
        try {
            const result = await createExport({ orderId: id }).unwrap();
            toast.success(`Đã tạo phiếu xuất ${result.exportCode}.`, { id: t });
            navigate(`/admin/exports/${result.id}`);
        } catch (err: unknown) {
            const msg = (err as { data?: { error?: string } })?.data?.error ?? "Không thể tạo phiếu xuất. Đơn hàng phải đã thanh toán (Paid).";
            toast.error(msg, { id: t });
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
                <Link
                    to="/admin/exports"
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center gap-2">
                    <FileOutput className="text-[#1a5f2a]" size={24} />
                    <h1 className="text-xl font-semibold text-slate-800">Tạo phiếu xuất kho</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p className="text-sm text-slate-600 mb-4">
                    Nhập mã đơn hàng đã thanh toán (Paid) để tạo phiếu xuất. Hệ thống sẽ tạo phiếu và danh sách box cần xuất.
                </p>
                <div className="mb-4">
                    <label htmlFor="orderId" className="block text-sm font-medium text-slate-700 mb-1">
                        Mã đơn hàng
                    </label>
                    <input
                        id="orderId"
                        type="number"
                        min={1}
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-[#1a5f2a] focus:ring-1 focus:ring-[#1a5f2a]"
                        placeholder="Ví dụ: 1"
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a5f2a] text-white font-medium py-2.5 hover:bg-[#145026] disabled:opacity-60"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Đang tạo...
                        </>
                    ) : (
                        "Tạo phiếu xuất"
                    )}
                </button>
            </form>
        </div>
    );
}
