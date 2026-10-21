import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";
import StudentProfilePanel from "../components/StudentProfilePanel";

import { getSubmissions } from "../api/grades";

const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const STATUS_STYLES = {
    APPROVED: "bg-emerald-50 text-emerald-700",
    NEEDS_REVIEW: "bg-amber-50 text-amber-700",
    PROCESSING: "bg-blue-50 text-blue-700",
    UPLOADED: "bg-slate-100 text-slate-600",
    FAILED: "bg-red-50 text-red-700",
};

function scoreOf(row) {
    const raw = row.approved_score ?? row.calculated_score;
    return raw == null ? null : Number(raw);
}

function percentOf(row) {
    const score = scoreOf(row);
    const total = Number(row.total_points);
    if (score == null || !total) return null;
    return (score / total) * 100;
}

export default function Grades() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [assessment, setAssessment] = useState("ALL");
    const [status, setStatus] = useState("ALL");
    const [profileId, setProfileId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setRows(await getSubmissions());
        } catch {
            toast.error("Unable to load grades.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const assessments = useMemo(
        () => [...new Map(rows.map((r) => [r.assessment_id, r.assessment_title]))],
        [rows],
    );

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return rows.filter((row) => {
            const matchesText =
                !query ||
                [row.student_name, row.student_id].some((v) =>
                    String(v || "").toLowerCase().includes(query),
                );
            const matchesAssessment =
                assessment === "ALL" || String(row.assessment_id) === assessment;
            const matchesStatus = status === "ALL" || row.status === status;

            return matchesText && matchesAssessment && matchesStatus;
        });
    }, [rows, search, assessment, status]);

    const approved = filtered.filter((r) => r.status === "APPROVED");
    const percents = approved.map(percentOf).filter((p) => p != null);
    const average = percents.length
        ? percents.reduce((a, b) => a + b, 0) / percents.length
        : null;

    return (
        <div className="space-y-6">
            <section>
                <p className="mb-2 text-[10px] font-bold tracking-[0.15em] text-blue-600">
                    GRADES
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Student scores
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Scores recorded from scanned answer sheets.
                </p>
            </section>

            <section className="grid grid-cols-3 gap-3">
                {[
                    { label: "Submissions", value: filtered.length },
                    { label: "Approved", value: approved.length },
                    {
                        label: "Average (approved)",
                        value: average == null ? "—" : `${average.toFixed(1)}%`,
                    },
                ].map((item) => (
                    <article
                        key={item.label}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                        <p className="text-xs text-slate-500 sm:text-sm">{item.label}</p>
                        <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                            {loading ? "—" : item.value}
                        </p>
                    </article>
                ))}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-2 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search student name or ID..."
                            aria-label="Search students"
                            className={`${inputClass} pl-9`}
                        />
                    </div>

                    <select
                        value={assessment}
                        onChange={(e) => setAssessment(e.target.value)}
                        aria-label="Filter by assessment"
                        className={`${inputClass} lg:w-56`}
                    >
                        <option value="ALL">All assessments</option>
                        {assessments.map(([id, title]) => (
                            <option key={id} value={id}>
                                {title}
                            </option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        aria-label="Filter by status"
                        className={`${inputClass} lg:w-40`}
                    >
                        <option value="ALL">All statuses</option>
                        <option value="APPROVED">Approved</option>
                        <option value="NEEDS_REVIEW">Needs review</option>
                    </select>

                    <button
                        type="button"
                        onClick={load}
                        disabled={loading}
                        aria-label="Refresh grades"
                        className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-3 p-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="px-4 py-14 text-center text-sm text-slate-500">
                        No scores yet. Scan an answer sheet and record a score to see it here.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Student</th>
                                    <th className="px-4 py-3 font-medium">Assessment</th>
                                    <th className="px-4 py-3 font-medium">Score</th>
                                    <th className="px-4 py-3 font-medium">Percent</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((row) => {
                                    const score = scoreOf(row);
                                    const percent = percentOf(row);

                                    return (
                                        <tr key={row.id} className="hover:bg-slate-50/70">
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setProfileId(row.student_pk)}
                                                    className="text-left font-medium text-blue-700 hover:underline"
                                                >
                                                    {row.student_name}
                                                </button>
                                                <p className="text-xs text-slate-500">{row.student_id}</p>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {row.assessment_title}
                                                <p className="text-xs text-slate-400">
                                                    {row.classroom_name}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">
                                                {score == null ? "—" : `${score} / ${Number(row.total_points)}`}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {percent == null ? "—" : `${percent.toFixed(1)}%`}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[row.status] || STATUS_STYLES.UPLOADED
                                                        }`}
                                                >
                                                    {row.status.replace("_", " ")}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {profileId && (
                <StudentProfilePanel
                    studentPk={profileId}
                    onClose={() => setProfileId(null)}
                />
            )}
        </div>
    );
}