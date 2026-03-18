import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

/** Trên localhost dùng /api/ để Vite proxy sang BE; không thì dùng full URL BE. */
function getApiBaseUrl(): string {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        return `${window.location.origin}/api/`;
    }
    return import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7007/api/";
}

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: getApiBaseUrl(),
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["Profile", "Supplier", "Category", "Product", "Zone", "Rack", "Slot", "User", "ProductVariant", "PurchaseOrder", "GoodsReceipt","Cart"],
    endpoints: () => ({})
});