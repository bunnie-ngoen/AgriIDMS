import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

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

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
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
    }),
    tagTypes: ["Profile", "Supplier", "Category", "Product", "Zone", "Rack", "Slot", "SlotContents", "User", "ProductVariant", "PurchaseOrder", "GoodsReceipt", "Cart", "Notification", "StockCheck", "Warehouse", "Lot"],
    endpoints: () => ({})
});