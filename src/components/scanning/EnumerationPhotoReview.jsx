
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Upload } from "lucide-react";
import { toast } from "react-hot-toast";

import api from "../../api/client";
import { getStudents } from "../../api/students";
import {
  submitEnumerationAnswers,
  submitEnumerationPhotoReview,
} from "../../api/scanning";

export default function EnumerationPhotoReview({
  item,
  assessment,
  onComplete,
}) {
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const imageUrl = item.result?.image_url;

  useEffect(() => {
    let cancelled = false;

    async function loadReviewData() {
      setLoading(true);
      setError("");

      try {
        const [studentList, questionResponse] = await Promise.all([
          getStudents(),
          api.get(`/questions/?assessment=${assessment.id}`),
        ]);

        const questionData = questionResponse.data;
        const questionList = Array.isArray(questionData)
          ? questionData
          : questionData.results ?? [];

        const enumerationQuestions = questionList
          .filter((question) => question.question_type === "ENUMERATION")
          .sort((a, b) => a.order - b.order);

        if (!enumerationQuestions.length) {
          throw new Error(
            "No enumeration questions were found for this assessment.",
          );
        }

        if (!cancelled) {
          setStudents(
            studentList.filter((student) => student.is_active),
          );
          setQuestions(enumerationQuestions);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err.response?.data?.detail ||
            err.message ||
            "Unable to load enumeration review data.";

          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReviewData();

    return () => {
      cancelled = true;
    };
  }, [assessment.id]);

  function updateAnswer(questionId, value) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!studentId) {
      toast.error("Please select the student first.");
      return;
    }

    const preparedAnswers = questions.map((question) => {
      const text = answers[question.id] ?? "";

      return {
        question,
        answers: text
          .split(/\r?\n/)
          .map((answer) => answer.trim())
          .filter(Boolean),
      };
    });

    const unanswered = preparedAnswers.filter(
      (entry) => entry.answers.length === 0,
    );

    if (unanswered.length) {
      toast.error("Enter at least one answer for every enumeration question.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const submission = await submitEnumerationPhotoReview(
        item.id,
        Number(studentId),
      );

      let lastResult = null;

      for (const entry of preparedAnswers) {
        lastResult = await submitEnumerationAnswers(
          submission.submission_id,
          entry.question.id,
          entry.answers,
        );
      }

      const selectedStudent = students.find(
        (student) => String(student.id) === String(studentId),
      );

      const finalScore =
        lastResult?.submission_score ??
        lastResult?.score ??
        submission.score ??
        null;

      const studentName =
        selectedStudent?.full_name ||
        selectedStudent?.student_id ||
        "Selected student";

      toast.success("Enumeration answers saved.");

      onComplete?.({
        submissionId: submission.submission_id,
        studentName,
        score: finalScore,
      });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        "Could not save enumeration answers.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
            <Upload size={20} />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900">
              Enumeration answer review
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {item.filename ||
                item.result?.filename ||
                "Uploaded answer sheet"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Select the student and transcribe the handwritten answers.
              Enter one answer per line.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">
            Original answer sheet
          </h3>

          {imageUrl ? (
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
            >
              <img
                src={imageUrl}
                alt="Uploaded student answer sheet"
                className="max-h-[700px] w-full object-contain"
              />
            </a>
          ) : (
            <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
              Original photo URL was not returned by the server.
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Open the image in a new tab to zoom in while transcribing.
          </p>
        </div>

        <div className="min-w-0">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
              <LoaderCircle size={18} className="animate-spin" />
              Loading students and questions...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor={`student-${item.id}`}
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Student
                </label>

                <select
                  id={`student-${item.id}`}
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  required
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.student_id})
                    </option>
                  ))}
                </select>

                {students.length === 0 && (
                  <p className="mt-2 text-sm text-amber-700">
                    No active students were returned by the API.
                  </p>
                )}
              </div>

              <div className="space-y-5">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Question {question.order || index + 1}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                          {question.prompt}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        {question.enum_item_count} items
                      </span>
                    </div>

                    <label
                      htmlFor={`answers-${item.id}-${question.id}`}
                      className="mb-2 block text-xs font-medium text-gray-600"
                    >
                      Student's answers — one per line
                    </label>

                    <textarea
                      id={`answers-${item.id}-${question.id}`}
                      value={answers[question.id] ?? ""}
                      onChange={(event) =>
                        updateAnswer(question.id, event.target.value)
                      }
                      placeholder={"Answer 1\nAnswer 2\nAnswer 3"}
                      rows={Math.min(
                        Math.max(question.enum_item_count || 3, 3),
                        8,
                      )}
                      required
                      disabled={saving}
                      className="w-full resize-y rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      {question.enum_ordered
                        ? "Answer order matters for this question."
                        : "Answer order does not matter for this question."}
                      {" "}Maximum expected items: {question.enum_item_count}.
                    </p>
                  </div>
                ))}
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !studentId || !questions.length}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Saving answers...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Submit and grade answers
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
