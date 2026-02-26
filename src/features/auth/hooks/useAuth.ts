import { useAppSelector } from "../../../app/hook";
import { selectAuth } from "../selectors/auth.selectors";

export const useAuth = () => {
    return useAppSelector(selectAuth);
};