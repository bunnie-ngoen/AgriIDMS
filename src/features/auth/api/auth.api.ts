import { api } from "../../../shared/api";
import type { LoginResponse } from "../schemas/login.response.schema";
import { LoginResponseSchema } from "../schemas/login.response.schema";
import type { RegisterFormValues } from "../schemas/register.schema";

type RegisterResponse = {
  message: string;
};

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<
      LoginResponse,
      { userNameOrEmail: string; password: string }
    >({
      query: (body) => {
        console.log("Sending login request:", body);
        return {
          url: "/Auth/Login",
          method: "POST",
          body,
        };
      },
      transformResponse: (response: unknown) => {
        console.log("Raw response from API:", response);
        try {
          const validated = LoginResponseSchema.parse(response);
          console.log("Validated response:", validated);
          return validated;
        } catch (error) {
          console.error("Validation error:", error);
          throw error;
        }
      },
    }),

    registerCustomer: build.mutation<RegisterResponse, RegisterFormValues>({
      query: (body) => {
        const payload = {
          userName: body.userName.trim(),
          password: body.password,
          phoneNumber: body.phoneNumber.trim(),
          gender: body.gender === "male",
          // Gửi đúng định dạng \"yyyy-MM-dd\" như swagger, không ISO full datetime
          dob: body.dob && body.dob !== "" ? body.dob : null,
          fullName: body.fullName.trim(),
          address: body.address?.trim() || null,
          email: body.email?.trim() || null,
        };

        // BE route: [Route("api/v1/[controller]/[action]")] + [HttpPost("register")]
        // => POST /api/v1/Auth/RegisterCustomer/register
        return {
          url: "Auth/RegisterCustomer/register",
          method: "POST",
          body: payload,
        };
      },
    }),


    forgotPassword: build.mutation<
  { message: string },
  { email: string }
>({
  query: (body) => ({
    url: "/Auth/ForgotPassword/forgot-password",
    method: "POST",
    body: {
      email: body.email.trim(),
    },
  }),
}),
  }),
});

export const { useLoginMutation, useRegisterCustomerMutation, useForgotPasswordMutation } = authApi;
