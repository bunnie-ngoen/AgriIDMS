import type { LoginResponse } from "../schemas/login.response.schema";
import type { AuthEntity } from "./auth.entity";

export const mapLoginResponseToAuth = (data: LoginResponse): AuthEntity => ({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: {
        id: data.userId,
        username: data.userName,
        roles: data.roles,
    },
});