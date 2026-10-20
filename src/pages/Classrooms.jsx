import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Plus,
    RefreshCw,
    Search,
    Users,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    createClassroom,
    getClassrooms,
    getSchools,
} from "../api/classrooms";

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

const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function Classrooms() {
    const [classrooms, setClassrooms] = useState([]);
    const [schools, setSchools] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        school: "",
        name: "",
        academic_year: "",
        is_active: true,
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [classroomData, schoolData] = await Promise.all([
                getClassrooms(),
                getSchools(),
            ]);

            setClassrooms(classroomData);
            setSchools(schoolData);
        } catch (loadError) {
            const message = getErrorMessage(loadError);
            setError(message);
            toast.error("Unable to load classrooms.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredClassrooms = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return classrooms;

        return classrooms.filter((classroom) => {
            const schoolName =
                classroom.school_name ||
                schools.find((school) => school.id === classroom.school)?.name ||
                "";

            return [
                classroom.name,
                classroom.academic_year,
                classroom.teacher_username,
                schoolName,
            ].some((value) => String(value || "").toLowerCase().includes(query));
        });
    }, [classrooms, schools, search]);

    function updateField(event) {
        const { name, value, type, checked } = event.target;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    async function handleCreate(event) {
        event.preventDefault();

        if (!form.school_name.trim() || !form.name.trim() || !form.academic_year.trim()) {
            toast.error("Please complete all required fields.");
            return;
        }

        setSubmitting(true);

        try {
            await createClassroom({
                school_name: form.school_name.trim(),
                name: form.name.trim(),
                academic_year: form.academic_year.trim(),
                is_active: form.is_active,
            });

            toast.success("Classroom created successfully.");

            setForm({
                school_name: "",
                name: "",
                academic_year: "",
                is_active: true,
            });

            setShowForm(false);
            await loadData();
        } catch (createError) {
            toast.error(getErrorMessage(createError));
        } finally {
            setSubmitting(false);
        }
    }


    return (
        <div className="space-y-6">
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="mb-2 text-[10px] font-bold tracking-[0.15em] text-blue-600">
                        CLASSROOM MANAGEMENT
                    </p>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Classrooms
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Organize classes by school year and manage their students.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    <Plus size={18} />
                    Add classroom
                </button>
            </section>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
                        <BookOpen size={21} />
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Total classrooms</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {loading ? "—" : classrooms.length}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Users size={21} />
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Active classrooms</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {loading
                                ? "—"
                                : classrooms.filter((classroom) => classroom.is_active).length}
                        </p>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            All classrooms
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Search your available classrooms.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1 sm:w-64">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search classrooms..."
                                aria-label="Search classrooms"
                                className={`${inputClass} pl-9`}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={loadData}
                            disabled={loading}
                            aria-label="Refresh classrooms"
                            className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
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
                                className="h-16 animate-pulse rounded-lg bg-slate-100"
                            />
                        ))}
                    </div>
                ) : filteredClassrooms.length === 0 ? (
                    <div className="px-4 py-14 text-center">
                        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
                            <BookOpen size={23} />
                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-slate-900">
                            {search ? "No matching classrooms" : "No classrooms yet"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            {search
                                ? "Try another classroom name or academic year."
                                : "Create your first classroom to get started."}
                        </p>

                        {!search && (
                            <button
                                type="button"
                                onClick={() => setShowForm(true)}
                                className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Add your first classroom
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Classroom</th>
                                    <th className="px-4 py-3 font-medium">Academic year</th>
                                    <th className="px-4 py-3 font-medium">Teacher</th>
                                    <th className="px-4 py-3 font-medium">School</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredClassrooms.map((classroom) => {
                                    const school = schools.find(
                                        (item) => item.id === classroom.school,
                                    );

                                    return (
                                        <tr key={classroom.id} className="hover:bg-slate-50/70">
                                            <td className="px-4 py-4 font-medium text-slate-900">
                                                {classroom.name}
                                            </td>

                                            <td className="px-4 py-4 text-slate-600">
                                                {classroom.academic_year}
                                            </td>

                                            <td className="px-4 py-4 text-slate-600">
                                                {classroom.teacher_username ||
                                                    `Teacher ID: ${classroom.teacher}`}
                                            </td>

                                            <td className="px-4 py-4 text-slate-600">
                                                {school?.name || `School ID: ${classroom.school}`}
                                            </td>

                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classroom.is_active
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
                                                    {classroom.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredClassrooms.length > 0 && (
                    <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                        Showing {filteredClassrooms.length} of {classrooms.length}{" "}
                        classrooms
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
                        aria-labelledby="create-classroom-title"
                        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="create-classroom-title"
                                    className="text-lg font-bold text-slate-900"
                                >
                                    Create classroom
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Enter the classroom details below.
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
                            <Field label="School *">
    <input
        name="school_name"
        value={form.school_name}
        onChange={updateField}
        required
        maxLength={150}
        list="school-options"
        placeholder="e.g. Tacloban National High School"
        className={inputClass}
    />
    <datalist id="school-options">
        {schools.map((school) => (
            <option key={school.id} value={school.name} />
        ))}
    </datalist>
</Field>

                            <Field label="Classroom name *">
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={updateField}
                                    required
                                    maxLength={100}
                                    placeholder="e.g. Grade 10 - Rizal"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Academic year *">
                                <input
                                    name="academic_year"
                                    value={form.academic_year}
                                    onChange={updateField}
                                    required
                                    placeholder="e.g. 2026-2027"
                                    className={inputClass}
                                />
                            </Field>

                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    name="is_active"
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={updateField}
                                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Classroom is active
                            </label>

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
                                    disabled={submitting}
                                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting ? "Creating..." : "Create classroom"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}
