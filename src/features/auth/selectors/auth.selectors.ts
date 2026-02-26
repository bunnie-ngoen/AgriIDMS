import type { RootState } from "../../../app/store";

export const selectAuth = (state: RootState) => state.auth;
export const selectIsLoggedIn = (state: RootState) => !!state.auth.accessToken;