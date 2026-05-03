/** Múi giờ hiển thị cố định cho khách hàng tại Việt Nam. */
export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * .NET `DateTime` Kind=Unspecified thường serialize `yyyy-MM-ddTHH:mm:ss` không có offset.
 * Với DB/SQL Server tại VN, giá trị đó gần như luôn là **giờ đồng hồ Việt Nam** (datetime2 local),
 * không phải UTC — nếu nối `Z` sẽ bị +7h khi format lại sang Asia/Ho_Chi_Minh.
 */
function parseDotNetBareIsoAsVietnamCivil(s: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/.exec(s.trim());
    if (!m) return new Date(NaN);
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const h = Number(m[4]);
    const mi = Number(m[5]);
    const sec = Number(m[6]);
    const fracMs = m[7] ? Math.round(parseFloat(m[7]) * 1000) : 0;
    const utcMs = Date.UTC(y, mo - 1, d, h, mi, sec, fracMs);
    return new Date(utcMs - VIETNAM_UTC_OFFSET_MS);
}

/**
 * Parse datetime từ API: có `Z`/offset thì theo chuẩn; ISO không offset → giờ VN (xem trên).
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
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
        return parseDotNetBareIsoAsVietnamCivil(s);
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
