import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Boxes, Clock3, PackageSearch, ShieldAlert, Sparkles } from "lucide-react";
import {
  useAllocateAsStaffMutation,
  useAllocateBackorderAsStaffMutation,
  useAutoProposeAllocationAsStaffMutation,
  useGetOverdueBackordersQuery,
  useGetPendingAllocationOrdersQuery,
  useGetPendingCustomerDecisionOrdersQuery,
  useGetPendingSaleConfirmOrdersQuery,
  useGetPendingWarehouseConfirmOrdersQuery,
  useCancelShortageAsStaffMutation,
  useSaleConfirmOrderMutation,
  useWaitBackorderAsStaffMutation,
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
import { paymentStatusLabelVietnam } from "../../../shared/lib/paymentStatus";

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
  if (status === "PendingWarehouseConfirm") {
    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  }
  if (status === "BackorderWaiting") {
    return "bg-violet-100 text-violet-700 border-violet-200";
  }
  if (status === "Confirmed") {
    return "bg-teal-100 text-teal-700 border-teal-200";
  }
  if (status === "Shipping") {
    return "bg-cyan-100 text-cyan-700 border-cyan-200";
  }
  if (status === "Delivered") {
    return "bg-green-100 text-green-700 border-green-200";
  }
  if (status === "FailedDelivery") {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }
  if (status === "Returned") {
    return "bg-slate-200 text-slate-700 border-slate-300";
  }
  if (status === "Completed") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (status === "Cancelled") {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function orderStatusLabel(status: string) {
  if (status === "PendingSaleConfirmation") return "Chờ xác nhận bán";
  if (status === "AwaitingAllocation") return "Chờ giữ hàng";
  if (status === "PendingWarehouseConfirm") return "Chờ kho xác nhận";
  if (status === "PartiallyAllocated") return "Giữ hàng một phần";
  if (status === "BackorderWaiting") return "Chờ backorder";
  if (status === "Confirmed") return "Đã xác nhận";
  if (status === "Shipping") return "Đang giao";
  if (status === "Delivered") return "Đã giao hàng";
  if (status === "FailedDelivery") return "Giao thất bại";
  if (status === "Returned") return "Hoàn hàng";
  if (status === "Completed") return "Hoàn thành";
  if (status === "Cancelled") return "Đã hủy";
  return status;
}

function paymentStatusLabel(status: string) {
  return paymentStatusLabelVietnam(status);
}

function sourceLabel(source: string) {
  if (source === "Online") return "Mua online";
  if (source === "POS") return "Mua tại quầy";
  return source;
}

type QueueKey =
  | "saleConfirm"
  | "allocation"
  | "warehouseConfirm"
  | "pendingCod"
  | "posNoProposal"
  | "pendingCustomerDecision"
  | "backorder";

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
  const [searchParams] = useSearchParams();
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
    posNoProposal: 1,
    pendingCustomerDecision: 1,
    backorder: 1,
  });
  const [saleConfirmFeedbackByOrderId, setSaleConfirmFeedbackByOrderId] = useState<
    Record<number, SaleConfirmResponse>
  >({});
  const [recentSaleConfirmedCards, setRecentSaleConfirmedCards] = useState<SaleConfirmPreviewCard[]>([]);
  const prefilledOrderId = searchParams.get("orderId")?.trim() ?? "";

  useEffect(() => {
    if (forcedQueue && activeQueue !== forcedQueue) {
      setActiveQueue(forcedQueue);
    }
  }, [forcedQueue, activeQueue]);

  useEffect(() => {
    if (forcedQueue !== "pendingCustomerDecision" && forcedQueue !== "posNoProposal") return;
    if (!prefilledOrderId) return;
    setOrderIdQuery(prefilledOrderId);
  }, [forcedQueue, prefilledOrderId]);

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
  const { data: pendingCustomerDecision = [], isLoading: isLoadingPendingCustomerDecision, refetch: refetchPendingCustomerDecision } =
    useGetPendingCustomerDecisionOrdersQuery(
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
  const [confirmCodPayment, { isLoading: isConfirmingCod }] =
    useConfirmCodPaymentMutation();
  const [waitBackorderAsStaff, { isLoading: isWaitingBackorderAsStaff }] =
    useWaitBackorderAsStaffMutation();
  const [cancelShortageAsStaff, { isLoading: isCancellingShortageAsStaff }] =
    useCancelShortageAsStaffMutation();

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

  const filteredPosNoProposal = useMemo(() => {
    return filteredPendingAllocation.filter(
      (o) => o.source === "POS" && o.status === "AwaitingAllocation",
    );
  }, [filteredPendingAllocation]);

  const filteredBackorders = useMemo(() => {
    const q = orderIdQuery.trim();
    return overdueBackorders.filter((o) => {
      const idOk = q === "" || String(o.orderId).includes(q);
      return idOk;
    });
  }, [overdueBackorders, orderIdQuery]);

  const filteredPendingWarehouseConfirm = useMemo(() => {
    const q = orderIdQuery.trim();
    return pendingWarehouseConfirm.filter((o) => {
      const idOk = q === "" || String(o.orderId).includes(q);
      return idOk;
    });
  }, [pendingWarehouseConfirm, orderIdQuery]);

  const filteredPendingCustomerDecision = useMemo(() => {
    const q = orderIdQuery.trim();
    return pendingCustomerDecision.filter((o) => {
      const idOk = q === "" || String(o.orderId).includes(q);
      return idOk;
    });
  }, [pendingCustomerDecision, orderIdQuery]);

  const filteredPendingCodPayments = useMemo(() => {
    const q = pendingCodOrderIdQuery.trim();
    return pendingCodPayments.filter((p) => {
      const idOk = q === "" || String(p.orderId).includes(q);
      return idOk;
    });
  }, [pendingCodPayments, pendingCodOrderIdQuery]);
  const [allocateBackorderAsStaff, { isLoading: isAllocatingBackorder }] =
    useAllocateBackorderAsStaffMutation();

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
          label: "Thanh toán COD chờ xử lý",
          value: filteredPendingCodPayments.length,
          icon: PackageSearch,
          tone: "text-violet-700 bg-violet-50 border-violet-200",
        },
        {
          key: "pending-customer-decision",
          label: "Thiếu hàng chờ chốt với khách",
          value: filteredPendingCustomerDecision.length,
          icon: ShieldAlert,
          tone: "text-amber-700 bg-amber-50 border-amber-200",
        },
        {
          key: "pos-no-proposal",
          label: "POS chưa có đề xuất FEFO",
          value: filteredPosNoProposal.length,
          icon: Boxes,
          tone: "text-orange-700 bg-orange-50 border-orange-200",
        },
      ] as const)
    : isWarehouseOnly
      ? ([{
          key: "pending-warehouse-confirm",
          label: "Chờ kho xác nhận",
          value: filteredPendingWarehouseConfirm.length,
          icon: ShieldAlert,
          tone: "text-indigo-700 bg-indigo-50 border-indigo-200",
        }] as const)
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
            key: "overdue-backorder",
            label: "Backorder quá hạn",
            value: filteredBackorders.length,
            icon: Clock3,
            tone: "text-amber-700 bg-amber-50 border-amber-200",
          },
          {
            key: "pending-cod",
            label: "Thanh toán COD chờ xử lý",
            value: filteredPendingCodPayments.length,
            icon: PackageSearch,
            tone: "text-violet-700 bg-violet-50 border-violet-200",
          },
          {
            key: "pending-customer-decision",
            label: "Thiếu hàng chờ chốt với khách",
            value: filteredPendingCustomerDecision.length,
            icon: ShieldAlert,
            tone: "text-amber-700 bg-amber-50 border-amber-200",
          },
        ] as const);

  const queueTabs = isSalesOnly
    ? ([
        { key: "saleConfirm", label: "Đơn hàng chờ xác nhận bán", count: filteredPendingSaleConfirm.length },
        { key: "pendingCod", label: "Thanh toán COD chờ xử lý", count: filteredPendingCodPayments.length },
        { key: "posNoProposal", label: "POS chưa có đề xuất FEFO", count: filteredPosNoProposal.length },
        { key: "pendingCustomerDecision", label: "Thiếu hàng chờ chốt với khách", count: filteredPendingCustomerDecision.length },
      ] as const)
    : isWarehouseOnly
      ? ([{ key: "warehouseConfirm", label: "Chờ kho xác nhận", count: filteredPendingWarehouseConfirm.length }] as const)
      : ([
          ...(canSaleConfirm
            ? [{ key: "saleConfirm", label: "Đơn hàng chờ xác nhận bán", count: filteredPendingSaleConfirm.length } as const]
            : []),
          { key: "allocation", label: "Hàng đợi giữ hàng", count: filteredPendingAllocation.length } as const,
          { key: "warehouseConfirm", label: "Hàng đợi kho xác nhận", count: filteredPendingWarehouseConfirm.length } as const,
          { key: "pendingCod", label: "Thanh toán COD chờ xử lý", count: filteredPendingCodPayments.length } as const,
          { key: "pendingCustomerDecision", label: "Thiếu hàng chờ chốt với khách", count: filteredPendingCustomerDecision.length } as const,
          { key: "backorder", label: "Hàng đợi backorder", count: filteredBackorders.length } as const,
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
      return <p className="text-sm text-slate-500 mt-3">Đang tải...</p>;
    }
    if (sortedRows.length === 0) {
      return <p className="text-sm text-slate-500 mt-3">{emptyText}</p>;
    }

    return (
      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <p className="font-semibold">Sau khi xác nhận</p>
          <p>Hệ thống tự động tạo đề xuất phân bổ FEFO và chuyển đơn sang trạng thái chờ kho duyệt.</p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-auto max-h-[560px]">
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
                <th className="py-2 pr-3">Hình thức mua</th>
                <th className="py-2 pr-3">Ngày tạo</th>
                <th className="py-2 pr-3">Số sản phẩm</th>
                <th className="py-2 pr-3">Thành tiền (VNĐ)</th>
                <th className="py-2 pr-3 w-[220px]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((o) => {
                const feedback = saleConfirmFeedbackByOrderId[o.orderId];
                return (
                  <tr key={o.orderId} className="border-b border-slate-100 text-sm">
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={!!selectedMap[o.orderId]}
                        onChange={() => toggleRowSelect(o.orderId)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                    </td>
                    <td className="py-3 pr-3 font-semibold text-slate-900">Đơn hàng {o.orderId}</td>
                    <td className="py-3 pr-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${orderStatusTone(o.status)}`}>
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-slate-700">{sourceLabel(o.source)}</td>
                    <td className="py-3 pr-3 text-slate-700">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="py-3 pr-3 text-slate-700">{o.itemCount}</td>
                    <td className="py-3 pr-3 font-semibold text-slate-900">{vnd(o.totalAmount)} ₫</td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaleConfirm(o.orderId)}
                          disabled={isConfirming || !canSaleConfirm}
                          className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
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

  const handleWaitBackorderAsStaff = async (id: number) => {
    const t = toast.loading(`Đang chuyển đơn hàng ${id} sang chờ backorder...`);
    try {
      await waitBackorderAsStaff(id).unwrap();
      toast.success(`Đã chọn chờ backorder cho đơn hàng ${id} (thao tác nhân sự)`, { id: t });
      await refetchPendingCustomerDecision();
      await refetchBackorders();
    } catch {
      toast.error(`Không thể chuyển đơn hàng ${id} sang chờ backorder`, { id: t });
    }
  };

  const handleCancelShortageAsStaff = async (id: number) => {
    const t = toast.loading(`Đang chốt hủy phần thiếu cho đơn hàng ${id}...`);
    try {
      await cancelShortageAsStaff(id).unwrap();
      toast.success(`Đã hủy phần thiếu cho đơn hàng ${id} (thao tác nhân sự)`, { id: t });
      await refetchPendingCustomerDecision();
      await refetchPendingWarehouseConfirm();
    } catch {
      toast.error(`Không thể hủy phần thiếu cho đơn hàng ${id}`, { id: t });
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
    showFefoBadge = false,
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
              {showSource && <th className="py-2 pr-3">Hình thức mua</th>}
              <th className="py-2 pr-3">Ngày tạo</th>
              <th className="py-2 pr-3">Số sản phẩm</th>
              <th className="py-2 pr-3">Thành tiền (VNĐ)</th>
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
                <td className="py-3 pr-3 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span>Đơn hàng {o.orderId}</span>
                    {showFefoBadge && (
                      <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                        FEFO
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${orderStatusTone(o.status)}`}>
                    {orderStatusLabel(o.status)}
                  </span>
                </td>
                {showSource && <td className="py-3 pr-3 text-slate-700">{sourceLabel(o.source)}</td>}
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
              <th className="py-2 pr-3">Trạng thái thanh toán</th>
              <th className="py-2 pr-3">Trạng thái đơn hàng</th>
              <th className="py-2 pr-3">Ngày tạo</th>
              <th className="py-2 pr-3">Số tiền</th>
              <th className="py-2 pr-3 w-[180px]">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.paymentId} className="border-b border-slate-100 text-sm">
                <td className="py-3 pr-3 font-semibold text-slate-900">Thanh toán {p.paymentId}</td>
                <td className="py-3 pr-3 font-semibold text-slate-900">Đơn hàng {p.orderId}</td>
                <td className="py-3 pr-3 text-slate-700">{paymentStatusLabel(p.paymentStatus)}</td>
                <td className="py-3 pr-3 text-slate-700">{orderStatusLabel(p.orderStatus)}</td>
                <td className="py-3 pr-3 text-slate-700">{new Date(p.createdAt).toLocaleString("vi-VN")}</td>
                <td className="py-3 pr-3 font-semibold text-slate-900">{vnd(p.amount)} ₫</td>
                <td className="py-3 pr-3">
                  <button
                    type="button"
                    onClick={() => handleConfirmCod(p.paymentId, p.orderId)}
                    disabled={isConfirmingCod || !canConfirmCod}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
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
        {activeQueue === "saleConfirm" ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900">Bộ lọc đơn hàng chờ xác nhận bán</h2>
            <div className="mt-3 grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Tìm theo đơn hàng</label>
                <input
                  value={saleConfirmOrderIdQuery}
                  onChange={(e) => setSaleConfirmOrderIdQuery(e.target.value)}
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
                  <option value="totalDesc">Thành tiền giảm dần</option>
                  <option value="totalAsc">Thành tiền tăng dần</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Hiển thị mỗi trang</label>
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
                  onClick={() => setSaleConfirmOrderIdQuery("")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </>
        ) : activeQueue === "pendingCod" ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900">Bộ lọc thanh toán COD chờ xử lý</h2>
            <div className="mt-3 grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Tìm theo đơn hàng</label>
                <input
                  value={pendingCodOrderIdQuery}
                  onChange={(e) => setPendingCodOrderIdQuery(e.target.value)}
                  placeholder="VD: 2023"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Hiển thị mỗi trang</label>
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
                  onClick={() => setPendingCodOrderIdQuery("")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-900">Bộ lọc đơn</h2>
            <div className="mt-3 grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Hình thức mua</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="Online">Trực tuyến</option>
                  <option value="POS">Tại quầy</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Tìm theo đơn hàng</label>
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
                  <option value="totalDesc">Thành tiền giảm dần</option>
                  <option value="totalAsc">Thành tiền tăng dần</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Hiển thị mỗi trang</label>
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
                    setSourceFilter("ALL");
                    setOrderIdQuery("");
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </>
        )}
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
              <span className="text-xs text-slate-500">
                Mở chi tiết từng đơn để xác nhận phân bổ.
              </span>
            )}
          </div>
        )}

        {!hideQueueTabs && (
          <div className="flex flex-wrap gap-2">
            {visibleQueueTabs.map((tab) => (
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
        )}
        {((activeQueue === "allocation" && !canAllocateStaff) ||
          (activeQueue === "warehouseConfirm" && !canWarehouseConfirm) ||
          (activeQueue === "saleConfirm" && !canSaleConfirm) ||
          (activeQueue === "pendingCod" && !canConfirmCod)) && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
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
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Đã xác nhận gần đây</p>
              <button
                type="button"
                onClick={() => setRecentSaleConfirmedCards([])}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Xóa danh sách
              </button>
            </div>
            <div className="space-y-3">
              {recentSaleConfirmedCards.map((c) => (
                <div key={c.orderId} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Đơn hàng {c.orderId}</p>
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Đã xác nhận
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-600 md:grid-cols-4">
                    <p>Thành tiền (VNĐ): <span className="font-semibold text-slate-800">{vnd(c.totalAmount)} ₫</span></p>
                    <p>Hình thức mua: <span className="font-semibold text-slate-800">{sourceLabel(c.source)}</span></p>
                    <p>Số sản phẩm: <span className="font-semibold text-slate-800">{c.itemCount}</span></p>
                    <p>Ngày tạo: <span className="font-semibold text-slate-800">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</span></p>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Trạng thái cũ: <span className="font-semibold">{orderStatusLabel(c.previousStatus)}</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    Trạng thái mới: <span className="font-semibold">{orderStatusLabel(c.feedback.order.status)}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{c.feedback.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeQueue === "allocation" &&
          (isLoadingPendingAllocation ? (
            <p className="text-sm text-slate-500 mt-3">Đang tải...</p>
          ) : filteredPendingAllocation.length === 0 ? (
            <p className="text-sm text-slate-500 mt-3">Không có đơn chờ giữ hàng.</p>
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
                    <th className="py-2 pr-3">Hình thức mua</th>
                    <th className="py-2 pr-3">Ngày tạo</th>
                    <th className="py-2 pr-3">Số sản phẩm</th>
                    <th className="py-2 pr-3">Thành tiền (VNĐ)</th>
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
                      <td className="py-3 pr-3 font-semibold text-slate-900">Đơn hàng {o.orderId}</td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${orderStatusTone(o.status)}`}>
                          {orderStatusLabel(o.status)}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-700">{sourceLabel(o.source)}</td>
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
            (id) => navigate(`/warehouse/orders/${id}/proposals`),
            "Xem đề xuất",
            false,
            "px-3 py-2 rounded-lg border border-indigo-300 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 disabled:opacity-60",
            true,
            true,
          )}

        {activeQueue === "pendingCod" &&
          renderPendingCodTable(
            filteredPendingCodPayments,
            "Không có thanh toán COD chờ xử lý.",
            isLoadingPendingCod,
          )}

        {activeQueue === "posNoProposal" &&
          renderOrderTable(
            filteredPosNoProposal,
            "Không có đơn POS nào đang chờ đề xuất FEFO.",
            isLoadingPendingAllocation,
            handleAutoPropose,
            "Thử đề xuất FEFO",
            isAutoProposing || !canAutoPropose,
            "px-3 py-2 rounded-lg border border-orange-300 text-orange-700 text-sm font-semibold hover:bg-orange-50 disabled:opacity-60",
            true,
            false,
          )}

        {activeQueue === "pendingCustomerDecision" &&
          (isLoadingPendingCustomerDecision ? (
            <p className="text-sm text-slate-500 mt-3">Đang tải...</p>
          ) : filteredPendingCustomerDecision.length === 0 ? (
            <p className="text-sm text-slate-500 mt-3">Không có đơn thiếu hàng đang chờ chốt với khách.</p>
          ) : (
            <div className="mt-4 border border-slate-200 rounded-xl overflow-auto max-h-[560px]">
              <table className="w-full min-w-[980px] bg-white">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-3">Đơn hàng</th>
                    <th className="py-2 pr-3">Trạng thái</th>
                    <th className="py-2 pr-3">Hình thức mua</th>
                    <th className="py-2 pr-3">Ngày tạo</th>
                    <th className="py-2 pr-3">Số sản phẩm</th>
                    <th className="py-2 pr-3">Thành tiền (VNĐ)</th>
                    <th className="py-2 pr-3 w-[340px]">Thao tác duyệt hộ khách</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingCustomerDecision.map((o) => (
                    <tr key={o.orderId} className="border-b border-slate-100 text-sm">
                      <td className="py-3 pr-3 font-semibold text-slate-900">Đơn hàng {o.orderId}</td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${orderStatusTone(o.status)}`}>
                          {orderStatusLabel(o.status)}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-700">{sourceLabel(o.source)}</td>
                      <td className="py-3 pr-3 text-slate-700">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="py-3 pr-3 text-slate-700">{o.itemCount}</td>
                      <td className="py-3 pr-3 font-semibold text-slate-900">{vnd(o.totalAmount)} ₫</td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleWaitBackorderAsStaff(o.orderId)}
                            disabled={isWaitingBackorderAsStaff || isCancellingShortageAsStaff}
                            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                          >
                            Chờ backorder (duyệt hộ)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelShortageAsStaff(o.orderId)}
                            disabled={isWaitingBackorderAsStaff || isCancellingShortageAsStaff}
                            className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
                          >
                            Hủy phần thiếu (duyệt hộ)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

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
                    <th className="py-2 pr-3">Thành tiền (VNĐ)</th>
                    <th className="py-2 pr-3 w-[280px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBackorders.map((o) => (
                    <tr key={o.orderId} className="border-b border-slate-100 text-sm">
                      <td className="py-3 pr-3 font-semibold text-slate-900">Đơn hàng {o.orderId}</td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${orderStatusTone(o.status)}`}>
                          {orderStatusLabel(o.status)}
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

