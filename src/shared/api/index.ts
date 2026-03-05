import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        // Thêm dấu / để các URL tương đối (Auth/...) nối thành /api/v1/Auth/...
        baseUrl: "https://localhost:7007/api/v1/",
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: [],
    endpoints: () => ({})
});