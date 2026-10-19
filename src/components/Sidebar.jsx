
import {
    BookOpen,
    ClipboardCheck,
    FileCheck2,
    LayoutDashboard,
    LogOut,
    ScanLine,
    Users,
    X,
} from "lucide-react";

const navigation = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Classrooms", icon: Users },
    { label: "Assessments", icon: BookOpen },
    { label: "Scan papers", icon: ScanLine },
    { label: "Grades", icon: ClipboardCheck },
    { label: "Students", icon: Users, }
];

export default function Sidebar({
    activePage,
    onNavigate,
    onLogout,
    open,
    onClose,
}) {
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
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
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
                                className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition ${active
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

                <div className="mt-auto flex items-center gap-3 border-t border-slate-100 px-2 pt-4">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        T
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">
                            Signed-in user
                        </p>
                        <p className="mt-1 text-xs text-slate-500">PaperCheck account</p>
                    </div>

                    <button
                        onClick={onLogout}
                        className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>
        </>
    );
}
