import { useState } from "react";
import { useGetDeletedUsersQuery, useRestoreUserMutation } from "../api/create-user.api";
import type { UserListItem } from "../types/user.type";
import { RotateCcw, AlertTriangle, UserX, Search, X } from "lucide-react";
import toast from "react-hot-toast";

type ConfirmState = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
};
const CONFIRM_INITIAL: ConfirmState = { open: false, title: "", description: "", onConfirm: () => {} };

const ConfirmModal = ({ open, title, description, onConfirm, onCancel }: ConfirmState & { onCancel: () => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <RotateCcw size={22} className="text-emerald-600" />
        </div>
        <h3 className="text-center text-sm font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-center text-xs text-slate-500 mb-6">{description}</p>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Hủy
          </button>
          <button onClick={onConfirm}
            className="flex-1 rounded-lg py-2 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">
            Khôi phục
          </button>
        </div>
      </div>
    </div>
  );
};

const DeletedUserList = () => {
  const { data, isLoading, isError } = useGetDeletedUsersQuery();
  const [restoreUser, { isLoading: isRestoring }] = useRestoreUserMutation();
  const [confirm, setConfirm] = useState<ConfirmState>(CONFIRM_INITIAL);
  const [searchInput] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  const closeConfirm = () => setConfirm(CONFIRM_INITIAL);

  const filtered = (data ?? []).filter((u) => {
    const matchName =
      searchInput.trim() === "" ||
      u.userName.toLowerCase().includes(searchInput.toLowerCase()) ||
      (u.fullName ?? "").toLowerCase().includes(searchInput.toLowerCase());
    const matchEmail =
      emailFilter.trim() === "" ||
      (u.email ?? "").toLowerCase().includes(emailFilter.toLowerCase());
    return matchName && matchEmail;
  });

  const handleRestore = (user: UserListItem) => {
    setConfirm({
      open: true,
      title: "Khôi phục tài khoản",
      description: `Bạn có chắc muốn khôi phục tài khoản "${user.userName}"?`,
      onConfirm: async () => {
        closeConfirm();
        const toastId = toast.loading("Đang khôi phục...");
        try {
          await restoreUser(user.id).unwrap();
          toast.success("Khôi phục thành công!", { id: toastId });
        } catch {
          toast.error("Khôi phục thất bại!", { id: toastId });
        }
      },
    });
  };

  return (
    <div className="px-5">
      <ConfirmModal {...confirm} onCancel={closeConfirm} />

      <div className="bg-white rounded-[15px] p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
              <UserX size={18} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Tài khoản đã xóa</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {data?.length ?? 0} tài khoản đang bị xóa mềm
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center gap-2 mb-4">

          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Lọc theo email..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-100"
            />
            {emailFilter && (
              <button onClick={() => setEmailFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {isError && (
          <div className="flex items-center gap-2 px-4 py-3 mb-3 rounded-lg bg-red-50 border border-red-100">
            <AlertTriangle size={14} className="text-red-500" />
            <p className="text-xs text-red-500">Không tải được danh sách. Vui lòng thử lại.</p>
          </div>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">UserName</th>
                <th className="px-4 py-2.5 text-left font-medium">Họ tên</th>
                <th className="px-4 py-2.5 text-left font-medium">Email</th>
                <th className="px-4 py-2.5 text-left font-medium">Role</th>
                <th className="px-4 py-2.5 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100 animate-pulse">
                    <td className="px-4 py-3"><div className="h-3 w-24 rounded bg-slate-100" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-28 rounded bg-slate-100" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-36 rounded bg-slate-100" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-20 rounded bg-slate-100" /></td>
                    <td className="px-4 py-3"><div className="h-6 w-20 rounded-lg bg-slate-100 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-slate-700">{user.userName}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{user.fullName}</td>
                    <td className="px-4 py-2.5 text-slate-500">{user.email}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {user.roles?.[0] ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleRestore(user)}
                        disabled={isRestoring}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw size={11} />
                        Khôi phục
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <UserX size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-400">
                        {searchInput || emailFilter ? "Không tìm thấy kết quả" : "Không có tài khoản nào bị xóa"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeletedUserList;