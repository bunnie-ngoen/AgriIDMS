/** Múi giờ hiển thị cố định cho khách hàng tại Việt Nam. */
export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

/**
 * Parse datetime từ API (.NET thường trả ISO không có `Z` khi Kind = Unspecified,
 * dù giá trị trong DB là UTC). Coi chuỗi không có offset là UTC để khớp BE (UtcNow / GETUTCDATE).
 */
export function parseApiDateInput(input: string | number | Date): Date {
    if (input instanceof Date) return input;
    if (typeof input === "number") return new Date(input);
    let s = input.trim();
    if (!s) return new Date(NaN);
    // Một số API/SQL trả "yyyy-MM-dd HH:mm:ss" — chuẩn hoá để nhánh UTC bên dưới nhận diện đúng.
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s) && !s.includes("T")) {
        s = s.replace(" ", "T");
    }
    // Đã có Z hoặc offset (+/-HH:mm hoặc +HH)
    if (/[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s) || /[+-]\d{2}$/.test(s)) {
        return new Date(s);
    }
    // ISO datetime không timezone → coi là UTC
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
        return new Date(`${s}Z`);
    }
    return new Date(s);
}

const dateTimeFmt: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
};

const dateOnlyFmt: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
};

const timeOnlyFmt: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
};

function formatVietnamCore(
    input: string | number | Date | null | undefined,
    options: Intl.DateTimeFormatOptions,
): string {
    if (input === null || input === undefined || input === "") return "—";
    const d = parseApiDateInput(input);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("vi-VN", options);
}

export function formatVietnamDate(input: string | number | Date | null | undefined): string {
    return formatVietnamCore(input, dateOnlyFmt);
}

export function formatVietnamTime(input: string | number | Date | null | undefined): string {
    return formatVietnamCore(input, timeOnlyFmt);
}

export function formatVietnamDateTime(input: string | number | Date | null | undefined): string {
    if (input === null || input === undefined || input === "") return "—";
    const d = parseApiDateInput(input);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("vi-VN", dateTimeFmt);
}

/** Thời gian trong panel thông báo: cùng logic parse API + múi VN như đơn hàng; rỗng nếu không hợp lệ. */
export function formatVietnamNotificationTime(iso: string | null | undefined): string {
    const s = formatVietnamDateTime(iso ?? "");
    return s === "—" ? "" : s;
}
