
import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  RefreshCw,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { getDashboardSummary } from "../api/dashboard";
import StatCard from "../components/StatCard";

const initialSummary = {
  classrooms: null,
  students: null,
  assessments: null,
  errors: [],
};

export default function Dashboard() {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);

    try {
      const data = await getDashboardSummary();
      setSummary(data);

      if (data.errors.length) {
        toast.error("Some dashboard data could not be loaded.");
      }
    } catch {
      toast.error("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = [
    {
      label: "Classrooms",
      value: summary.classrooms,
      description: "Classes available to your account",
      icon: Users,
      color: "blue",
    },
    {
      label: "Students",
      value: summary.students,
      description: "Student records available to your account",
      icon: Users,
      color: "emerald",
    },
    {
      label: "Assessments",
      value: summary.assessments,
      description: "Assessments available to your account",
      icon: BookOpen,
      color: "violet",
    },
  ];

  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 p-6 text-white sm:p-8">
        <p className="text-[10px] font-bold tracking-[0.15em] text-blue-100">
          PAPERCHECK WORKSPACE
        </p>

        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Less checking. More teaching.
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
          Manage your classes, create assessments, scan answer sheets, and
          review student results in one place.
        </p>
      </section>

      <div className="mt-8 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            School overview
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Live data from your Django backend
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {summary.errors.length > 0 && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          Some information could not be loaded. Check your Django server and
          API permissions, then refresh.
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            {...stat}
            value={loading && stat.value === null ? "…" : stat.value}
          />
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <ClipboardCheck size={20} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Your assessment workspace
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Your dashboard is connected to the API. Next, we’ll build the
              classroom and student management pages using the same reusable
              approach.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
