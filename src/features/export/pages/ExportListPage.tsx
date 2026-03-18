import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileOutput, CirclePlus, Search } from "lucide-react";

export default function ExportListPage() {
    const navigate = useNavigate();
    const [exportId, setExportId] = useState("");

    const handleGoToDetail = (e: React.FormEvent) => {
        e.preventDefault();
        const id = parseInt(exportId.trim(), 10);
        if (Number.isFinite(id) && id > 0) {
            navigate(`/admin/exports/${id}`);
        }
    };

    return (
        <div className="max-w-lg mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
                <FileOutput className="text-[#1a5f2a]" size={28} />
                <h1 className="text-2xl font-semibold text-slate-800">Phiếu xuất kho</h1>
            </div>

            <div className="space-y-4">
                <Link
                    to="/admin/exports/create"
                    className="flex items-center gap-3 w-full p-4 rounded-2xl border-2 border-[#1a5f2a] bg-[#1a5f2a]/5 text-[#1a5f2a] font-medium hover:bg-[#1a5f2a]/10 transition-colors"
                >
                    <CirclePlus size={24} />
                    Tạo phiếu xuất (nhập mã đơn hàng)
                </Link>

                <form onSubmit={handleGoToDetail} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                    <p className="text-sm text-slate-600 mb-3">Xem chi tiết phiếu xuất theo mã phiếu</p>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min={1}
                            value={exportId}
                            onChange={(e) => setExportId(e.target.value)}
                            placeholder="Mã phiếu xuất"
                            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-[#1a5f2a] focus:ring-1 focus:ring-[#1a5f2a]"
                        />
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-800"
                        >
                            <Search size={18} />
                            Xem
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
