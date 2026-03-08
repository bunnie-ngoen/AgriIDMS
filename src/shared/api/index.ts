import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        // Trailing slash is important so relative endpoint paths like
        // "Warehouses" correctly resolve to "https://localhost:7007/api/Warehouses"
        baseUrl: "https://localhost:7007/api/",
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["Profile"],
    endpoints: () => ({})
});