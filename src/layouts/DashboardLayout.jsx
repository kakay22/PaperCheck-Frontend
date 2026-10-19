import { useState } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Assessments from "../pages/Assessments";
import Sidebar from "../components/Sidebar";
import { logout } from "../api/auth";
import Dashboard from "../pages/Dashboard";
import Classrooms from "../pages/Classrooms";
import Students from "../pages/Students";

export default function DashboardLayout() {
    const [activePage, setActivePage] = useState("Dashboard");
    const [menuOpen, setMenuOpen] = useState(false);

    const navigate = useNavigate();

    function handleNavigate(page) {
        setActivePage(page);
        setMenuOpen(false);
    }

    function handleLogout() {
        logout();
        toast.success("You have signed out.");
        navigate("/login", { replace: true });
    }

    const quickAccessItems = [
        {
            label: "Classrooms",
            description: "Manage classes and students",
            color: "bg-emerald-50 text-emerald-700",
        },
        {
            label: "Assessments",
            description: "Build and publish assessments",
            color: "bg-violet-50 text-violet-700",
        },
        {
            label: "Scan papers",
            description: "Upload answer sheets for checking",
            color: "bg-amber-50 text-amber-700",
        },
        {
            label: "Grades",
            description: "Review and approve grades",
            color: "bg-blue-50 text-blue-700",
        },
    ];

    return (
        <div className="min-h-screen">
            <Sidebar
                activePage={activePage}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
            />

            <main className="min-h-screen md:ml-64">
                {/* Top navigation */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="grid size-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden"
                            onClick={() => setMenuOpen(true)}
                            aria-label="Open navigation"
                        >
                            <Menu size={22} />
                        </button>

                        <p className="text-sm text-slate-500">
                            Workspace
                            <span className="mx-1 text-slate-300">/</span>
                            <span className="font-medium text-slate-800">
                                {activePage}
                            </span>
                        </p>
                    </div>

                    <span className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
                        <span className="size-2 rounded-full bg-amber-400" />
                        Local development
                    </span>
                </header>

                <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
                    {activePage === "Dashboard" ? (
                        <Dashboard />
                    ) : activePage === "Classrooms" ? (
                        <Classrooms />
                    ) : activePage === "Students" ? (
                        <Students />
                    ) : activePage === "Assessments" ? (
                        <Assessments />
                    ) : (
                        <>
                            <div>
                                <p className="mb-2 text-[10px] font-bold tracking-[0.15em] text-blue-600">
                                    YOUR WORKSPACE
                                </p>

                                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                    {activePage}
                                </h2>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                    Manage assessments, scan answer sheets, and review student grades
                                    in one place.
                                </p>
                            </div>

                            <section className="mt-7 rounded-xl border border-slate-200 bg-white p-5">
                                <p className="text-sm font-semibold text-slate-900">
                                    {activePage} workspace
                                </p>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    This section will be connected to the Django API in a later step.
                                </p>
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}