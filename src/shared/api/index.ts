import {
    createApi,
    fetchBaseQuery,
    type BaseQueryFn,
    type FetchArgs,
    type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import { setAuth, logout } from '../../features/auth/slices/auth.slice';
import { LoginResponseSchema } from '../../features/auth/schemas/login.response.schema';
import { mapLoginResponseToAuth } from '../../features/auth/domain/auth.mapper';


/** URL API backend — đặt qua env `VITE_API_BASE_URL`. Dev có fallback localhost, production bắt buộc phải cấu hình env. */
const apiBaseUrl = (() => {
    const raw = import.meta.env.VITE_API_BASE_URL?.trim();
    const isDev = import.meta.env.DEV;
    if (!raw && !isDev) {
        throw new Error("Missing VITE_API_BASE_URL in production environment.");
    }
    const fallback = 'https://localhost:7007/api/';
    const base = raw || fallback;
    return base.endsWith('/') ? base : `${base}/`;
})();

const rawBaseQuery = fetchBaseQuery({
    // Trailing slash is important so relative endpoint paths like
    // "Warehouses" correctly resolve to "{baseUrl}Warehouses"
    baseUrl: apiBaseUrl,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.accessToken;
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

/** Tránh lặp vô hạn và không refresh khi đang login. */
function isRefreshOrLoginRequest(args: string | FetchArgs): boolean {
    const url = typeof args === "string" ? args : args.url;
    if (typeof url !== "string") return false;
    const path = url.replace(/^\//, "");
    return path.startsWith("Auth/Refresh") || path.startsWith("Auth/Login");
}

let refreshSessionPromise: Promise<boolean> | null = null;

function scheduleTokenRefresh(
    api: Parameters<BaseQueryFn>[1],
    extraOptions: Parameters<BaseQueryFn>[2]
): Promise<boolean> {
    if (refreshSessionPromise) {
        return refreshSessionPromise;
    }
    const p = (async () => {
        try {
            const refreshToken = (api.getState() as RootState).auth.refreshToken;
            if (!refreshToken) {
                return false;
            }
            const refreshResult = await rawBaseQuery(
                {
                    url: "/Auth/Refresh",
                    method: "POST",
                    body: { refreshToken },
                },
                api,
                extraOptions
            );
            if (refreshResult.error) {
                return false;
            }
            const parsed = LoginResponseSchema.safeParse(refreshResult.data);
            if (!parsed.success) {
                return false;
            }
            api.dispatch(setAuth(mapLoginResponseToAuth(parsed.data)));
            return true;
        } finally {
            refreshSessionPromise = null;
        }
    })();
    refreshSessionPromise = p;
    return p;
}

const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status !== 401 || isRefreshOrLoginRequest(args)) {
        return result;
    }

    const refreshed = await scheduleTokenRefresh(api, extraOptions);
    if (refreshed) {
        result = await rawBaseQuery(args, api, extraOptions);
    } else {
        api.dispatch(logout());
    }
    return result;
};

export const api = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Profile", "Supplier", "Category", "Product", "Zone", "Rack", "Slot", "SlotContents", "User", "ProductVariant", "PurchaseOrder", "PurchaseRequest", "GoodsReceipt", "Cart", "Notification", "StockCheck", "Warehouse", "Lot", "DamageReport"],
    endpoints: () => ({})
});