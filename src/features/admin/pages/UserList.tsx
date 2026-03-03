import { useState } from "react";
import {
  useGetUsersQuery,
  useDeleteUserMutation,
} from "../api/create-user.api";
import type { UserListItem } from "../types/user.type";
import { Trash2 } from "lucide-react";

const PAGE_SIZE = 10;

const UserList = () => {
  const [pageIndex, setPageIndex] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useGetUsersQuery({
    pageIndex,
    pageSize: PAGE_SIZE,
  });

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const handleDelete = async (user: UserListItem) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa user "${user.userName}"?`
    );
    if (!ok) return;

    try {
      await deleteUser(user.id).unwrap();
      await refetch();
    } catch (error) {
      console.error("Delete user failed:", error);
    }
  };

  const hasPrev = (data?.pageIndex ?? 1) > 1;
  const hasNext =
    (data?.pageIndex ?? 1) < (data?.totalPages ?? 1);

  return (
    <div className="px-5">
      <div className="bg-white rounded-[15px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Danh sách người dùng
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý tài khoản người dùng trong hệ thống.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            {isFetching && <span>Đang tải...</span>}
          </div>
        </div>

        {isError && (
          <p className="text-red-500 text-sm mb-3">
            Không tải được danh sách người dùng. Vui lòng thử lại.
          </p>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">UserName</th>
                <th className="px-4 py-2 text-left font-medium">Họ tên</th>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-left font-medium">Loại user</th>
                <th className="px-4 py-2 text-right font-medium">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-2">{user.userName}</td>
                    <td className="px-4 py-2">{user.fullName}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        {user.userType}
                      </span>
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
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Không có người dùng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs">
            <p className="text-slate-500">
              Trang {data.pageIndex} / {data.totalPages} —{" "}
              {data.totalItems} người dùng
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() =>
                  hasPrev && setPageIndex((p) => Math.max(1, p - 1))
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={() =>
                  hasNext && setPageIndex((p) => p + 1)
                }
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

