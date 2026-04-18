import type { DamageProcessingOutcome, DamageReportStatus } from "../types/damage-report.types";

export const DAMAGE_REPORT_PAGE = {
  warehouseListTitle: "Phiếu báo hỏng",
  warehouseCreateTitle: "Tạo phiếu báo hỏng",
  warehouseDetailTitle: "Chi tiết phiếu báo hỏng",
  managerListTitle: "Duyệt phiếu hỏng",
  managerDetailTitle: "Chi tiết duyệt phiếu hỏng",
} as const;

export const DAMAGE_STATUS_LABEL: Record<DamageReportStatus, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
};

export const DAMAGE_OUTCOME_LABEL: Record<DamageProcessingOutcome, string> = {
  CompleteDamaged: "Hỏng hoàn toàn",
  PartialDamaged: "Hỏng một phần",
};

export const DAMAGE_FORM_LABEL = {
  reportCode: "Mã phiếu",
  box: "Thùng",
  boxCode: "Mã thùng",
  boxId: "ID thùng",
  product: "Sản phẩm / variant",
  lot: "Lô",
  damageType: "Loại hỏng",
  damagedQty: "Khối lượng hỏng (kg)",
  goodQty: "Khối lượng còn tốt (kg)",
  reason: "Lý do hỏng",
  evidence: "Ảnh chứng cứ",
  currentWeight: "Khối lượng hiện có (kg)",
  boxStatus: "Trạng thái thùng",
  submit: "Gửi phiếu",
  createNew: "Tạo phiếu mới",
  backToList: "Danh sách phiếu",
  filterStatus: "Trạng thái phiếu",
  filterDamageType: "Loại hỏng",
  searchPlaceholder: "Tìm theo mã thùng, sản phẩm, lô…",
  all: "Tất cả",
  approve: "Duyệt xử lý",
  reject: "Từ chối",
  rejectReason: "Lý do từ chối",
  confirmApproveComplete: "Xác nhận duyệt: toàn bộ thùng sẽ bị loại khỏi tồn bán (không còn dùng để bán/allocate).",
  confirmApprovePartial:
    "Xác nhận duyệt: chỉ phần hỏng được loại khỏi tồn bán; phần còn tốt được giữ trên cùng một thùng.",
} as const;
