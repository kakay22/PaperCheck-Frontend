import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, ScanLine } from "lucide-react";
import toast from "react-hot-toast";

import { getAssessments } from "../api/assessments";

export default function ScanPapers() {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAssessments();
            setAssessments(data.filter((a) => a.status === "PUBLISHED"));
        } catch {
            toast.error("Unable to load assessments.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="space-y-6">
            <section className="flex items-start justify-between gap-4">
                <div>
                    <p className="mb-2 text-[10px] font-bold tracking-[0.15em] text-blue-600">
                        SCAN PAPERS
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Choose an assessment to scan
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Only published assessments can be scanned.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    aria-label="Refresh"
                    className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                </button>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="space-y-3 p-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
                        ))}
                    </div>
                ) : assessments.length === 0 ? (
                    <p className="px-4 py-14 text-center text-sm text-slate-500">
                        No published assessments yet. Publish one from the Assessments page.
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {assessments.map((assessment) => (
                            <li
                                key={assessment.id}
                                className="flex items-center justify-between gap-3 p-4"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                        {assessment.title}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {assessment.classroom_name || `Classroom ${assessment.classroom}`}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => navigate(`/assessments/${assessment.id}/scan`)}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    <ScanLine size={16} />
                                    Scan answers
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}