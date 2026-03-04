import { api } from "../../../shared/api";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "../types/profile.type";

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      query: (body) => ({
        url: "/Auth/ChangePassword/change-password",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) => {
        if (typeof response === "string") {
          return { message: response };
        }
        return response as ChangePasswordResponse;
      },
    }),
  }),
});

export const { useChangePasswordMutation } = profileApi;