import { api } from "../../../shared/api";
import type { LoginResponse } from "../schemas/login.response.schema";
import { LoginResponseSchema } from "../schemas/login.response.schema";

export const authApi = api.injectEndpoints({
    endpoints: (build) => ({
        login: build.mutation<LoginResponse, { userNameOrEmail: string; password: string }>({
            query: (body) => {
                console.log('Sending login request:', body);
                return {
                    url: '/Auth/Login',
                    method: "POST",
                    body
                };
            },
            transformResponse: (response: unknown) => {
                console.log('Raw response from API:', response);
                try {
                    const validated = LoginResponseSchema.parse(response);
                    console.log('Validated response:', validated);
                    return validated;
                } catch (error) {
                    console.error('Validation error:', error);
                    throw error;
                }
            },
        })
    })
});

export const { useLoginMutation } = authApi;