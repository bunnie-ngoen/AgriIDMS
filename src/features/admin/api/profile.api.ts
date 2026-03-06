import { api } from "../../../shared/api";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  ProfileUser
} from "../types/profile.type";
import type { ProfileResponse } from "../types/profile.type";

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      query: (body) => ({
        url: "/v1/Auth/ChangePassword/change-password",
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

    getMyProfile: builder.query<ProfileUser, void>({
      query: () => ({
        url: "/Users/my-profile",
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),

    updateProfile: builder.mutation<void, { id: string; fullName: string | null; phoneNumber: string | null; gender: boolean; dob: string | null; address: string | null }>({
      query: ({ id, ...body }) => ({
        url: `/Users/profile/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useChangePasswordMutation,
  useGetMyProfileQuery,
  useUpdateProfileMutation,
} = profileApi;