import { Outlet } from "react-router-dom";
import PublicTopBar from "./PublicTopBar";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";

export default function PublicLayout() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <PublicTopBar />
            <PublicHeader />
            <main className="flex-1">
                <Outlet />
            </main>
            <PublicFooter />
        </div>
    );
}