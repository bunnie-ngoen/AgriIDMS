export interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: {
        id: string;
        username: string;
        roles: string[];
    } | null;
}