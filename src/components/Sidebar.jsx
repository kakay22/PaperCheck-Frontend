
import {
  BookOpen,
  ClipboardCheck,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  ScanLine,
  Settings,
  Users,
  X,
  UserRound,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Classrooms", icon: Users },
  { label: "Assessments", icon: BookOpen },
  { label: "Scan papers", icon: ScanLine },
  { label: "Grades", icon: ClipboardCheck },
  { label: "Students", icon: Users },
];

export default function Sidebar({
  activePage,
  onNavigate,
  onLogout,
  open,
  onClose,
  accountName = "Signed-in user",
  accountEmail = "PaperCheck account",
}) {
  const initials =
    accountName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform duration-200 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-2 pb-8">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
            <FileCheck2 size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              PaperCheck
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Teacher workspace
            </p>
          </div>

          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.14em] text-slate-400">
          WORKSPACE
        </p>

        <nav className="space-y-1">
          {navigation.map(({ label, icon: Icon }) => {
            const active = activePage === label;

            return (
              <button
                key={label}
                onClick={() => onNavigate(label)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition ${
                  active
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={19} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => onNavigate("My Account")}
            className={`mb-3 flex min-h-12 w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
              activePage === "My Account"
                ? "bg-blue-50"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                {accountName}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {accountEmail}
              </p>
            </div>

            <Settings size={16} className="shrink-0 text-slate-400" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("My Account")}
              className="flex min-h-10 flex-1 items-center gap-2 rounded-lg px-3 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <UserRound size={17} />
              My Account
            </button>

            <button
              onClick={onLogout}
              className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
