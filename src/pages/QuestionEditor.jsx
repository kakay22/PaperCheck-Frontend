import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { downloadAnswerSheet } from "../api/answerSheets";
import { FileDown } from "lucide-react";
import { publishAssessment } from "../api/assessments";
import {
    ArrowLeft,
    Check,
    CirclePlus,
    LoaderCircle,
    Plus,
    Save,
    Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/client";
import {
    createQuestion,
    deleteQuestion,
    getQuestions,
    updateQuestion,
} from "../api/questions";

const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function emptyQuestion(order = 1) {
    return {
        prompt: "",
        question_type: "MULTIPLE_CHOICE",
        order,
        points: "1.00",
        required: true,
        options: [
            { label: "A", text: "", is_correct: true },
            { label: "B", text: "", is_correct: false },
            { label: "C", text: "", is_correct: false },
            { label: "D", text: "", is_correct: false },
        ],
    };
}

function getErrorMessage(error) {
    const data = error.response?.data;

    if (typeof data === "string") return data;
    if (typeof data?.detail === "string") return data.detail;

    if (data && typeof data === "object") {
        return Object.entries(data)
            .map(([field, messages]) => {
                const message = Array.isArray(messages)
                    ? messages
                        .map((item) =>
                            typeof item === "string" ? item : JSON.stringify(item),
                        )
                        .join(" ")
                    : typeof messages === "object"
                        ? JSON.stringify(messages)
                        : String(messages);

                return `${field}: ${message}`;
            })
            .join("\n");
    }

    return error.message || "Something went wrong.";
}

function QuestionForm({
    initialQuestion,
    questionNumber,
    saving,
    onSave,
    onCancel,
}) {
    const [form, setForm] = useState(() => ({
        ...initialQuestion,
        options: initialQuestion.options.map((option) => ({ ...option })),
    }));

    function updateOption(index, changes) {
        setForm((current) => ({
            ...current,
            options: current.options.map((option, optionIndex) =>
                optionIndex === index ? { ...option, ...changes } : option,
            ),
        }));
    }

    function addOption() {
        if (form.options.length >= LETTERS.length) {
            toast.error("A maximum of six choices is supported.");
            return;
        }

        const label = LETTERS[form.options.length];

        setForm((current) => ({
            ...current,
            options: [
                ...current.options,
                { label, text: "", is_correct: false },
            ],
        }));
    }

    function removeOption(index) {
        if (form.options.length <= 2) {
            toast.error("A question needs at least two choices.");
            return;
        }

        setForm((current) => ({
            ...current,
            options: current.options
                .filter((_, optionIndex) => optionIndex !== index)
                .map((option, optionIndex) => ({
                    ...option,
                    label: LETTERS[optionIndex],
                })),
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (!form.prompt.trim()) {
            toast.error("Enter the question.");
            return;
        }

        if (form.options.some((option) => !option.text.trim())) {
            toast.error("Fill in every answer choice.");
            return;
        }

        if (form.options.filter((option) => option.is_correct).length !== 1) {
            toast.error("Select exactly one correct answer.");
            return;
        }

        const points = Number(form.points);

        if (!Number.isFinite(points) || points <= 0) {
            toast.error("Points must be greater than zero.");
            return;
        }

        onSave({
            ...form,
            prompt: form.prompt.trim(),
            order: Number(form.order),
            points: points.toFixed(2),
            options: form.options.map((option) => ({
                ...option,
                text: option.text.trim(),
            })),
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Question
                </label>
                <textarea
                    value={form.prompt}
                    onChange={(event) =>
                        setForm((current) => ({
                            ...current,
                            prompt: event.target.value,
                        }))
                    }
                    rows={3}
                    required
                    placeholder="Enter your question..."
                    className={inputClass}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Question number
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={form.order}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                order: event.target.value,
                            }))
                        }
                        required
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Points
                    </label>
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.points}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                points: event.target.value,
                            }))
                        }
                        required
                        className={inputClass}
                    />
                </div>
            </div>

            <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Answer choices
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Select the circle beside the correct answer.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={addOption}
                        disabled={form.options.length >= LETTERS.length}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <Plus size={16} />
                        Add choice
                    </button>
                </div>

                <div className="space-y-2">
                    {form.options.map((option, index) => (
                        <div
                            key={option.label}
                            className={`flex items-center gap-2 rounded-xl border p-2.5 ${option.is_correct
                                ? "border-emerald-300 bg-emerald-50/50"
                                : "border-slate-200"
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setForm((current) => ({
                                        ...current,
                                        options: current.options.map((item, itemIndex) => ({
                                            ...item,
                                            is_correct: itemIndex === index,
                                        })),
                                    }))
                                }
                                aria-label={`Mark choice ${option.label} as correct`}
                                aria-pressed={option.is_correct}
                                className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold ${option.is_correct
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-slate-300 bg-white text-slate-600"
                                    }`}
                            >
                                {option.is_correct ? <Check size={16} /> : option.label}
                            </button>

                            <input
                                value={option.text}
                                onChange={(event) =>
                                    updateOption(index, { text: event.target.value })
                                }
                                required
                                placeholder={`Choice ${option.label}`}
                                aria-label={`Choice ${option.label} text`}
                                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"
                            />

                            <button
                                type="button"
                                onClick={() => removeOption(index)}
                                disabled={form.options.length <= 2}
                                aria-label={`Remove choice ${option.label}`}
                                className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                    type="checkbox"
                    checked={form.required}
                    onChange={(event) =>
                        setForm((current) => ({
                            ...current,
                            required: event.target.checked,
                        }))
                    }
                    className="size-4 rounded border-slate-300"
                />
                Required question
            </label>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? (
                        <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                        <Save size={17} />
                    )}
                    {saving ? "Saving..." : "Save question"}
                </button>
            </div>
        </form>
    );
}

export default function QuestionEditor() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();

    const [assessment, setAssessment] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);

    const [downloadingSheet, setDownloadingSheet] = useState(false);

    const handleDownloadAnswerSheet = async () => {
        try {
            setDownloadingSheet(true);

            await downloadAnswerSheet(assessmentId);

            toast.success("Answer sheet downloaded successfully.");
        } catch (error) {
            toast.error(
                error.response?.data?.detail ||
                "Unable to download the answer sheet."
            );
        } finally {
            setDownloadingSheet(false);
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);

        try {
            const [assessmentResponse, questionData] = await Promise.all([
                api.get(`/assessments/${assessmentId}/`),
                getQuestions(assessmentId),
            ]);

            setAssessment(assessmentResponse.data);
            setQuestions(
                [...questionData].sort((a, b) => a.order - b.order),
            );
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [assessmentId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleSave(questionData) {
        setSaving(true);

        try {
            if (editingQuestion?.id) {
                await updateQuestion(editingQuestion.id, questionData);
                toast.success("Question updated.");
            } else {
                await createQuestion({
                    ...questionData,
                    assessment: Number(assessmentId),
                });
                toast.success("Question added.");
            }

            setEditingQuestion(null);
            await loadData();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(question) {
        const confirmed = window.confirm(
            `Delete question ${question.order}? This cannot be undone.`,
        );

        if (!confirmed) return;

        try {
            await deleteQuestion(question.id);
            toast.success("Question deleted.");
            await loadData();
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }

    async function handlePublish() {
        if (!window.confirm("Publish this assessment? You won't be able to edit its questions afterward.")) {
            return;
        }

        setSaving(true);

        try {
            await publishAssessment(assessmentId);
            toast.success("Assessment published successfully.");
            await loadData();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    }

    if (loading && !assessment) {
        return (
            <div className="grid min-h-64 place-items-center">
                <LoaderCircle className="animate-spin text-blue-600" size={28} />
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-600">
                    Assessment could not be loaded.
                </p>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mt-4 text-sm font-semibold text-blue-600"
                >
                    Go back
                </button>
            </div>
        );
    }

    const isDraft = assessment.status === "DRAFT";
    const totalPoints = questions.reduce(
        (total, question) => total + Number(question.points || 0),
        0,
    );

    return (
        <div className="mx-auto max-w-4xl space-y-5">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
                <ArrowLeft size={17} />
                Back
            </button>

            <header className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            Question editor
                        </p>
                        <h1 className="mt-2 break-words text-xl font-bold text-slate-900">
                            {assessment.title}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {assessment.classroom_name || "Assessment"}
                        </p>
                    </div>

                    <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${isDraft
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                            }`}
                    >
                        {assessment.status}
                    </span>

                    {isDraft && (
                        <button
                            type="button"
                            onClick={handlePublish}
                            disabled={saving || questions.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Check size={17} />
                            {saving ? "Publishing..." : "Publish assessment"}
                        </button>
                    )}

                    {assessment?.status === "PUBLISHED" && (
                        <button
                            type="button"
                            onClick={handleDownloadAnswerSheet}
                            disabled={downloadingSheet}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FileDown size={16} />
                            {downloadingSheet ? "Preparing PDF..." : "Download answer sheet"}
                        </button>
                    )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                    <div>
                        <p className="text-xs text-slate-500">Questions</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                            {questions.length}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Total points</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                            {totalPoints.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                </div>

                {!isDraft && (
                    <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        This assessment is no longer a draft. Questions cannot be changed.
                    </p>
                )}
            </header>

            {editingQuestion && isDraft && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 sm:items-center sm:p-5"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !saving
                        ) {
                            setEditingQuestion(null);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="question-form-title"
                        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88dvh] sm:max-w-2xl sm:rounded-2xl"
                    >
                        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
                            <div>
                                <h2
                                    id="question-form-title"
                                    className="text-base font-bold text-slate-900"
                                >
                                    {editingQuestion.id ? "Edit question" : "Add question"}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Set the question, answer choices, and points.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setEditingQuestion(null)}
                                disabled={saving}
                                aria-label="Close question editor"
                                className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                            >
                                <span className="text-xl leading-none">×</span>
                            </button>
                        </div>

                        <div className="overflow-y-auto overscroll-contain p-4 sm:p-6">
                            <QuestionForm
                                key={editingQuestion.id || "new"}
                                initialQuestion={editingQuestion}
                                questionNumber={questions.length + 1}
                                saving={saving}
                                onSave={handleSave}
                                onCancel={() => setEditingQuestion(null)}
                            />
                        </div>
                    </section>
                </div>
            )}

            <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-900">
                        Questions
                    </h2>

                    {isDraft && !editingQuestion && (
                        <button
                            type="button"
                            onClick={() =>
                                setEditingQuestion(emptyQuestion(questions.length + 1))
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            <CirclePlus size={17} />
                            Add question
                        </button>
                    )}
                </div>

                {questions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
                        <CirclePlus size={28} className="mx-auto text-slate-400" />
                        <h3 className="mt-3 text-sm font-semibold text-slate-900">
                            No questions yet
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Add your first question to start building the answer key.
                        </p>
                    </div>
                ) : (
                    questions.map((question) => (
                        <article
                            key={question.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 gap-3">
                                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                                        {question.order}
                                    </span>

                                    <div className="min-w-0">
                                        <p className="whitespace-pre-wrap text-sm font-medium text-slate-900">
                                            {question.prompt}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {question.points} points
                                            {question.required ? " · Required" : " · Optional"}
                                        </p>
                                    </div>
                                </div>

                                {isDraft && (
                                    <div className="flex shrink-0 gap-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditingQuestion({
                                                    ...question,
                                                    points: String(question.points),
                                                    options: (question.options || []).map((option) => ({
                                                        ...option,
                                                    })),
                                                })
                                            }
                                            className="rounded-lg px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(question)}
                                            aria-label={`Delete question ${question.order}`}
                                            className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {(question.options || []).map((option) => (
                                    <div
                                        key={option.id || option.label}
                                        className={`rounded-lg border px-3 py-2.5 text-sm ${option.is_correct
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                            : "border-slate-200 text-slate-600"
                                            }`}
                                    >
                                        <span className="mr-2 font-semibold">
                                            {option.label}.
                                        </span>
                                        {option.text}
                                        {option.is_correct && (
                                            <Check size={15} className="ml-2 inline" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))
                )}
            </section>
        </div>
    );
}
