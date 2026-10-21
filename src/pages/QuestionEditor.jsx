
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CirclePlus,
  FileDown,
  FileText,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/client";
import { downloadAnswerSheet } from "../api/answerSheets";
import { publishAssessment } from "../api/assessments";
import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  updateQuestion,
} from "../api/questions";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

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

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          {eyebrow}
        </p>
      )}
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {description && (
        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
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
    options: (initialQuestion.options || []).map((option) => ({
      ...option,
    })),
  }));

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateOption(index, changes) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...changes } : option,
      ),
    }));
  }

  function setCorrectOption(index) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => ({
        ...option,
        is_correct: optionIndex === index,
      })),
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

    if (form.options.length < 2) {
      toast.error("Add at least two answer choices.");
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
    const order = Number(form.order);

    if (!Number.isFinite(points) || points <= 0) {
      toast.error("Points must be greater than zero.");
      return;
    }

    if (!Number.isInteger(order) || order < 1) {
      toast.error("Question number must be a positive whole number.");
      return;
    }

    onSave({
      ...form,
      prompt: form.prompt.trim(),
      order,
      points: points.toFixed(2),
      options: form.options.map((option, index) => ({
        ...option,
        label: LETTERS[index],
        text: option.text.trim(),
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="question-prompt"
            className="text-sm font-semibold text-slate-800"
          >
            Question text
          </label>
          <span className="text-xs text-slate-400">
            Question {form.order || questionNumber}
          </span>
        </div>

        <textarea
          id="question-prompt"
          value={form.prompt}
          onChange={(event) => updateField("prompt", event.target.value)}
          rows={4}
          required
          placeholder="Type your question here..."
          className={`${inputClass} min-h-28 resize-y`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="question-order"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Question number
          </label>
          <input
            id="question-order"
            type="number"
            min="1"
            step="1"
            value={form.order}
            onChange={(event) => updateField("order", event.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="question-points"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Points
          </label>
          <input
            id="question-points"
            type="number"
            min="0.01"
            step="0.01"
            value={form.points}
            onChange={(event) => updateField("points", event.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Answer choices
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Select the correct answer. Only one choice can be correct.
            </p>
          </div>

          <button
            type="button"
            onClick={addOption}
            disabled={form.options.length >= LETTERS.length}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <Plus size={16} />
            Add choice
          </button>
        </div>

        <div className="space-y-2.5">
          {form.options.map((option, index) => (
            <div
              key={option.label}
              className={`rounded-xl border p-3 transition ${
                option.is_correct
                  ? "border-emerald-300 bg-emerald-50/60"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCorrectOption(index)}
                  aria-label={`Mark choice ${option.label} as correct`}
                  aria-pressed={option.is_correct}
                  className={`grid size-9 shrink-0 place-items-center rounded-full border text-sm font-bold transition ${
                    option.is_correct
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 bg-white text-slate-500 hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                >
                  {option.is_correct ? <Check size={17} /> : option.label}
                </button>

                <input
                  value={option.text}
                  onChange={(event) =>
                    updateOption(index, { text: event.target.value })
                  }
                  required
                  placeholder={`Enter choice ${option.label}`}
                  aria-label={`Choice ${option.label} text`}
                  className="min-h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={form.options.length <= 2}
                  aria-label={`Remove choice ${option.label}`}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {option.is_correct && (
                <p className="ml-11 mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 size={13} />
                  Correct answer
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:bg-slate-50">
        <input
          type="checkbox"
          checked={form.required}
          onChange={(event) => updateField("required", event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-blue-600"
        />
        <span>
          <span className="block text-sm font-medium text-slate-800">
            Required question
          </span>
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            Mark this question as required in the assessment.
          </span>
        </span>
      </label>

      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={secondaryButton}
        >
          Cancel
        </button>

        <button type="submit" disabled={saving} className={primaryButton}>
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

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 truncate text-xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        {detail && (
          <p className="mt-0.5 text-xs text-slate-400">{detail}</p>
        )}
      </div>
    </div>
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

  useEffect(() => {
    if (!editingQuestion) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape" && !saving) {
        setEditingQuestion(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingQuestion, saving]);

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
    if (
      !window.confirm(
        "Publish this assessment? You won't be able to edit its questions afterward.",
      )
    ) {
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

  async function handleDownloadAnswerSheet() {
    setDownloadingSheet(true);

    try {
      await downloadAnswerSheet(assessmentId);
      toast.success("Answer sheet downloaded successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to download the answer sheet.",
      );
    } finally {
      setDownloadingSheet(false);
    }
  }

  if (loading && !assessment) {
    return (
      <div className="mx-auto grid min-h-72 max-w-4xl place-items-center">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-blue-600"
            size={30}
          />
          <p className="mt-3 text-sm text-slate-500">
            Loading assessment...
          </p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
          <FileText size={23} />
        </div>
        <h1 className="mt-4 text-lg font-bold text-slate-900">
          Assessment unavailable
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          We couldn't load this assessment. Check your connection and try
          again.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={loadData} className={primaryButton}>
            Try again
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={secondaryButton}
          >
            <ArrowLeft size={16} />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isDraft = assessment.status === "DRAFT";

  const totalPoints = questions.reduce(
    (total, question) => total + Number(question.points || 0),
    0,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={17} />
        Back to assessments
      </button>

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                <FileText size={13} />
                Question editor
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isDraft
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    isDraft ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
                {assessment.status}
              </span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {assessment.title}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {assessment.classroom_name || "Assessment"}
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-48">
                {isDraft && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={saving || questions.length === 0}
                    className={`${primaryButton} bg-emerald-600 hover:bg-emerald-700 focus-visible:outline-emerald-600`}
                  >
                    {saving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={17} />
                    )}
                    {saving ? "Publishing..." : "Publish assessment"}
                  </button>
                )}

                {assessment.status === "PUBLISHED" && (
                  <button
                    type="button"
                    onClick={handleDownloadAnswerSheet}
                    disabled={downloadingSheet}
                    className={secondaryButton}
                  >
                    {downloadingSheet ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <FileDown size={17} />
                    )}
                    {downloadingSheet ? "Preparing PDF..." : "Download answer sheet"}
                  </button>
                )}
              </div>
            </div>

            {isDraft && questions.length === 0 && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-800">
                Add at least one question before publishing this assessment.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-3 sm:p-5">
          <StatCard
            icon={FileText}
            label="Total questions"
            value={questions.length}
          />
          <StatCard
            icon={CheckCircle2}
            label="Total points"
            value={totalPoints.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          />
          <div className="col-span-2 sm:col-span-1">
            <StatCard
              icon={CheckCircle2}
              label="Assessment status"
              value={isDraft ? "In progress" : "Published"}
              detail={isDraft ? "Questions can be edited" : "Editing is locked"}
            />
          </div>
        </div>
      </header>

      {!isDraft && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Assessment published
            </p>
            <p className="mt-1 text-sm leading-5 text-amber-800">
              Questions are locked. You can download the answer sheet for
              printing and scanning.
            </p>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2">
          <SectionHeading
            title="Questions"
            description={
              isDraft
                ? "Manage questions and select the correct answer for each one."
                : "Review the questions and answer key for this assessment."
            }
          />

          {isDraft && !editingQuestion && (
            <button
              type="button"
              onClick={() =>
                setEditingQuestion(emptyQuestion(questions.length + 1))
              }
              className={`${primaryButton} w-full sm:w-auto`}
            >
              <CirclePlus size={18} />
              Add question
            </button>
          )}
        </div>

        {loading && assessment && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
            <LoaderCircle size={16} className="animate-spin text-blue-600" />
            Refreshing assessment...
          </div>
        )}

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:py-16">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <CirclePlus size={26} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Start building your answer key
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Add your first multiple-choice question, enter the choices, and
              mark the correct answer.
            </p>
            {isDraft && (
              <button
                type="button"
                onClick={() => setEditingQuestion(emptyQuestion(1))}
                className={`${primaryButton} mt-5`}
              >
                <Plus size={17} />
                Add your first question
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => {
              const correctOption = (question.options || []).find(
                (option) => option.is_correct,
              );

              return (
                <article
                  key={question.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                        {question.order || index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-slate-500">
                            Question {question.order || index + 1}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            {question.points} {Number(question.points) === 1 ? "point" : "points"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              question.required
                                ? "bg-slate-100 text-slate-600"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {question.required ? "Required" : "Optional"}
                          </span>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-900">
                          {question.prompt}
                        </p>
                      </div>

                      {isDraft && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingQuestion({
                                ...question,
                                points: String(question.points),
                                options: (question.options || []).map(
                                  (option) => ({ ...option }),
                                ),
                              })
                            }
                            className="min-h-9 rounded-lg px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(question)}
                            aria-label={`Delete question ${question.order}`}
                            className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
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
                          className={`flex min-w-0 items-start gap-2.5 rounded-xl border px-3 py-3 text-sm ${
                            option.is_correct
                              ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                              : "border-slate-100 bg-slate-50/70 text-slate-600"
                          }`}
                        >
                          <span
                            className={`grid size-6 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                              option.is_correct
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-slate-500 ring-1 ring-slate-200"
                            }`}
                          >
                            {option.label}
                          </span>

                          <span className="min-w-0 flex-1 break-words leading-5">
                            {option.text}
                          </span>

                          {option.is_correct && (
                            <CheckCircle2
                              size={16}
                              className="mt-0.5 shrink-0 text-emerald-600"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {correctOption && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 size={14} />
                        Correct answer: {correctOption.label}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editingQuestion && isDraft && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-[2px] sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setEditingQuestion(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-form-title"
            className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <FileText size={19} />
                </div>
                <div className="min-w-0">
                  <h2
                    id="question-form-title"
                    className="text-base font-bold text-slate-900"
                  >
                    {editingQuestion.id ? "Edit question" : "Add question"}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Configure the question, choices, and answer key.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                disabled={saving}
                aria-label="Close question editor"
                className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
              >
                <X size={19} />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
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
    </div>
  );
}
