import type { ReactNode } from "react";

type SalesStaffPageShellProps = {
  children: ReactNode;
  /** Mặc định giống hub đơn; chi tiết dùng max-w-6xl */
  maxWidthClass?: string;
};

/**
 * Vỏ nền + khung max-width thống nhất cho Sales Staff (sát sidebar trái, lề phải/trên/dưới nhẹ).
 */
export default function SalesStaffPageShell({
  children,
  maxWidthClass = "max-w-[1400px]",
}: SalesStaffPageShellProps) {
  return (
    <div className="min-h-full w-full bg-gradient-to-b from-slate-50 via-white to-slate-50/90">
      <div className={`mx-auto w-full ${maxWidthClass} space-y-4 pl-0 pr-3 pb-4 pt-3 sm:space-y-6`}>{children}</div>
    </div>
  );
}
