import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ClipboardList,
    Plus,
    RefreshCw,
    ScanLine,
    Search,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/client";
import {
    createAssessment,
    getAssessments,
} from "../api/assessments";

const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function getList(data) {
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.results) ? data.results : [];
}

function getErrorMessage(error) {
    const data = error.response?.data;

    if (typeof data?.detail === "string") return data.detail;

    if (data && typeof data === "object") {
        return Object.entries(data)
            .map(([field, messages]) => {
                const text = Array.isArray(messages)
                    ? messages.join(" ")
                    : String(messages);

                return `${field}: ${text}`;
            })
            .join("\n");
    }

    return error.message || "Something went wrong. Please try again.";
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}
            </span>
            {children}
        </label>
    );
}

function StatusBadge({ status }) {
    const styles = {
        DRAFT: "bg-amber-50 text-amber-700",
        PUBLISHED: "bg-emerald-50 text-emerald-700",
        CLOSED: "bg-slate-100 text-slate-600",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || styles.DRAFT
                }`}
        >
            {status || "DRAFT"}
        </span>
    );
}

export default function Assessments() {
    const navigate = useNavigate();
    const [classrooms, setClassrooms] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        classroom: "",
        title: "",
        description: "",
        instructions: "",
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [classroomResponse, assessmentData] = await Promise.all([
                api.get("/classes/"),
                getAssessments(),
            ]);

            const classroomData = getList(classroomResponse.data);

            setClassrooms(classroomData);
            setAssessments(assessmentData);

            setForm((current) => ({
                ...current,
                classroom:
                    current.classroom &&
                        classroomData.some(
                            (classroom) => String(classroom.id) === current.classroom,
                        )
                        ? current.classroom
                        : classroomData.length
                            ? String(classroomData[0].id)
                            : "",
            }));
        } catch (loadError) {
            setError(getErrorMessage(loadError));
            toast.error("Unable to load assessments.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredAssessments = useMemo(() => {
        const query = search.trim().toLowerCase();

        return assessments.filter((assessment) => {
            const classroom = classrooms.find(
                (item) => Number(item.id) === Number(assessment.classroom),
            );

            const matchesSearch = [
                assessment.title,
                assessment.description,
                assessment.instructions,
                classroom?.name,
            ].some((value) => String(value || "").toLowerCase().includes(query));

            const matchesStatus =
                statusFilter === "ALL" || assessment.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [assessments, classrooms, search, statusFilter]);

    function updateField(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleCreate(event) {
        event.preventDefault();

        if (!form.classroom || !form.title.trim()) {
            toast.error("Select a classroom and enter an assessment title.");
            return;
        }

        setSubmitting(true);

        try {
            await createAssessment({
                classroom: Number(form.classroom),
                title: form.title.trim(),
                description: form.description.trim(),
                instructions: form.instructions.trim(),
            });

            toast.success("Assessment draft created.");

            setForm((current) => ({
                ...current,
                title: "",
                description: "",
                instructions: "",
            }));

            setShowForm(false);
            await loadData();
        } catch (createError) {
            toast.error(getErrorMessage(createError));
        } finally {
            setSubmitting(false);
        }
    }

    const counts = useMemo(
        () => ({
            total: assessments.length,
            drafts: assessments.filter((item) => item.status === "DRAFT").length,
            published: assessments.filter((item) => item.status === "PUBLISHED").length,
            closed: assessments.filter((item) => item.status === "CLOSED").length,
        }),
        [assessments],
    );

    return (
        <div className="space-y-6">
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="mb-2 text-[10px] font-bold tracking-[0.15em] text-blue-600">
                        ASSESSMENT MANAGEMENT
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Assessments
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Create tests and manage their publication status.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    disabled={classrooms.length === 0}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Plus size={18} />
                    Create assessment
                </button>
            </section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                    { label: "All assessments", value: counts.total },
                    { label: "Drafts", value: counts.drafts },
                    { label: "Published", value: counts.published },
                    { label: "Closed", value: counts.closed },
                ].map((item) => (
                    <article
                        key={item.label}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                        <p className="text-sm text-slate-500">{item.label}</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {loading ? "—" : item.value}
                        </p>
                    </article>
                ))}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Your assessments
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Draft assessments can be edited before publication.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative min-w-0 sm:w-60">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search assessments..."
                                aria-label="Search assessments"
                                className={`${inputClass} pl-9`}
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            aria-label="Filter assessment status"
                            className={`${inputClass} sm:w-36`}
                        >
                            <option value="ALL">All statuses</option>
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="CLOSED">Closed</option>
                        </select>

                        <button
                            type="button"
                            onClick={loadData}
                            disabled={loading}
                            aria-label="Refresh assessments"
                            className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={17}
                                className={loading ? "animate-spin" : ""}
                            />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <p className="whitespace-pre-line">{error}</p>
                        <button
                            type="button"
                            onClick={loadData}
                            className="mt-2 font-semibold underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-3 p-4">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-20 animate-pulse rounded-lg bg-slate-100"
                            />
                        ))}
                    </div>
                ) : classrooms.length === 0 ? (
                    <div className="px-4 py-14 text-center">
                        <ClipboardList size={28} className="mx-auto text-slate-400" />
                        <h3 className="mt-3 text-sm font-semibold text-slate-900">
                            Create a classroom first
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Assessments must belong to a classroom.
                        </p>
                    </div>
                ) : filteredAssessments.length === 0 ? (
                    <div className="px-4 py-14 text-center">
                        <ClipboardList size={28} className="mx-auto text-slate-400" />
                        <h3 className="mt-3 text-sm font-semibold text-slate-900">
                            No assessments found
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Try a different search or create an assessment draft.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredAssessments.map((assessment) => {
                            const classroom = classrooms.find(
                                (item) => Number(item.id) === Number(assessment.classroom),
                            );

                            return (
                                <article
                                    key={assessment.id}
                                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                                            <ClipboardList size={20} />
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-semibold text-slate-900">
                                                {assessment.title}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {classroom?.name || `Classroom ${assessment.classroom}`}
                                            </p>
                                            {assessment.description && (
                                                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                                                    {assessment.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                                        <StatusBadge status={assessment.status} />

                                        <span className="text-xs text-slate-500">
                                            {assessment.total_points != null
                                                ? `${assessment.total_points} points`
                                                : "Points not set"}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(`/assessments/${assessment.id}/questions`)
                                            }
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Open questions
                                        </button>

                                        {assessment.status === "PUBLISHED" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(`/assessments/${assessment.id}/scan`)
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                            >
                                                <ScanLine size={16} />
                                                Scan answers
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 sm:items-center sm:p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !submitting) {
                            setShowForm(false);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-assessment-title"
                        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="create-assessment-title"
                                    className="text-lg font-bold text-slate-900"
                                >
                                    Create assessment
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    This will create a draft you can add questions to later.
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setShowForm(false)}
                                aria-label="Close form"
                                className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="mt-6 space-y-4">
                            <Field label="Classroom *">
                                <select
                                    name="classroom"
                                    value={form.classroom}
                                    onChange={updateField}
                                    required
                                    className={inputClass}
                                >
                                    <option value="">Select a classroom</option>
                                    {classrooms.map((classroom) => (
                                        <option key={classroom.id} value={classroom.id}>
                                            {classroom.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Assessment title *">
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={updateField}
                                    required
                                    maxLength={200}
                                    placeholder="e.g. Science Unit Test 1"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Description">
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={updateField}
                                    rows={3}
                                    placeholder="Describe what this assessment covers."
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Instructions">
                                <textarea
                                    name="instructions"
                                    value={form.instructions}
                                    onChange={updateField}
                                    rows={3}
                                    placeholder="Instructions for students."
                                    className={inputClass}
                                />
                            </Field>

                            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowForm(false)}
                                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting || classrooms.length === 0}
                                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting ? "Creating..." : "Create draft"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}