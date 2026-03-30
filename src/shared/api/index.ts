import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

/** URL API backend — đặt trong `.env.local`: `VITE_API_BASE_URL` (vd: https://localhost:7007/api/ hoặc http://localhost:5132/api/). Phải khớp cổng khi bạn chạy `dotnet run` / profile trong launchSettings. */
const apiBaseUrl = (() => {
    const raw = import.meta.env.VITE_API_BASE_URL?.trim();
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