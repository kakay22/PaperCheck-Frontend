import { useCallback, useEffect, useState } from "react";
import { CircleCheck, LoaderCircle, X } from "lucide-react";
import toast from "react-hot-toast";

import {
    approveSubmission,
    confirmDetectedAnswers,
    getScanResults,
    gradeScanFile,
    reviewScanResult,
} from "../api/scanning";

function getErrorMessage(error) {
    const data = error.response?.data;

    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.error === "string") return data.error;

    return error.message || "Something went wrong. Please try again.";
}

export default function ScanReviewPanel({ scanFileId, filename, onClose, onRecorded }) {
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [data, setData] = useState(null);
    const [flaggedIds, setFlaggedIds] = useState([]);
    const [studentId, setStudentId] = useState("");
    const [graded, setGraded] = useState(null);
    const [approved, setApproved] = useState(false);

    const load = useCallback(async () => {
        try {
            const response = await getScanResults(scanFileId);
            setData(response);

            // Remember which answers were flagged when the panel first opened.
            setFlaggedIds((current) =>
                current.length
                    ? current
                    : response.results
                          .filter((r) => !r.reviewed && r.status !== "DETECTED")
                          .map((r) => r.id),
            );

            const detected = response.detected_student_id || "";
            setStudentId(
                (current) =>
                    current ||
                    response.suggested_student?.student_id ||
                    (detected && !detected.includes("?") ? detected : ""),
            );
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [scanFileId]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleChoose(result, label) {
        if (busy || graded) return;
        setBusy(true);

        try {
            await reviewScanResult(result.id, label);

            setData((current) => ({
                ...current,
                results: current.results.map((item) =>
                    item.id === result.id
                        ? {
                              ...item,
                              selected_label: label,
                              status: label ? "DETECTED" : "BLANK",
                              reviewed: true,
                          }
                        : item,
                ),
            }));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    }

    async function handleGrade() {
        const id = studentId.trim();

        if (!id) {
            toast.error("Enter the student ID.");
            return;
        }

        const unresolved = data.results.filter(
            (r) => !r.reviewed && r.status !== "DETECTED",
        ).length;

        if (unresolved > 0) {
            toast.error(`Resolve the ${unresolved} flagged answer(s) first.`);
            return;
        }

        setBusy(true);

        try {
            await confirmDetectedAnswers(scanFileId);
            const result = await gradeScanFile(scanFileId, id);
            setGraded(result);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    }

    async function handleApprove() {
        setBusy(true);

        try {
            await approveSubmission(graded.submission_id);
            setApproved(true);
            toast.success("Score recorded.");
            onRecorded({
                studentName: graded.student_name,
                score: graded.total_points_earned,
                possible: graded.total_points_possible,
            });
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    }

    const flaggedRows = data
        ? data.results.filter((r) => flaggedIds.includes(r.id))
        : [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-label="Review and record score"
                className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
            >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-slate-900">
                            Review and record score
                        </h2>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{filename}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close"
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="space-y-5 overflow-y-auto p-4">
                    {loading ? (
                        <div className="grid place-items-center py-10">
                            <LoaderCircle className="animate-spin text-blue-600" size={26} />
                        </div>
                    ) : approved ? (
                        <div className="py-6 text-center">
                            <CircleCheck size={36} className="mx-auto text-emerald-600" />
                            <p className="mt-3 text-sm text-slate-500">
                                {graded.student_name}
                            </p>
                            <p className="mt-1 text-3xl font-bold text-slate-900">
                                {graded.total_points_earned} / {graded.total_points_possible}
                            </p>
                            <p className="mt-2 text-sm font-medium text-emerald-700">
                                Score recorded
                            </p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Student ID
                                </label>
                                <input
                                    value={studentId}
                                    onChange={(event) => setStudentId(event.target.value)}
                                    disabled={busy || Boolean(graded)}
                                    placeholder="e.g. 20215634"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm tracking-wider outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Read from sheet:{" "}
                                    <span className="font-mono">
                                        {data.detected_student_id || "—"}
                                    </span>
                                    {data.suggested_student
                                        ? ` · Match: ${data.suggested_student.name}`
                                        : " · No match found. Check or type the ID."}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Flagged answers ({flaggedRows.length})
                                </h3>

                                {flaggedRows.length === 0 ? (
                                    <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                                        No flagged answers. All answers were read clearly.
                                    </p>
                                ) : (
                                    <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                                        {flaggedRows.map((row) => (
                                            <li key={row.id} className="p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold text-slate-900">
                                                        Question {row.question_order}
                                                    </span>
                                                    <span
                                                        className={`text-xs font-medium ${
                                                            row.reviewed
                                                                ? "text-emerald-700"
                                                                : "text-amber-700"
                                                        }`}
                                                    >
                                                        {row.reviewed
                                                            ? "Confirmed"
                                                            : row.status.replace("_", " ")}
                                                    </span>
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {[...row.options]
                                                        .sort((a, b) => a.label.localeCompare(b.label))
                                                        .map((option) => {
                                                            const active =
                                                                row.reviewed &&
                                                                row.selected_label === option.label;

                                                            return (
                                                                <button
                                                                    key={option.label}
                                                                    type="button"
                                                                    onClick={() => handleChoose(row, option.label)}
                                                                    disabled={busy || Boolean(graded)}
                                                                    className={`size-10 rounded-lg border text-sm font-semibold disabled:opacity-60 ${
                                                                        active
                                                                            ? "border-blue-600 bg-blue-600 text-white"
                                                                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                                                                    }`}
                                                                >
                                                                    {option.label}
                                                                </button>
                                                            );
                                                        })}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleChoose(row, "")}
                                                        disabled={busy || Boolean(graded)}
                                                        className={`h-10 rounded-lg border px-3 text-sm font-semibold disabled:opacity-60 ${
                                                            row.reviewed && row.selected_label === ""
                                                                ? "border-blue-600 bg-blue-600 text-white"
                                                                : "border-slate-300 text-slate-700 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        Blank
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {graded && (
                                <div className="rounded-xl bg-blue-50 p-4 text-center">
                                    <p className="text-sm text-slate-600">{graded.student_name}</p>
                                    <p className="mt-1 text-3xl font-bold text-slate-900">
                                        {graded.total_points_earned} / {graded.total_points_possible}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {graded.correct_answers} of {graded.answers_graded} correct.
                                        Approve to record this score.
                                    </p>
                                </div>
                            )}

                            {graded ? (
                                <button
                                    type="button"
                                    onClick={handleApprove}
                                    disabled={busy}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {busy && <LoaderCircle size={16} className="animate-spin" />}
                                    Approve and record score
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleGrade}
                                    disabled={busy}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {busy && <LoaderCircle size={16} className="animate-spin" />}
                                    Calculate score
                                </button>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}