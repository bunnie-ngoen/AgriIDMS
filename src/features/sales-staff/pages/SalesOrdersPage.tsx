import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, Loader2, PackageSearch, ShieldAlert, Sparkles } from "lucide-react";
import {
  useAllocateAsStaffMutation,
  useAutoProposeAllocationAsStaffMutation,
  useConfirmDeliveredAsStaffMutation,
  useGetApprovedExportOrdersQuery,
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
import type { SaleConfirmResponse } from "../../order/schemas/order.schema";
import { paymentStatusLabelVietnam, paymentStatusTone } from "../../../shared/lib/paymentStatus";
import { orderSourceLabel, orderSourceTone } from "../../../shared/lib/orderSource";
import { orderStatusLabel, orderStatusTone } from "../../../shared/lib/orderStatusUi";

const SALES_FILTER_INPUT =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-[#1a5f2a] focus:ring-2 focus:ring-[#1a5f2a]/15";
const SALES_FILTER_SELECT =
  "mt-1.5 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-shadow focus:border-[#1a5f2a] focus:ring-2 focus:ring-[#1a5f2a]/15";
const SALES_FILTER_LABEL = "text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const SALES_PANEL =
  "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5 p-5 sm:p-6";
const SALES_TABLE_SHELL =
  "mt-4 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5";
const SALES_TABLE_HEAD =
  "border-b border-slate-200 bg-slate-50/95 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const SALES_CLEAR_BTN =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]";
const STATUS_PILL =
  "inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold";

function isShippingPendingPickupList(o: OrderListItem): boolean {
  const s = o.shippingStatus;
  return s === "ShippingPendingPickup" || s == null || s === "";
}

/** Bắt đầu giao (ShippingInProgress) chỉ thực hiện tại trang kho — tại đây chỉ xác nhận đã giao khi shipper đã đi. */
function approvedExportActionLabel(o: OrderListItem): string {
  if (isShippingPendingPickupList(o)) return "Chờ kho bắt đầu giao";
  return "Xác nhận đã giao";
}

function approvedExportActionClassName(o: OrderListItem): string {
  if (isShippingPendingPickupList(o)) {
    return "px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm font-semibold cursor-not-allowed";
  }
  return "px-3 py-2 rounded-lg border border-emerald-300 text-emerald-800 text-sm font-semibold hover:bg-emerald-50";
}

function vnd(n: number) {
  return n.toLocaleString("vi-VN");
}

function paymentStatusLabel(status: string) {
  return paymentStatusLabelVietnam(status);
}

type QueueKey =
  | "saleConfirm"
  | "allocation"
  | "warehouseConfirm"
  | "pendingCod"
  | "approvedExport";

type SalesOrdersPageProps = {
  forcedQueue?: QueueKey;
  hideQueueTabs?: boolean;
};

export default function SalesOrdersPage({ forcedQueue, hideQueueTabs = !!forcedQueue }: SalesOrdersPageProps) {
  type SaleConfirmPreviewCard = {
    orderId: number;
    totalAmount: number;
    source: string;
    itemCount: number;
    createdAt: string;
    previousStatus: string;
    feedback: SaleConfirmResponse;
  };

  const navigate = useNavigate();
  const auth = useAuth();
  const userRoles = auth.user?.roles ?? [];
  const hasAnyRole = (...roles: string[]) => roles.some((role) => userRoles.includes(role));
  const isSalesOnly =
    hasAnyRole(AUTH_ROLE.SALES_STAFF) &&
    !hasAnyRole(AUTH_ROLE.WAREHOUSE_STAFF, AUTH_ROLE.ADMIN, AUTH_ROLE.MANAGER);
  const isWarehouseOnly =
    hasAnyRole(AUTH_ROLE.WAREHOUSE_STAFF) &&
    !hasAnyRole(AUTH_ROLE.SALES_STAFF, AUTH_ROLE.ADMIN, AUTH_ROLE.MANAGER);
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
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [orderIdQuery, setOrderIdQuery] = useState<string>("");
  const [saleConfirmOrderIdQuery, setSaleConfirmOrderIdQuery] = useState<string>("");
  const [pendingCodOrderIdQuery, setPendingCodOrderIdQuery] = useState<string>("");
  const defaultQueue: QueueKey =
    forcedQueue ?? (isWarehouseOnly ? "warehouseConfirm" : (canSaleConfirm ? "saleConfirm" : "allocation"));
  const [activeQueue, setActiveQueue] = useState<QueueKey>(defaultQueue);
  const [sortBy, setSortBy] = useState<"createdDesc" | "createdAsc" | "totalDesc" | "totalAsc">("createdDesc");
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [selectedByQueue, setSelectedByQueue] = useState<Record<string, Record<number, boolean>>>({});
  const [pageByQueue, setPageByQueue] = useState<Record<string, number>>({
    saleConfirm: 1,
    allocation: 1,
    warehouseConfirm: 1,
    pendingCod: 1,
    approvedExport: 1,
  });
  const [saleConfirmFeedbackByOrderId, setSaleConfirmFeedbackByOrderId] = useState<
    Record<number, SaleConfirmResponse>
  >({});
  const [recentSaleConfirmedCards, setRecentSaleConfirmedCards] = useState<SaleConfirmPreviewCard[]>([]);

  useEffect(() => {
    if (forcedQueue && activeQueue !== forcedQueue) {
      setActiveQueue(forcedQueue);
    }
  }, [forcedQueue, activeQueue]);

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
  const { data: pendingCodPayments = [], isLoading: isLoadingPendingCod, refetch: refetchPendingCod } =
    useGetPendingCodPaymentsQuery({ skip: currentSkip, take: pageSize });

  const {
    data: approvedExportOrders = [],
    isLoading: isLoadingApprovedExport,
    refetch: refetchApprovedExport,
  } = useGetApprovedExportOrdersQuery(
    {
      source: sourceFilter === "ALL" ? undefined : sourceFilter,
      skip: currentSkip,
      take: pageSize,
    },
    { skip: activeQueue !== "approvedExport" },
  );

  const [saleConfirmOrder, { isLoading: isConfirming }] =
    useSaleConfirmOrderMutation();
  const [allocateAsStaff, { isLoading: isAllocating }] =
    useAllocateAsStaffMutation();
  const [autoProposeAllocationAsStaff, { isLoading: isAutoProposing }] =
    useAutoProposeAllocationAsStaffMutation();
  const [confirmCodPayment, { isLoading: isConfirmingCod }] =
    useConfirmCodPaymentMutation();
  const [confirmDeliveredAsStaff] = useConfirmDeliveredAsStaffMutation();
  const [approvedExportBusyOrderId, setApprovedExportBusyOrderId] = useState<number | null>(null);

  const filteredPendingSaleConfirm = useMemo(() => {
    const q = saleConfirmOrderIdQuery.trim();
    return pendingSaleConfirm.filter((o) => {
      const idOk = q === "" || String(o.orderId).includes(q);
      return idOk;
    });
  }, [pendingSaleConfirm, saleConfirmOrderIdQuery]);

  const filteredPendingAllocation = useMemo(() => {
    const q = orderIdQuery.trim();
    return pendingAllocation.filter((o) => {
      const idOk = q === "" || String(o.orderId).includes(q);
      return idOk;
    });
  }, [pendingAllocation, orderIdQuery]);

  const filteredPendingWarehouseConfirm = useMemo(() => {
    const q = orderIdQuery.trim();
    return pendingWarehouseConfirm.filter((o) => {
      const idOk = q === "" || String(o.orderId).includes(q);
      return idOk;
    });
  }, [pendingWarehouseConfirm, orderIdQuery]);

  const filteredPendingCodPayments = useMemo(() => {
    const q = pendingCodOrderIdQuery.trim();
    return pendingCodPayments.filter((p) => {
      const idOk = q === "" || String(p.orderId).includes(q);
      return idOk;
    });
  }, [pendingCodPayments, pendingCodOrderIdQuery]);

  const filteredApprovedExportOrders = useMemo(() => {
    const q = orderIdQuery.trim();
    return approvedExportOrders.filter((o) => q === "" || String(o.orderId).includes(q));
  }, [approvedExportOrders, orderIdQuery]);

  const metricCards = isSalesOnly
    ? ([
        {
          key: "sale-confirm",
          label: "Chờ xác nhận bán",
          value: filteredPendingSaleConfirm.length,
          icon: Sparkles,
          tone: "text-sky-700 bg-sky-50 border-sky-200",
        },
        {
          key: "pending-cod",
          label: "Thanh toán tiền mặt chờ xử lý",
          value: filteredPendingCodPayments.length,
          icon: PackageSearch,
          tone: "text-violet-700 bg-violet-50 border-violet-200",
        },
      ] as const)
    : isWarehouseOnly
      ? ([
          {
            key: "pending-warehouse-confirm",
            label: "Chờ kho xác nhận",
            value: filteredPendingWarehouseConfirm.length,
            icon: ShieldAlert,
            tone: "text-indigo-700 bg-indigo-50 border-indigo-200",
          },
        ] as const)
      : ([
          ...(canSaleConfirm
            ? [{
                key: "sale-confirm",
                label: "Chờ xác nhận bán",
                value: filteredPendingSaleConfirm.length,
                icon: Sparkles,
                tone: "text-sky-700 bg-sky-50 border-sky-200",
              } as const]
            : []),
          {
            key: "pending-allocation",
            label: "Chờ giữ hàng",
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
            key: "pending-cod",
            label: "Thanh toán tiền mặt chờ xử lý",
            value: filteredPendingCodPayments.length,
            icon: PackageSearch,
            tone: "text-violet-700 bg-violet-50 border-violet-200",
          },
        ] as const);

  const queueTabs = isSalesOnly
    ? ([
        { key: "saleConfirm", label: "Đơn hàng chờ xác nhận bán", count: filteredPendingSaleConfirm.length },
        { key: "pendingCod", label: "Thanh toán tiền mặt chờ xử lý", count: filteredPendingCodPayments.length },
        {
          key: "approvedExport",
          label: "Đơn đã duyệt xuất",
          count: filteredApprovedExportOrders.length,
        },
      ] as const)
    : isWarehouseOnly
      ? ([
          { key: "warehouseConfirm", label: "Chờ kho xác nhận", count: filteredPendingWarehouseConfirm.length },
          {
            key: "approvedExport",
            label: "Đơn đã duyệt xuất",
            count: filteredApprovedExportOrders.length,
          },
        ] as const)
      : ([
          ...(canSaleConfirm
            ? [{ key: "saleConfirm", label: "Đơn hàng chờ xác nhận bán", count: filteredPendingSaleConfirm.length } as const]
            : []),
          { key: "allocation", label: "Hàng đợi giữ hàng", count: filteredPendingAllocation.length } as const,
          { key: "warehouseConfirm", label: "Hàng đợi kho xác nhận", count: filteredPendingWarehouseConfirm.length } as const,
          { key: "pendingCod", label: "Thanh toán tiền mặt chờ xử lý", count: filteredPendingCodPayments.length } as const,
          {
            key: "approvedExport",
            label: "Đơn đã duyệt xuất",
            count: filteredApprovedExportOrders.length,
          },
        ] as const);
  const visibleQueueTabs = forcedQueue
    ? queueTabs.filter((tab) => tab.key === forcedQueue)
    : queueTabs;

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
      const currentOrder =
        pendingSaleConfirm.find((o) => o.orderId === id) ??
        filteredPendingSaleConfirm.find((o) => o.orderId === id);
      const res = await saleConfirmOrder(id).unwrap();
      toast.success(res.message || `Sale-confirm đơn #${id} thành công`, { id: t });
      setSaleConfirmFeedbackByOrderId((prev) => ({ ...prev, [id]: res }));
      if (currentOrder) {
        setRecentSaleConfirmedCards((prev) =>
          [
            {
              orderId: currentOrder.orderId,
              totalAmount: currentOrder.totalAmount,
              source: currentOrder.source,
              itemCount: currentOrder.itemCount,
              createdAt: currentOrder.createdAt,
              previousStatus: currentOrder.status,
              feedback: res,
            },
            ...prev.filter((x) => x.orderId !== currentOrder.orderId),
          ].slice(0, 5),
        );
      }
      await refetchPendingSaleConfirm();
      await refetchPendingWarehouseConfirm();
    } catch {
      toast.error(`Sale-confirm đơn #${id} thất bại`, { id: t });
    }
  };

  const renderSaleConfirmCards = (
    rows: OrderListItem[],
    emptyText: string,
    isLoading: boolean,
  ) => {
    const sortedRows = sortOrders(rows);
    if (isLoading) {
      return (
        <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white py-14 shadow-sm ring-1 ring-slate-900/5">
          <Loader2 className="h-6 w-6 animate-spin text-[#1a5f2a]" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Đang tải...</p>
        </div>
      );
    }
    if (sortedRows.length === 0) {
      return (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-600">{emptyText}</p>
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-white px-4 py-3 text-sm text-emerald-900 shadow-sm ring-1 ring-emerald-900/5">
          <p className="font-semibold">Sau khi xác nhận</p>
          <p className="mt-0.5 text-emerald-800/90">
            Hệ thống tự động tạo đề xuất phân bổ FEFO và chuyển đơn sang trạng thái chờ kho duyệt.
          </p>
        </div>

        <div className={`${SALES_TABLE_SHELL} max-h-[560px] overflow-auto`}>
          <table className="w-full min-w-[980px] bg-white">
            <thead className="sticky top-0 z-10">
              <tr className={SALES_TABLE_HEAD}>
                <th className="py-3 pl-4 pr-3">Đơn hàng</th>
                <th className="py-3 pr-3">Trạng thái</th>
                <th className="py-3 pr-3">Hình thức mua</th>
                <th className="py-3 pr-3">Ngày tạo</th>
                <th className="py-3 pr-3">Số sản phẩm</th>
                <th className="py-3 pr-3">Thành tiền (VNĐ)</th>
                <th className="py-3 pr-4 w-[220px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRows.map((o) => {
                const feedback = saleConfirmFeedbackByOrderId[o.orderId];
                return (
                  <tr key={o.orderId} className="text-sm transition-colors hover:bg-slate-50/80">
                    <td className="py-3.5 pl-4 pr-3 font-semibold text-slate-900">Đơn hàng {o.orderId}</td>
                    <td className="py-3.5 pr-3">
                      <span className={`${STATUS_PILL} ${orderStatusTone(o.status)}`}>
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3">
                      <span className={`${STATUS_PILL} ${orderSourceTone(o.source)}`}>
                        {orderSourceLabel(o.source)}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 tabular-nums text-slate-700">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="py-3.5 pr-3 text-slate-700">{o.itemCount}</td>
                    <td className="py-3.5 pr-3 font-semibold text-slate-900">{vnd(o.totalAmount)} ₫</td>
                    <td className="py-3.5 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaleConfirm(o.orderId)}
                          disabled={isConfirming || !canSaleConfirm}
                          className="rounded-xl border border-[#1a5f2a]/30 bg-[#1a5f2a] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#145026] disabled:opacity-50"
                        >
                          Xác nhận
                        </button>
                        {feedback && (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Đã xác nhận
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleAllocate = async (id: number) => {
    const t = toast.loading(`Đang giữ hàng cho đơn #${id}...`);
    try {
      await allocateAsStaff(id).unwrap();
      toast.success(`Giữ hàng đơn #${id} thành công`, { id: t });
      await refetchPendingAllocation();
      await refetchPendingSaleConfirm();
    } catch {
      toast.error(`Giữ hàng đơn #${id} thất bại`, { id: t });
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

  const handleConfirmCod = async (paymentId: number, orderId: number) => {
    const t = toast.loading(`Đang xác nhận tiền mặt cho đơn #${orderId}...`);
    try {
      await confirmCodPayment(paymentId).unwrap();
      toast.success(`Xác nhận tiền mặt thành công cho đơn #${orderId}`, { id: t });
      await refetchPendingCod();
      await refetchPendingAllocation();
      await refetchPendingSaleConfirm();
    } catch {
      toast.error(`Xác nhận tiền mặt thất bại cho đơn #${orderId}`, { id: t });
    }
  };

  const handleApprovedExportRow = async (o: OrderListItem) => {
    const id = o.orderId;
    if (isShippingPendingPickupList(o)) return;

    setApprovedExportBusyOrderId(id);
    const t = toast.loading(`Đang xác nhận đã giao cho đơn #${id}...`);
    try {
      await confirmDeliveredAsStaff(id).unwrap();
      toast.success(`Đã xác nhận đã giao cho đơn #${id}.`, { id: t });
      await refetchApprovedExport();
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "")
          : "";
      toast.error(msg || "Thao tác thất bại.", { id: t });
    } finally {
      setApprovedExportBusyOrderId(null);
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
      refetchPendingCod(),
      refetchApprovedExport(),
    ]);
  };

  const renderOrderTable = (
    rows: OrderListItem[],
    emptyText: string,
    isLoading: boolean,
    action: (row: OrderListItem) => void | Promise<void>,
    actionText: string | ((row: OrderListItem) => string),
    actionDisabled: boolean,
    actionClassName: string | ((row: OrderListItem) => string),
    showSource = false,
    showFefoBadge = false,
    isRowActionDisabled?: (row: OrderListItem) => boolean,
  ) => {
    const sortedRows = sortOrders(rows);
    if (isLoading) {
      return (
        <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white py-14 shadow-sm ring-1 ring-slate-900/5">
          <Loader2 className="h-6 w-6 animate-spin text-[#1a5f2a]" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Đang tải...</p>
        </div>
      );
    }
    if (sortedRows.length === 0) {
      return (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-600">{emptyText}</p>
        </div>
      );
    }
    return (
      <div className={`${SALES_TABLE_SHELL} max-h-[560px] overflow-auto`}>
        <table className="w-full min-w-[980px] bg-white">
          <thead className="sticky top-0 z-10">
            <tr className={SALES_TABLE_HEAD}>
              <th className="w-10 py-3 pl-4 pr-2">
                <input
                  type="checkbox"
                  checked={sortedRows.length > 0 && sortedRows.every((r) => selectedMap[r.orderId])}
                  onChange={() => toggleSelectAllForRows(sortedRows)}
                  className="h-4 w-4 rounded border-slate-300 text-[#1a5f2a]"
                />
              </th>
              <th className="py-3 pr-3">Đơn hàng</th>
              <th className="py-3 pr-3">Trạng thái</th>
              {showSource && <th className="py-3 pr-3">Hình thức mua</th>}
              <th className="py-3 pr-3">Ngày tạo</th>
              <th className="py-3 pr-3">Số sản phẩm</th>
              <th className="py-3 pr-3">Thành tiền (VNĐ)</th>
              <th className="py-3 pr-4 min-w-[200px] sm:w-[220px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((o) => (
              <tr key={o.orderId} className="text-sm transition-colors hover:bg-slate-50/80">
                <td className="py-3.5 pl-4 pr-2">
                  <input
                    type="checkbox"
                    checked={!!selectedMap[o.orderId]}
                    onChange={() => toggleRowSelect(o.orderId)}
                    className="h-4 w-4 rounded border-slate-300 text-[#1a5f2a]"
                  />
                </td>
                <td className="py-3.5 pr-3 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span>Đơn hàng {o.orderId}</span>
                    {showFefoBadge && (
                      <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                        FEFO
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 pr-3">
                  <span className={`${STATUS_PILL} ${orderStatusTone(o.status)}`}>
                    {orderStatusLabel(o.status)}
                  </span>
                </td>
                {showSource && <td className="py-3.5 pr-3">
                      <span className={`${STATUS_PILL} ${orderSourceTone(o.source)}`}>
                        {orderSourceLabel(o.source)}
                      </span>
                    </td>}
                <td className="py-3.5 pr-3 tabular-nums text-slate-700">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                <td className="py-3.5 pr-3 text-slate-700">{o.itemCount}</td>
                <td className="py-3.5 pr-3 font-semibold text-slate-900">{vnd(o.totalAmount)} ₫</td>
                <td className="py-3.5 pr-4">
                  <button
                    type="button"
                    onClick={() => void Promise.resolve(action(o))}
                    disabled={actionDisabled || (isRowActionDisabled?.(o) ?? false)}
                    className={`${
                      typeof actionClassName === "function" ? actionClassName(o) : actionClassName
                    } shadow-sm transition-all active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50`}
                  >
                    {typeof actionText === "function" ? actionText(o) : actionText}
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
      return (
        <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white py-14 shadow-sm ring-1 ring-slate-900/5">
          <Loader2 className="h-6 w-6 animate-spin text-[#1a5f2a]" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Đang tải danh sách...</p>
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-600">{emptyText}</p>
        </div>
      );
    }
    return (
      <div className={`${SALES_TABLE_SHELL} max-h-[560px] overflow-auto`}>
        <table className="w-full min-w-[980px] table-fixed bg-white">
          <thead className="sticky top-0 z-10">
            <tr className={SALES_TABLE_HEAD}>
              <th className="w-20 py-3 pl-3 pr-6 whitespace-nowrap text-left lg:w-[5.5rem]">Thanh toán</th>
              <th className="py-3 pl-2 pr-3">Đơn hàng</th>
              <th className="py-3 pr-3">Trạng thái thanh toán</th>
              <th className="py-3 pr-3">Trạng thái đơn hàng</th>
              <th className="py-3 pr-3">Ngày tạo</th>
              <th className="py-3 pr-3">Thành tiền (VNĐ)</th>
              <th className="py-3 pr-4 text-right sm:w-[180px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => (
              <tr key={p.paymentId} className="text-sm transition-colors hover:bg-slate-50/80">
                <td className="w-20 py-3.5 pl-3 pr-6 text-left font-semibold tabular-nums text-slate-900 whitespace-nowrap lg:w-[5.5rem]">
                  {p.paymentId}
                </td>
                <td className="py-3.5 pl-2 pr-3 font-semibold text-slate-900">Đơn hàng {p.orderId}</td>
                <td className="py-3.5 pr-3">
                  <span className={`${STATUS_PILL} ${paymentStatusTone(p.paymentStatus)}`}>
                    {paymentStatusLabel(p.paymentStatus)}
                  </span>
                </td>
                <td className="py-3.5 pr-3">
                  <span className={`${STATUS_PILL} ${orderStatusTone(p.orderStatus)}`}>
                    {orderStatusLabel(p.orderStatus)}
                  </span>
                </td>
                <td className="py-3.5 pr-3 tabular-nums text-slate-700">{new Date(p.createdAt).toLocaleString("vi-VN")}</td>
                <td className="py-3.5 pr-3 font-semibold text-slate-900">{vnd(p.amount)} ₫</td>
                <td className="py-3.5 pr-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleConfirmCod(p.paymentId, p.orderId)}
                    disabled={isConfirmingCod || !canConfirmCod}
                    className="rounded-xl border border-[#1a5f2a]/30 bg-[#1a5f2a] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-900/10 transition-all hover:bg-[#145026] disabled:pointer-events-none disabled:opacity-50"
                  >
                    Xác nhận tiền mặt
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
    <div className="min-h-full w-full bg-gradient-to-b from-slate-50 via-white to-slate-50/90">
      <div className="mx-auto max-w-[1400px] space-y-6 pl-0 pr-3 pb-4 pt-3 lg:space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className={`rounded-2xl border p-5 shadow-sm ring-1 ring-slate-900/5 transition-shadow hover:shadow-md ${card.tone}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase leading-snug tracking-wide opacity-90">{card.label}</p>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/50 bg-white/40 shadow-sm">
                    <Icon size={18} strokeWidth={2} aria-hidden />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight">{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className={SALES_PANEL}>
          <div className="border-b border-slate-100 pb-4">
            {activeQueue === "saleConfirm" ? (
              <>
                <h2 className="text-base font-bold tracking-tight text-slate-900">Bộ lọc đơn hàng chờ xác nhận bán</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className={SALES_FILTER_LABEL}>Tìm theo đơn hàng</label>
                    <input
                      value={saleConfirmOrderIdQuery}
                      onChange={(e) => setSaleConfirmOrderIdQuery(e.target.value)}
                      placeholder="VD: 2023"
                      className={SALES_FILTER_INPUT}
                    />
                  </div>
                  <div>
                    <label className={SALES_FILTER_LABEL}>Sắp xếp</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className={SALES_FILTER_SELECT}
                    >
                      <option value="createdDesc">Mới nhất</option>
                      <option value="createdAsc">Cũ nhất</option>
                      <option value="totalDesc">Thành tiền giảm dần</option>
                      <option value="totalAsc">Thành tiền tăng dần</option>
                    </select>
                  </div>
                  <div>
                    <label className={SALES_FILTER_LABEL}>Hiển thị mỗi trang</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const next = Number(e.target.value) as 20 | 50 | 100;
                        setPageSize(next);
                        setQueuePage(1);
                      }}
                      className={SALES_FILTER_SELECT}
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={() => setSaleConfirmOrderIdQuery("")} className={SALES_CLEAR_BTN}>
                      Xóa bộ lọc
                    </button>
                  </div>
                </div>
              </>
            ) : activeQueue === "pendingCod" ? (
              <>
                <h2 className="text-base font-bold tracking-tight text-slate-900">Bộ lọc thanh toán tiền mặt chờ xử lý</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className={SALES_FILTER_LABEL}>Tìm theo đơn hàng</label>
                    <input
                      value={pendingCodOrderIdQuery}
                      onChange={(e) => setPendingCodOrderIdQuery(e.target.value)}
                      placeholder="VD: 2023"
                      className={SALES_FILTER_INPUT}
                    />
                  </div>
                  <div>
                    <label className={SALES_FILTER_LABEL}>Hiển thị mỗi trang</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const next = Number(e.target.value) as 20 | 50 | 100;
                        setPageSize(next);
                        setQueuePage(1);
                      }}
                      className={SALES_FILTER_SELECT}
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={() => setPendingCodOrderIdQuery("")} className={SALES_CLEAR_BTN}>
                      Xóa bộ lọc
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-base font-bold tracking-tight text-slate-900">Bộ lọc đơn</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className={SALES_FILTER_LABEL}>Hình thức mua</label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className={SALES_FILTER_SELECT}
                    >
                      <option value="ALL">Tất cả</option>
                      <option value="Online">Trực tuyến</option>
                      <option value="POS">Tại quầy</option>
                    </select>
                  </div>
                  <div>
                    <label className={SALES_FILTER_LABEL}>Tìm theo đơn hàng</label>
                    <input
                      value={orderIdQuery}
                      onChange={(e) => setOrderIdQuery(e.target.value)}
                      placeholder="VD: 2023"
                      className={SALES_FILTER_INPUT}
                    />
                  </div>
                  <div>
                    <label className={SALES_FILTER_LABEL}>Sắp xếp</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className={SALES_FILTER_SELECT}
                    >
                      <option value="createdDesc">Mới nhất</option>
                      <option value="createdAsc">Cũ nhất</option>
                      <option value="totalDesc">Thành tiền giảm dần</option>
                      <option value="totalAsc">Thành tiền tăng dần</option>
                    </select>
                  </div>
                  <div>
                    <label className={SALES_FILTER_LABEL}>Hiển thị mỗi trang</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const next = Number(e.target.value) as 20 | 50 | 100;
                        setPageSize(next);
                        setQueuePage(1);
                      }}
                      className={SALES_FILTER_SELECT}
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
                        setSourceFilter("ALL");
                        setOrderIdQuery("");
                      }}
                      className={SALES_CLEAR_BTN}
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      <div className={SALES_PANEL}>
        {activeQueue !== "pendingCod" &&
          activeQueue !== "approvedExport" &&
          selectedCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 shadow-sm ring-1 ring-slate-900/5">
            <span className="text-sm font-semibold text-slate-800">
              Đã chọn {selectedCount} đơn:
            </span>
            {activeQueue === "allocation" && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    runBulkAction("Tạo đề xuất FEFO loạt", (id) => autoProposeAllocationAsStaff(id).unwrap())
                  }
                  disabled={!canAutoPropose}
                  className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-800 shadow-sm transition-all hover:bg-indigo-50 disabled:opacity-50"
                >
                  Đề xuất FEFO loạt
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runBulkAction("Giữ hàng loạt", (id) => allocateAsStaff(id).unwrap())
                  }
                  disabled={!canAllocateStaff}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/15 transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  Giữ hàng loạt
                </button>
              </>
            )}
            {activeQueue === "warehouseConfirm" && (
              <span className="text-xs text-slate-500">
                Mở chi tiết từng đơn để xác nhận phân bổ.
              </span>
            )}
          </div>
        )}

        {!hideQueueTabs && (
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            {visibleQueueTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveQueue(tab.key as typeof activeQueue)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.99] ${
                  activeQueue === tab.key
                    ? "bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {tab.label}{" "}
                <span className={`tabular-nums ${activeQueue === tab.key ? "text-slate-300" : "text-slate-500"}`}>
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>
        )}
        {((activeQueue === "allocation" && !canAllocateStaff) ||
          (activeQueue === "warehouseConfirm" && !canWarehouseConfirm) ||
          (activeQueue === "saleConfirm" && !canSaleConfirm) ||
          (activeQueue === "pendingCod" && !canConfirmCod)) && (
          <p className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm ring-1 ring-amber-900/5">
            Vai trò hiện tại không có quyền thực hiện thao tác xác nhận trong hàng đợi này.
          </p>
        )}

        {activeQueue === "saleConfirm" &&
          renderSaleConfirmCards(
            filteredPendingSaleConfirm,
            "Không có đơn chờ xử lý.",
            isLoadingPendingSaleConfirm,
          )}
        {activeQueue === "saleConfirm" && recentSaleConfirmedCards.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <p className="text-sm font-bold tracking-tight text-slate-900">Đã xác nhận gần đây</p>
              <button
                type="button"
                onClick={() => setRecentSaleConfirmedCards([])}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                Xóa danh sách
              </button>
            </div>
            <div className="space-y-3">
              {recentSaleConfirmedCards.map((c) => (
                <div key={c.orderId} className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Đơn hàng {c.orderId}</p>
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Đã xác nhận
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-600 md:grid-cols-4">
                    <p>Thành tiền (VNĐ): <span className="font-semibold text-slate-800">{vnd(c.totalAmount)} ₫</span></p>
                    <p className="flex flex-wrap items-center gap-1.5">
                      Hình thức mua:
                      <span className={`${STATUS_PILL} ${orderSourceTone(c.source)}`}>
                        {orderSourceLabel(c.source)}
                      </span>
                    </p>
                    <p>Số sản phẩm: <span className="font-semibold text-slate-800">{c.itemCount}</span></p>
                    <p>Ngày tạo: <span className="font-semibold text-slate-800">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</span></p>
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    Trạng thái cũ:
                    <span className={`${STATUS_PILL} ${orderStatusTone(c.previousStatus)}`}>
                      {orderStatusLabel(c.previousStatus)}
                    </span>
                  </p>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    Trạng thái mới:
                    <span className={`${STATUS_PILL} ${orderStatusTone(c.feedback.order.status)}`}>
                      {orderStatusLabel(c.feedback.order.status)}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{c.feedback.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeQueue === "allocation" &&
          (isLoadingPendingAllocation ? (
            <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white py-14 shadow-sm ring-1 ring-slate-900/5">
              <Loader2 className="h-6 w-6 animate-spin text-[#1a5f2a]" aria-hidden />
              <p className="text-sm font-medium text-slate-600">Đang tải...</p>
            </div>
          ) : filteredPendingAllocation.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
              <p className="text-sm font-medium text-slate-600">Không có đơn chờ giữ hàng.</p>
            </div>
          ) : (
            <div className={`${SALES_TABLE_SHELL} max-h-[560px] overflow-auto`}>
              <table className="w-full min-w-[980px] bg-white">
                <thead className="sticky top-0 z-10">
                  <tr className={SALES_TABLE_HEAD}>
                    <th className="w-10 py-3 pl-4 pr-2">
                      <input
                        type="checkbox"
                        checked={filteredPendingAllocation.length > 0 && filteredPendingAllocation.every((r) => selectedMap[r.orderId])}
                        onChange={() => toggleSelectAllForRows(filteredPendingAllocation)}
                        className="h-4 w-4 rounded border-slate-300 text-[#1a5f2a]"
                      />
                    </th>
                    <th className="py-3 pr-3">Đơn hàng</th>
                    <th className="py-3 pr-3">Trạng thái</th>
                    <th className="py-3 pr-3">Hình thức mua</th>
                    <th className="py-3 pr-3">Ngày tạo</th>
                    <th className="py-3 pr-3">Số sản phẩm</th>
                    <th className="py-3 pr-3">Thành tiền (VNĐ)</th>
                    <th className="py-3 pr-4 w-[320px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPendingAllocation.map((o) => (
                    <tr key={o.orderId} className="text-sm transition-colors hover:bg-slate-50/80">
                      <td className="py-3.5 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={!!selectedMap[o.orderId]}
                          onChange={() => toggleRowSelect(o.orderId)}
                          className="h-4 w-4 rounded border-slate-300 text-[#1a5f2a]"
                        />
                      </td>
                      <td className="py-3.5 pr-3 font-semibold text-slate-900">Đơn hàng {o.orderId}</td>
                      <td className="py-3.5 pr-3">
                        <span className={`${STATUS_PILL} ${orderStatusTone(o.status)}`}>
                          {orderStatusLabel(o.status)}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3">
                        <span className={`${STATUS_PILL} ${orderSourceTone(o.source)}`}>
                          {orderSourceLabel(o.source)}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 tabular-nums text-slate-700">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="py-3.5 pr-3 text-slate-700">{o.itemCount}</td>
                      <td className="py-3.5 pr-3 font-semibold text-slate-900">{vnd(o.totalAmount)} ₫</td>
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleAutoPropose(o.orderId)}
                            disabled={isAutoProposing || !canAutoPropose}
                            className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 shadow-sm transition-all hover:bg-indigo-100 disabled:pointer-events-none disabled:opacity-50"
                          >
                            Tự đề xuất FEFO
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAllocate(o.orderId)}
                            disabled={isAllocating || !canAllocateStaff}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-900/15 transition-all hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
                          >
                            Xác nhận giữ hàng
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
            (row) => navigate(`/warehouse/orders/${row.orderId}/proposals`),
            "Xem đề xuất",
            false,
            "px-3 py-2 rounded-lg border border-indigo-300 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 disabled:opacity-60",
            true,
            true,
          )}

        {activeQueue === "pendingCod" &&
          renderPendingCodTable(
            filteredPendingCodPayments,
            "Không có thanh toán tiền mặt chờ xử lý.",
            isLoadingPendingCod,
          )}

        {activeQueue === "approvedExport" &&
          renderOrderTable(
            filteredApprovedExportOrders,
            "Không có đơn ở trạng thái đã duyệt xuất (ApprovedExport).",
            isLoadingApprovedExport,
            handleApprovedExportRow,
            (row) => approvedExportActionLabel(row),
            false,
            (row) => approvedExportActionClassName(row),
            true,
            false,
            (row) => approvedExportBusyOrderId === row.orderId || isShippingPendingPickupList(row),
          )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => setQueuePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
          >
            Trước
          </button>
          <span className="min-w-[88px] rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-semibold tabular-nums text-slate-700">
            Trang {currentPage}
          </span>
          <button
            type="button"
            onClick={() => setQueuePage(currentPage + 1)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50"
          >
            Sau
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

