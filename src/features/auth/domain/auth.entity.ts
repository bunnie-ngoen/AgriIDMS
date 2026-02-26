export interface UserEntity {
    id: string;
    username: string;
    roles: string[];
}

export interface AuthEntity {
    accessToken: string;
    refreshToken: string;
    user: UserEntity;
}