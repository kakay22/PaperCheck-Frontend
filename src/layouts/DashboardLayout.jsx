
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Grades from "../pages/Grades";
import Assessments from "../pages/Assessments";
import Sidebar from "../components/Sidebar";
import { logout } from "../api/auth";
import { getMyAccount } from "../api/account";
import Dashboard from "../pages/Dashboard";
import Classrooms from "../pages/Classrooms";
import Students from "../pages/Students";
import ScanPapers from "../pages/ScanPapers";
import AccountSettings from "../pages/AccountSettings";

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [account, setAccount] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    getMyAccount()
      .then((data) => {
        if (active) setAccount(data);
      })
      .catch(() => {
        // AccountSettings displays its own API error if its profile cannot load.
      });

    return () => {
      active = false;
    };
  }, []);

  function handleNavigate(page) {
    setActivePage(page);
    setMenuOpen(false);
  }

  function handleLogout() {
    logout();
    toast.success("You have signed out.");
    navigate("/login", { replace: true });
  }

  const accountName =
    `${account?.first_name || ""} ${account?.last_name || ""}`.trim() ||
    account?.username ||
    "Signed-in user";

  const accountEmail = account?.email || "PaperCheck account";

  return (
    <div className="min-h-screen">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        accountName={accountName}
        accountEmail={accountEmail}
      />

      <main className="min-h-screen md:ml-64">
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
          ) : activePage === "Grades" ? (
            <Grades />
          ) : activePage === "Scan papers" ? (
            <ScanPapers />
          ) : activePage === "My Account" ? (
            <AccountSettings />
          ) : (
            <Dashboard />
          )}
        </div>
      </main>
    </div>
  );
}
