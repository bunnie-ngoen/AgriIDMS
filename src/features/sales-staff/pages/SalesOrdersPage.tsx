import toast from "react-hot-toast";
import { useMemo, useState } from "react";
import { Boxes, Clock3, PackageSearch, ShieldAlert, Sparkles } from "lucide-react";
import {
  useAllocateAsStaffMutation,
  useAllocateBackorderAsStaffMutation,
  useAutoProposeAllocationAsStaffMutation,
  useConfirmAllocationAsStaffMutation,
  useGetOverdueBackordersQuery,
  useGetPendingAllocationOrdersQuery,
  useGetPendingSaleConfirmOrdersQuery,
  useGetPendingWarehouseConfirmOrdersQuery,
  useSaleConfirmOrderMutation,
} from "../../order/api/order.api";
import {
  useConfirmCodPaymentMutation,
  useGetPendingCodPaymentsQuery,
} from "../../payment/api/payment.api";
import type { OrderListItem } from "../../order/schemas/order.schema";
import type { PendingCodPaymentItem } from "../../payment/schemas/payment.schema";
import { useAuth } from "../../auth/hooks/useAuth";
import { AUTH_ROLE } from "../../auth/constants/auth.constants";

function vnd(n: number) {
  return n.toLocaleString("vi-VN");
}

function orderStatusTone(status: string) {
  if (status === "PendingSaleConfirmation") {
    return "bg-sky-100 text-sky-700 border-sky-200";
  }
  if (status === "AwaitingAllocation") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (status === "PartiallyAllocated") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  if (status === "BackorderWaiting") {
    return "bg-violet-100 text-violet-700 border-violet-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function SalesOrdersPage() {
  const auth = useAuth();
  const userRoles = auth.user?.roles ?? [];
  const hasAnyRole = (...roles: string[]) => roles.some((role) => userRoles.includes(role));
  const canSaleConfirm =
    hasAnyRole(AUTH_ROLE.SALES_STAFF, AUTH_ROLE.ADMIN, AUTH_ROLE.MANAGER);
  const canAutoPropose =
    hasAnyRole(AUTH_ROLE.SALES_STAFF, AUTH_ROLE.WAREHOUSE_STAFF, AUTH_ROLE.ADMIN, AUTH_ROLE.MANAGER);
  const canAllocateStaff =
    hasAnyRole(AUTH_ROLE.WAREHOUSE_STAFF, AUTH_ROLE.ADMIN, AUTH_ROLE.MANAGER);
  const canWarehouseConfirm =
    hasAnyRole(AUTH_ROLE.WAREHOUSE_STAFF, AUTH_ROLE.ADMIN, AUTH_ROLE.MANAGER);
  const canConfirmCod =
    hasAnyRole(AUTH_ROLE.SALES_STAFF, AUTH_ROLE.WAREHOUSE_STAFF, AUTH_ROLE.ADMIN, AUTH_ROLE.MANAGER);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [orderIdQuery, setOrderIdQuery] = useState<string>("");
  const defaultQueue: "saleConfirm" | "allocation" | "warehouseConfirm" | "pendingCod" | "backorder" =
    canSaleConfirm ? "saleConfirm" : "allocation";
  const [activeQueue, setActiveQueue] = useState<
    "saleConfirm" | "allocation" | "warehouseConfirm" | "pendingCod" | "backorder"
  >(defaultQueue);
  const [sortBy, setSortBy] = useState<"createdDesc" | "createdAsc" | "totalDesc" | "totalAsc">("createdDesc");
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [selectedByQueue, setSelectedByQueue] = useState<Record<string, Record<number, boolean>>>({});
  const [pageByQueue, setPageByQueue] = useState<Record<string, number>>({
    saleConfirm: 1,
    allocation: 1,
    warehouseConfirm: 1,
    pendingCod: 1,
    backorder: 1,
  });
  const currentPage = pageByQueue[activeQueue] ?? 1;
  const currentSkip = (currentPage - 1) * pageSize;

  const { data: pendingSaleConfirm = [], isLoading: isLoadingPendingSaleConfirm, refetch: refetchPendingSaleConfirm } =
    useGetPendingSaleConfirmOrdersQuery({ skip: currentSkip, take: pageSize });
  const { data: pendingAllocation = [], isLoading: isLoadingPendingAllocation, refetch: refetchPendingAllocation } =
    useGetPendingAllocationOrdersQuery(
      {
        source: sourceFilter === "ALL" ? undefined : sourceFilter,
        skip: currentSkip,
        take: pageSize,
      },
    );
  const { data: pendingWarehouseConfirm = [], isLoading: isLoadingPendingWarehouseConfirm, refetch: refetchPendingWarehouseConfirm } =
    useGetPendingWarehouseConfirmOrdersQuery(
      {
        source: sourceFilter === "ALL" ? undefined : sourceFilter,
        skip: currentSkip,
        take: pageSize,
      },
    );
  const { data: overdueBackorders = [], isLoading: isLoadingBackorders, refetch: refetchBackorders } =
    useGetOverdueBackordersQuery();
  const { data: pendingCodPayments = [], isLoading: isLoadingPendingCod, refetch: refetchPendingCod } =
    useGetPendingCodPaymentsQuery({ skip: currentSkip, take: pageSize });

  const [saleConfirmOrder, { isLoading: isConfirming }] =
    useSaleConfirmOrderMutation();
  const [allocateAsStaff, { isLoading: isAllocating }] =
    useAllocateAsStaffMutation();
  const [autoProposeAllocationAsStaff, { isLoading: isAutoProposing }] =
    useAutoProposeAllocationAsStaffMutation();
  const [confirmAllocationAsStaff, { isLoading: isConfirmingAllocation }] =
    useConfirmAllocationAsStaffMutation();
  const [confirmCodPayment, { isLoading: isConfirmingCod }] =
    useConfirmCodPaymentMutation();

  const filteredPendingSaleConfirm = useMemo(() => {
    const q = orderIdQuery.trim();
    return pendingSaleConfirm.filter((o) => {
      const statusOk = statusFilter === "ALL" || o.status === statusFilter;
      const idOk = q === "" || String(o.orderId).includes(q);
      return statusOk && idOk;
    });
  }, [pendingSaleConfirm, statusFilter, orderIdQuery]);

  const filteredPendingAllocation = useMemo(() => {
    const q = orderIdQuery.trim();
    return pendingAllocation.filter((o) => {
      const statusOk = statusFilter === "ALL" || o.status === statusFilter;
      const idOk = q === "" || String(o.orderId).includes(q);
      return statusOk && idOk;
    });
  }, [pendingAllocation, statusFilter, orderIdQuery]);

  const filteredBackorders = useMemo(() => {
    const q = orderIdQuery.trim();
    return overdueBackorders.filter((o) => {
      const statusOk = statusFilter === "ALL" || o.status === statusFilter;
      const idOk = q === "" || String(o.orderId).includes(q);
      return statusOk && idOk;
    });
  }, [overdueBackorders, statusFilter, orderIdQuery]);

  const filteredPendingWarehouseConfirm = useMemo(() => {
    const q = orderIdQuery.trim();
    return pendingWarehouseConfirm.filter((o) => {
      const statusOk = statusFilter === "ALL" || o.status === statusFilter;
      const idOk = q === "" || String(o.orderId).includes(q);
      return statusOk && idOk;
    });
  }, [pendingWarehouseConfirm, statusFilter, orderIdQuery]);

  const filteredPendingCodPayments = useMemo(() => {
    const q = orderIdQuery.trim();
    return pendingCodPayments.filter((p) => {
      const idOk = q === "" || String(p.orderId).includes(q);
      return idOk;
    });
  }, [pendingCodPayments, orderIdQuery]);
  const [allocateBackorderAsStaff, { isLoading: isAllocatingBackorder }] =
    useAllocateBackorderAsStaffMutation();

  const metricCards = [
    {
      key: "sale-confirm",
      label: "Chờ sale-confirm",
      value: filteredPendingSaleConfirm.length,
      icon: Sparkles,
      tone: "text-sky-700 bg-sky-50 border-sky-200",
    },
    {
      key: "pending-allocation",
      label: "Chờ allocate",
      value: filteredPendingAllocation.length,
      icon: Boxes,
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      key: "pending-warehouse-confirm",
      label: "Chờ kho xác nhận",
      value: filteredPendingWarehouseConfirm.length,
      icon: ShieldAlert,
      tone: "text-indigo-700 bg-indigo-50 border-indigo-200",
    },
    {
      key: "overdue-backorder",
      label: "Backorder quá hạn",
      value: filteredBackorders.length,
      icon: Clock3,
      tone: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      key: "pending-cod",
      label: "COD chờ xác nhận",
      value: filteredPendingCodPayments.length,
      icon: PackageSearch,
      tone: "text-violet-700 bg-violet-50 border-violet-200",
    },
  ] as const;

  const setQueuePage = (page: number) => {
    setPageByQueue((prev) => ({ ...prev, [activeQueue]: Math.max(1, page) }));
  };

  const selectedMap = selectedByQueue[activeQueue] ?? {};
  const selectedOrderIds = Object.entries(selectedMap)
    .filter(([, selected]) => selected)
    .map(([id]) => Number(id));
  const selectedCount = selectedOrderIds.length;

  const sortOrders = (rows: OrderListItem[]) => {
    const arr = [...rows];
    if (sortBy === "totalAsc") return arr.sort((a, b) => a.totalAmount - b.totalAmount);
    if (sortBy === "totalDesc") return arr.sort((a, b) => b.totalAmount - a.totalAmount);
    if (sortBy === "createdAsc") return arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const toggleRowSelect = (id: number) => {
    setSelectedByQueue((prev) => {
      const queueMap = prev[activeQueue] ?? {};
      return {
        ...prev,
        [activeQueue]: {
          ...queueMap,
          [id]: !queueMap[id],
        },
      };
    });
  };

  const toggleSelectAllForRows = (rows: OrderListItem[]) => {
    const allSelected = rows.length > 0 && rows.every((r) => selectedMap[r.orderId]);
    setSelectedByQueue((prev) => {
      const queueMap = { ...(prev[activeQueue] ?? {}) };
      for (const row of rows) {
        queueMap[row.orderId] = !allSelected;
      }
      return { ...prev, [activeQueue]: queueMap };
    });
  };

  const handleSaleConfirm = async (id: number) => {
    const t = toast.loading(`Đang sale-confirm đơn #${id}...`);
    try {
      await saleConfirmOrder(id).unwrap();
      toast.success(`Sale-confirm đơn #${id} thành công`, { id: t });
      await refetchPendingSaleConfirm();
      await refetchPendingAllocation();
    } catch {
      toast.error(`Sale-confirm đơn #${id} thất bại`, { id: t });
    }
  };

  const handleAllocate = async (id: number) => {
    const t = toast.loading(`Đang allocate đơn #${id}...`);
    try {
      await allocateAsStaff(id).unwrap();
      toast.success(`Allocate đơn #${id} thành công`, { id: t });
      await refetchPendingAllocation();
      await refetchPendingSaleConfirm();
    } catch {
      toast.error(`Allocate đơn #${id} thất bại`, { id: t });
    }
  };

  const handleBackorderAllocate = async (id: number, expiredAction: 0 | 1) => {
    const t = toast.loading(`Đang xử lý backorder đơn #${id}...`);
    try {
      await allocateBackorderAsStaff({ id, expiredAction }).unwrap();
      toast.success(`Đã xử lý backorder đơn #${id}`, { id: t });
      await refetchBackorders();
      await refetchPendingAllocation();
      await refetchPendingSaleConfirm();
    } catch {
      toast.error(`Xử lý backorder đơn #${id} thất bại`, { id: t });
    }
  };

  const handleAutoPropose = async (id: number) => {
    const t = toast.loading(`Đang auto-propose FEFO cho đơn #${id}...`);
    try {
      await autoProposeAllocationAsStaff(id).unwrap();
      toast.success(`Đã tạo đề xuất FEFO cho đơn #${id}`, { id: t });
      await refetchPendingAllocation();
      await refetchPendingWarehouseConfirm();
    } catch {
      toast.error(`Auto-propose FEFO thất bại cho đơn #${id}`, { id: t });
    }
  };

  const handleConfirmAllocation = async (id: number) => {
    const t = toast.loading(`Đang warehouse-confirm đơn #${id}...`);
    try {
      await confirmAllocationAsStaff(id).unwrap();
      toast.success(`Kho đã xác nhận allocate đơn #${id}`, { id: t });
      await refetchPendingWarehouseConfirm();
      await refetchPendingAllocation();
      await refetchPendingSaleConfirm();
    } catch {
      toast.error(`Warehouse confirm thất bại cho đơn #${id}`, { id: t });
    }
  };

  const handleConfirmCod = async (paymentId: number, orderId: number) => {
    const t = toast.loading(`Đang xác nhận COD cho đơn #${orderId}...`);
    try {
      await confirmCodPayment(paymentId).unwrap();
      toast.success(`Xác nhận COD thành công cho đơn #${orderId}`, { id: t });
      await refetchPendingCod();
      await refetchPendingAllocation();
      await refetchPendingSaleConfirm();
    } catch {
      toast.error(`Xác nhận COD thất bại cho đơn #${orderId}`, { id: t });
    }
  };

  const runBulkAction = async (
    title: string,
    action: (id: number) => Promise<unknown>,
  ) => {
    if (!selectedOrderIds.length) return;
    const t = toast.loading(`${title}: ${selectedOrderIds.length} đơn...`);
    let success = 0;
    for (const id of selectedOrderIds) {
      try {
        await action(id);
        success += 1;
      } catch {
        // ignore individual errors, summarize at end
      }
    }
    toast.success(`${title}: thành công ${success}/${selectedOrderIds.length}`, { id: t });
    await Promise.all([
      refetchPendingSaleConfirm(),
      refetchPendingAllocation(),
      refetchPendingWarehouseConfirm(),
      refetchBackorders(),
      refetchPendingCod(),
    ]);
  };

  const renderOrderTable = (
    rows: OrderListItem[],
    emptyText: string,
    isLoading: boolean,
    action: (orderId: number) => void,
    actionText: string,
    actionDisabled: boolean,
    actionClassName: string,
    showSource = false,
  ) => {
    const sortedRows = sortOrders(rows);
    if (isLoading) {
      return <p className="text-sm text-slate-500 mt-3">Đang tải...</p>;
    }
    if (sortedRows.length === 0) {
      return <p className="text-sm text-slate-500 mt-3">{emptyText}</p>;
    }
    return (
      <div className="mt-4 border border-slate-200 rounded-xl overflow-auto max-h-[560px]">
        <table className="w-full min-w-[980px] bg-white">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="py-2 px-3 w-10">
                <input
                  type="checkbox"
                  checked={sortedRows.length > 0 && sortedRows.every((r) => selectedMap[r.orderId])}
                  onChange={() => toggleSelectAllForRows(sortedRows)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
              </th>
              <th className="py-2 pr-3">Đơn hàng</th>
              <th className="py-2 pr-3">Trạng thái</th>
              {showSource && <th className="py-2 pr-3">Nguồn</th>}
              <th className="py-2 pr-3">Ngày tạo</th>
              <th className="py-2 pr-3">Số dòng</th>
              <th className="py-2 pr-3">Tổng tiền</th>
              <th className="py-2 pr-3 w-[180px]">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((o) => (
              <tr key={o.orderId} className="border-b border-slate-100 text-sm">
                <td className="py-3 px-3">
                  <input
                    type="checkbox"
                    checked={!!selectedMap[o.orderId]}
                    onChange={() => toggleRowSelect(o.orderId)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                </td>
                <td className="py-3 pr-3 font-semibold text-slate-900">#{o.orderId}</td>
                <td className="py-3 pr-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${orderStatusTone(o.status)}`}>
                    {o.status}
                  </span>
                </td>
                {showSource && <td className="py-3 pr-3 text-slate-700">{o.source}</td>}
                <td className="py-3 pr-3 text-slate-700">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                <td className="py-3 pr-3 text-slate-700">{o.itemCount}</td>
                <td className="py-3 pr-3 font-semibold text-slate-900">{vnd(o.totalAmount)} ₫</td>
                <td className="py-3 pr-3">
                  <button
                    type="button"
                    onClick={() => action(o.orderId)}
                    disabled={actionDisabled}
                    className={actionClassName}
                  >
                    {actionText}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPendingCodTable = (
    rows: PendingCodPaymentItem[],
    emptyText: string,
    isLoading: boolean,
  ) => {
    if (isLoading) {
      return <p className="text-sm text-slate-500 mt-3">Đang tải...</p>;
    }
    if (rows.length === 0) {
      return <p className="text-sm text-slate-500 mt-3">{emptyText}</p>;
    }
    return (
      <div className="mt-4 border border-slate-200 rounded-xl overflow-auto max-h-[560px]">
        <table className="w-full min-w-[980px] bg-white">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-3">Thanh toán</th>
              <th className="py-2 pr-3">Đơn hàng</th>
              <th className="py-2 pr-3">TT thanh toán</th>
              <th className="py-2 pr-3">TT đơn hàng</th>
              <th className="py-2 pr-3">Ngày tạo</th>
              <th className="py-2 pr-3">Số tiền</th>
              <th className="py-2 pr-3 w-[180px]">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.paymentId} className="border-b border-slate-100 text-sm">
                <td className="py-3 pr-3 font-semibold text-slate-900">#{p.paymentId}</td>
                <td className="py-3 pr-3 font-semibold text-slate-900">#{p.orderId}</td>
                <td className="py-3 pr-3 text-slate-700">{p.paymentStatus}</td>
                <td className="py-3 pr-3 text-slate-700">{p.orderStatus}</td>
                <td className="py-3 pr-3 text-slate-700">{new Date(p.createdAt).toLocaleString("vi-VN")}</td>
                <td className="py-3 pr-3 font-semibold text-slate-900">{vnd(p.amount)} ₫</td>
                <td className="py-3 pr-3">
                  <button
                    type="button"
                    onClick={() => handleConfirmCod(p.paymentId, p.orderId)}
                    disabled={isConfirmingCod || !canConfirmCod}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Xác nhận COD
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className={`rounded-xl border p-4 ${card.tone}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{card.label}</p>
                <Icon size={18} />
              </div>
              <p className="mt-3 text-2xl font-bold">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Bộ lọc đơn</h2>
        <div className="mt-3 grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALL">Tất cả</option>
              <option value="PendingSaleConfirmation">PendingSaleConfirmation</option>
              <option value="AwaitingAllocation">AwaitingAllocation</option>
              <option value="BackorderWaiting">BackorderWaiting</option>
              <option value="PartiallyAllocated">PartiallyAllocated</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Nguồn đơn</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALL">Tất cả</option>
              <option value="Online">Online</option>
              <option value="POS">POS</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Tìm theo Order ID</label>
            <input
              value={orderIdQuery}
              onChange={(e) => setOrderIdQuery(e.target.value)}
              placeholder="VD: 2023"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Sắp xếp</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="createdDesc">Mới nhất</option>
              <option value="createdAsc">Cũ nhất</option>
              <option value="totalDesc">Tổng tiền giảm dần</option>
              <option value="totalAsc">Tổng tiền tăng dần</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Số dòng/trang</label>
            <select
              value={pageSize}
              onChange={(e) => {
                const next = Number(e.target.value) as 20 | 50 | 100;
                setPageSize(next);
                setQueuePage(1);
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setSourceFilter("ALL");
                setOrderIdQuery("");
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset lọc
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        {activeQueue !== "pendingCod" && activeQueue !== "backorder" && selectedCount > 0 && (
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-700 font-medium">
              Đã chọn {selectedCount} đơn:
            </span>
            {activeQueue === "saleConfirm" && (
              <button
                type="button"
                onClick={() =>
                  runBulkAction("Xác nhận bán hàng loạt", (id) => saleConfirmOrder(id).unwrap())
                }
                disabled={!canSaleConfirm}
                className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
              >
                Xác nhận bán loạt
              </button>
            )}
            {activeQueue === "allocation" && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    runBulkAction("Tạo đề xuất FEFO loạt", (id) => autoProposeAllocationAsStaff(id).unwrap())
                  }
                  disabled={!canAutoPropose}
                  className="px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100"
                >
                  Đề xuất FEFO loạt
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runBulkAction("Giữ hàng loạt", (id) => allocateAsStaff(id).unwrap())
                  }
                  disabled={!canAllocateStaff}
                  className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                >
                  Giữ hàng loạt
                </button>
              </>
            )}
            {activeQueue === "warehouseConfirm" && (
              <button
                type="button"
                onClick={() =>
                  runBulkAction("Kho xác nhận loạt", (id) => confirmAllocationAsStaff(id).unwrap())
                }
                disabled={!canWarehouseConfirm}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                Kho xác nhận loạt
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {[
            { key: "saleConfirm", label: "Hàng đợi xác nhận bán", count: filteredPendingSaleConfirm.length },
            { key: "allocation", label: "Hàng đợi giữ hàng", count: filteredPendingAllocation.length },
            { key: "warehouseConfirm", label: "Hàng đợi kho xác nhận", count: filteredPendingWarehouseConfirm.length },
            { key: "pendingCod", label: "Hàng đợi COD", count: filteredPendingCodPayments.length },
            { key: "backorder", label: "Hàng đợi backorder", count: filteredBackorders.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveQueue(tab.key as typeof activeQueue)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                activeQueue === tab.key
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        {((activeQueue === "allocation" && !canAllocateStaff) ||
          (activeQueue === "warehouseConfirm" && !canWarehouseConfirm) ||
          (activeQueue === "saleConfirm" && !canSaleConfirm) ||
          (activeQueue === "pendingCod" && !canConfirmCod)) && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Vai trò hiện tại không có quyền thực hiện thao tác xác nhận trong hàng đợi này.
          </p>
        )}

        {activeQueue === "saleConfirm" &&
          renderOrderTable(
            filteredPendingSaleConfirm,
            "Không có đơn chờ xử lý.",
            isLoadingPendingSaleConfirm,
            handleSaleConfirm,
            "Xác nhận bán",
            isConfirming || !canSaleConfirm,
            "px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60",
          )}

        {activeQueue === "allocation" &&
          (isLoadingPendingAllocation ? (
            <p className="text-sm text-slate-500 mt-3">Đang tải...</p>
          ) : filteredPendingAllocation.length === 0 ? (
            <p className="text-sm text-slate-500 mt-3">Không có đơn chờ allocate.</p>
          ) : (
            <div className="mt-4 border border-slate-200 rounded-xl overflow-auto max-h-[560px]">
              <table className="w-full min-w-[980px] bg-white">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="py-2 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={filteredPendingAllocation.length > 0 && filteredPendingAllocation.every((r) => selectedMap[r.orderId])}
                        onChange={() => toggleSelectAllForRows(filteredPendingAllocation)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                    </th>
                    <th className="py-2 pr-3">Đơn hàng</th>
                    <th className="py-2 pr-3">Trạng thái</th>
                    <th className="py-2 pr-3">Nguồn</th>
                    <th className="py-2 pr-3">Ngày tạo</th>
                    <th className="py-2 pr-3">Số dòng</th>
                    <th className="py-2 pr-3">Tổng tiền</th>
                    <th className="py-2 pr-3 w-[320px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingAllocation.map((o) => (
                    <tr key={o.orderId} className="border-b border-slate-100 text-sm">
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={!!selectedMap[o.orderId]}
                          onChange={() => toggleRowSelect(o.orderId)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900"
                        />
                      </td>
                      <td className="py-3 pr-3 font-semibold text-slate-900">#{o.orderId}</td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${orderStatusTone(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-700">{o.source}</td>
                      <td className="py-3 pr-3 text-slate-700">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="py-3 pr-3 text-slate-700">{o.itemCount}</td>
                      <td className="py-3 pr-3 font-semibold text-slate-900">{vnd(o.totalAmount)} ₫</td>
                      <td className="py-3 pr-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAutoPropose(o.orderId)}
                            disabled={isAutoProposing || !canAutoPropose}
                            className="px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 disabled:opacity-60"
                          >
                            Tự đề xuất FEFO
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAllocate(o.orderId)}
                            disabled={isAllocating || !canAllocateStaff}
                            className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Giữ hàng (staff)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {activeQueue === "warehouseConfirm" &&
          renderOrderTable(
            filteredPendingWarehouseConfirm,
            "Không có đơn chờ kho xác nhận.",
            isLoadingPendingWarehouseConfirm,
            handleConfirmAllocation,
            "Kho xác nhận",
            isConfirmingAllocation || !canWarehouseConfirm,
            "px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60",
            true,
          )}

        {activeQueue === "pendingCod" &&
          renderPendingCodTable(
            filteredPendingCodPayments,
            "Không có COD chờ xác nhận.",
            isLoadingPendingCod,
          )}

        {activeQueue === "backorder" &&
          (isLoadingBackorders ? (
            <p className="text-sm text-slate-500 mt-3">Đang tải...</p>
          ) : filteredBackorders.length === 0 ? (
            <p className="text-sm text-slate-500 mt-3">Không có đơn backorder quá hạn.</p>
          ) : (
            <div className="mt-4 border border-slate-200 rounded-xl overflow-auto max-h-[560px]">
              <table className="w-full min-w-[980px] bg-white">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-3">Đơn hàng</th>
                    <th className="py-2 pr-3">Trạng thái</th>
                    <th className="py-2 pr-3">Thiếu hụt</th>
                    <th className="py-2 pr-3">Ngày tạo</th>
                    <th className="py-2 pr-3">Tổng tiền</th>
                    <th className="py-2 pr-3 w-[280px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBackorders.map((o) => (
                    <tr key={o.orderId} className="border-b border-slate-100 text-sm">
                      <td className="py-3 pr-3 font-semibold text-slate-900">#{o.orderId}</td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${orderStatusTone(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-700">{o.totalShortageQuantity}</td>
                      <td className="py-3 pr-3 text-slate-700">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="py-3 pr-3 font-semibold text-slate-900">{vnd(o.currentTotalAmount)} ₫</td>
                      <td className="py-3 pr-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleBackorderAllocate(o.orderId, 0)}
                            disabled={isAllocatingBackorder}
                            className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Hủy phần thiếu
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBackorderAllocate(o.orderId, 1)}
                            disabled={isAllocatingBackorder}
                            className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
                          >
                            Hủy toàn bộ đơn
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setQueuePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-sm text-slate-600 min-w-[72px] text-center">Trang {currentPage}</span>
          <button
            type="button"
            onClick={() => setQueuePage(currentPage + 1)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sau
          </button>
        </div>
      </div>

    </div>
  );
}

