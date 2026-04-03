import { useMemo, useState } from "react";
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useUpdateUserRoleMutation,
} from "../api/create-user.api";
import type { UserListItem } from "../types/user.type";
import { Trash2, Search, X, ShieldCheck, AlertTriangle } from "lucide-react";

const PAGE_SIZE = 10;

type UserStatus = 1 | 2 | 3;

type StatusConfig = {
  label: string;
  color: string;
  bg: string;
  border: string;
};

const STATUS_CONFIG: Record<UserStatus, StatusConfig> = {
  1: { label: "Active", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  2: { label: "Inactive", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  3: { label: "Locked", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
};

const ROLES = ["Manager", "PurchasingStaff", "WarehouseStaff", "SalesStaff", "Customer"];

const toUserStatus = (status?: number): UserStatus => {
  if (status === 1 || status === 2 || status === 3) return status;
  return 1;
};

// ── Confirm Modal ────────────────────────────────────────────
const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "primary",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${variant === "danger" ? "bg-red-100" : "bg-blue-100"}`}>
          <AlertTriangle size={22} className={variant === "danger" ? "text-red-600" : "text-blue-600"} />
        </div>
        <h3 className="text-center text-sm font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-center text-xs text-slate-500 mb-6">{description}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-lg py-2 text-xs font-medium text-white transition-colors ${variant === "danger"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Status Dropdown ──────────────────────────────────────────
const StatusDropdown = ({
  user,
  onStatusChange,
  isUpdating,
}: {
  user: UserListItem;
  onStatusChange: (id: string, status: UserStatus) => void;
  isUpdating: boolean;
}) => {
  const currentStatus = toUserStatus(user.status);
  const config = STATUS_CONFIG[currentStatus];

  return (
    <select
      value={currentStatus}
      disabled={isUpdating}
      onChange={(e) => {
        const next = Number(e.target.value) as UserStatus;
        if (next !== currentStatus) onStatusChange(user.id, next);
      }}
      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-opacity disabled:opacity-50 ${config.color} ${config.bg} ${config.border}`}
    >
      {(Object.keys(STATUS_CONFIG) as unknown as UserStatus[]).map((key) => {
        const numKey = Number(key) as UserStatus;
        const cfg = STATUS_CONFIG[numKey];
        return (
          <option key={numKey} value={numKey}>
            {cfg.label}
          </option>
        );
      })}
    </select>
  );
};

// ── Role Dropdown ────────────────────────────────────────────
const RoleDropdown = ({
  user,
  onRoleChange,
  isUpdating,
}: {
  user: UserListItem;
  onRoleChange: (id: string, roleName: string) => void;
  isUpdating: boolean;
}) => {
  const current = user.roles?.[0] ?? "Customer";

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
      <ShieldCheck size={11} />
      <select
        value={current}
        disabled={isUpdating}
        onChange={(e) => {
          const next = e.target.value;
          if (next !== current) onRoleChange(user.id, next);
        }}
        className="bg-transparent outline-none"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────
type ConfirmState = {
  open: boolean;
  title: string;
  description: string;
  variant: "primary" | "danger";
  onConfirm: () => void;
};

const CONFIRM_INITIAL: ConfirmState = {
  open: false, title: "", description: "", variant: "primary", onConfirm: () => { },
};

const UserList = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [searchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState>(CONFIRM_INITIAL);

  const { data, isLoading, isError, refetch, isFetching } = useGetUsersQuery(
    { pageIndex, pageSize: PAGE_SIZE, search: searchQuery },
    { refetchOnMountOrArgChange: true }
  );

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [updateUserStatus, { isLoading: isUpdatingStatus }] = useUpdateUserStatusMutation();
  const [updateUserRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();

  // ── Client-side email filter ─────────────────────────────
  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    const nonAdminItems = items.filter((u) =>
      !u.roles?.some((r) => r.toLowerCase() === "admin")
    );
    const q = emailFilter.toLowerCase().trim();
    if (!q) return nonAdminItems;
    return nonAdminItems.filter((u) =>
      (u.email ?? "").toLowerCase().includes(q)
    );
  }, [data?.items, emailFilter]);

  const closeConfirm = () => setConfirm(CONFIRM_INITIAL);

  const handleSearch = () => { setPageIndex(1); setSearchQuery(searchInput.trim()); };

  const handleDelete = (user: UserListItem) => {
    setConfirm({
      open: true,
      title: "Xóa người dùng",
      description: `Bạn có chắc muốn xóa "${user.userName}"? Hành động này không thể hoàn tác.`,
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try { await deleteUser(user.id).unwrap(); refetch(); }
        catch (error) { console.error("Delete user failed:", error); }
      },
    });
  };

  const handleStatusChange = (id: string, status: UserStatus) => {
    const labelMap: Record<UserStatus, string> = {
      1: "Active", 2: "Inactive", 3: "Locked"
    };
    setConfirm({
      open: true,
      title: "Thay đổi trạng thái",
      description: `Bạn có chắc muốn đổi trạng thái thành "${labelMap[status]}"?`,
      variant: "primary",
      onConfirm: async () => {
        closeConfirm();
        try { await updateUserStatus({ id, status: Number(status) as UserStatus }).unwrap(); refetch(); }
        catch (error) { console.error("Update status failed:", error); }
      },
    });
  };

  const handleRoleChange = (id: string, roleName: string) => {
    setConfirm({
      open: true,
      title: "Thay đổi role",
      description: `Bạn có chắc muốn đổi role thành "${roleName}"?`,
      variant: "primary",
      onConfirm: async () => {
        closeConfirm();
        try { await updateUserRole({ id, roleName }).unwrap(); refetch(); }
        catch (error) { console.error("Update role failed:", error); }
      },
    });
  };

  const hasPrev = (data?.pageIndex ?? 1) > 1;
  const hasNext = (data?.pageIndex ?? 1) < (data?.totalPages ?? 1);

  return (
    <div className="px-5">
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        variant={confirm.variant}
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />

      <div className="bg-white rounded-[15px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Danh sách người dùng</h1>
            <p className="text-xs text-slate-500 mt-1">Quản lý tài khoản người dùng trong hệ thống.</p>
          </div>
          <div className="text-xs text-slate-500">{isFetching && <span>Đang tải...</span>}</div>
        </div>

        {/* Search bars */}
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
              <button type="button" onClick={() => setEmailFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Search size={13} />
            Tìm kiếm
          </button>

        </div>

        {isError && <p className="text-red-500 text-sm mb-3">Không tải được danh sách người dùng. Vui lòng thử lại.</p>}

        <div className="overflow-x-auto overflow-y-visible border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">UserName</th>
                <th className="px-4 py-2 text-left font-medium">Họ tên</th>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-left font-medium">Role</th>
                <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                <th className="px-4 py-2 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2">{user.userName}</td>
                    <td className="px-4 py-2">{user.fullName}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      <RoleDropdown user={user} onRoleChange={handleRoleChange} isUpdating={isUpdatingRole} />
                    </td>
                    <td className="px-4 py-2">
                      <StatusDropdown user={user} onStatusChange={handleStatusChange} isUpdating={isUpdatingStatus} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={isDeleting}
                        className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    {searchQuery || emailFilter
                      ? "Không tìm thấy kết quả phù hợp."
                      : "Không có người dùng nào."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs">
            <p className="text-slate-500">
              Trang {data.pageIndex} / {data.totalPages} — {data.totalItems} người dùng
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() => hasPrev && setPageIndex((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={() => hasNext && setPageIndex((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;