
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/client";

function getFullName(student = {}) {
  return (
    student.full_name ||
    [student.first_name, student.middle_name, student.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Student"
  );
}

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "object") {
    return (
      value.name ||
      value.title ||
      value.full_name ||
      value.student_id ||
      "—"
    );
  }

  return String(value);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getErrorMessage(error) {
  const data = error.response?.data;

  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        const value = Array.isArray(messages)
          ? messages.join(" ")
          : String(messages);

        return `${field}: ${value}`;
      })
      .join("\n");
  }

  return error.message || "Unable to load this student's profile.";
}

function Info({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-900">
        {formatValue(value)}
      </p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon size={17} className="text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>

      {count !== undefined && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {count}
        </span>
      )}
    </div>
  );
}

function getSubmissionScore(submission) {
  const value =
    submission.approved_score ??
    submission.calculated_score ??
    submission.score;

  return value === null || value === undefined || value === ""
    ? null
    : Number(value);
}

function getSubmissionTotal(submission) {
  const value =
    submission.total_points ??
    submission.possible_score ??
    submission.total_score;

  return value === null || value === undefined || value === ""
    ? null
    : Number(value);
}

function getSubmissionTitle(submission) {
  return (
    submission.assessment_title ||
    submission.assessment_name ||
    submission.assessment?.title ||
    submission.title ||
    `Assessment #${submission.id ?? ""}`.trim()
  );
}

function getSubmissionStatus(submission) {
  return String(submission.status || "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function StudentProfilePanel({ studentPk, onClose }) {
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const closePanel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const loadProfile = useCallback(async () => {
    if (studentPk === null || studentPk === undefined) return;

    setLoading(true);
    setError("");

    try {
      const studentResponse = await api.get(`/students/${studentPk}/`);
      const studentData = studentResponse.data;

      // Use the student's database ID for enrollment matching.
      // The submission endpoint may instead filter by the school student ID.
      const [enrollmentResult, submissionResult] = await Promise.allSettled([
        api.get("/enrollments/"),
        api.get("/submissions/", {
          params: { student_id: studentData.student_id },
        }),
      ]);

      setStudent(studentData);

      if (enrollmentResult.status === "fulfilled") {
        const enrollmentData = asList(enrollmentResult.value.data);

        setEnrollments(
          enrollmentData.filter((item) => {
            const enrollmentStudent =
              item.student?.id ?? item.student;

            return String(enrollmentStudent) === String(studentData.id);
          }),
        );
      } else {
        setEnrollments([]);
        toast.error("Student details loaded, but enrollments could not load.");
      }

      if (submissionResult.status === "fulfilled") {
        const submissionData = asList(submissionResult.value.data);

        // The API may already have filtered by student_id. Avoid relying on
        // a single identifier format for the response.
        const matchedSubmissions = submissionData.filter((item) => {
          const relatedStudent =
            item.student_pk ??
            item.student?.id ??
            item.student;

          const relatedStudentNumber =
            item.student_number ??
            item.student?.student_id ??
            item.student_id;

          const matchesDatabaseId =
            relatedStudent !== null &&
            relatedStudent !== undefined &&
            String(relatedStudent) === String(studentData.id);

          const matchesStudentNumber =
            relatedStudentNumber !== null &&
            relatedStudentNumber !== undefined &&
            String(relatedStudentNumber) === String(studentData.student_id);

          // If the result has no student identifier, trust the endpoint's
          // student_id filter instead of accidentally dropping every result.
          const hasIdentifier =
            relatedStudent !== null &&
            relatedStudent !== undefined ||
            relatedStudentNumber !== null &&
            relatedStudentNumber !== undefined;

          return (
            !hasIdentifier ||
            matchesDatabaseId ||
            matchesStudentNumber
          );
        });

        setSubmissions(matchedSubmissions);
      } else {
        setSubmissions([]);
        toast.error("Student details loaded, but assessment scores could not load.");
      }
    } catch (loadError) {
      setStudent(null);
      setEnrollments([]);
      setSubmissions([]);

      const message = getErrorMessage(loadError);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [studentPk]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setStudent(null);
      setEnrollments([]);
      setSubmissions([]);

      try {
        const studentResponse = await api.get(`/students/${studentPk}/`);

        if (cancelled) return;

        const studentData = studentResponse.data;

        const [enrollmentResult, submissionResult] = await Promise.allSettled([
          api.get("/enrollments/"),
          api.get("/submissions/", {
            params: { student_id: studentData.student_id },
          }),
        ]);

        if (cancelled) return;

        setStudent(studentData);

        if (enrollmentResult.status === "fulfilled") {
          setEnrollments(
            asList(enrollmentResult.value.data).filter((item) => {
              const relatedStudent = item.student?.id ?? item.student;
              return String(relatedStudent) === String(studentData.id);
            }),
          );
        } else {
          setEnrollments([]);
        }

        if (submissionResult.status === "fulfilled") {
          setSubmissions(asList(submissionResult.value.data));
        } else {
          setSubmissions([]);
        }
      } catch (loadError) {
        if (cancelled) return;
        setError(getErrorMessage(loadError));
        setStudent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [studentPk]);

  const totalScore = useMemo(
    () =>
      submissions.reduce((sum, item) => {
        const score = getSubmissionScore(item);
        return sum + (score === null || !Number.isFinite(score) ? 0 : score);
      }, 0),
    [submissions],
  );

  const possibleScore = useMemo(
    () =>
      submissions.reduce((sum, item) => {
        const total = getSubmissionTotal(item);
        return sum + (total === null || !Number.isFinite(total) ? 0 : total);
      }, 0),
    [submissions],
  );

  const averagePercentage = useMemo(() => {
    if (possibleScore <= 0) return null;
    return (totalScore / possibleScore) * 100;
  }, [totalScore, possibleScore]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") closePanel();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePanel]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closePanel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-profile-title"
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <UserRound size={22} />
            </div>

            <div className="min-w-0">
              <h2
                id="student-profile-title"
                className="truncate text-lg font-bold text-slate-900"
              >
                Student profile
              </h2>
              <p className="text-xs text-slate-500">
                Student information, enrollment, and assessment scores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closePanel}
            aria-label="Close student profile"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </header>

        <div className="overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="grid min-h-52 place-items-center">
              <div className="text-center">
                <LoaderCircle
                  size={28}
                  className="mx-auto animate-spin text-blue-600"
                />
                <p className="mt-3 text-sm text-slate-500">
                  Loading student profile...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="whitespace-pre-line text-sm text-red-700">
                {error}
              </p>
              <button
                type="button"
                onClick={loadProfile}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-700"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          ) : student ? (
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
                    {getFullName(student).charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-lg font-bold text-slate-900">
                      {getFullName(student)}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Student ID: {formatValue(student.student_id)}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        student.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {student.is_active ? "Active student" : "Inactive student"}
                    </span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <SectionHeading
                  icon={UserRound}
                  title="Personal information"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Info label="Student ID" value={student.student_id} />
                  <Info label="First name" value={student.first_name} />
                  <Info label="Middle name" value={student.middle_name} />
                  <Info label="Last name" value={student.last_name} />
                  <Info label="Email" value={student.email} />
                  <Info label="School" value={student.school_name ?? student.school} />
                  <Info label="Date added" value={formatDate(student.created_at)} />
                  <Info label="Account status" value={student.is_active ? "Active" : "Inactive"} />
                </div>
              </section>

              <section className="space-y-3">
                <SectionHeading
                  icon={GraduationCap}
                  title="Classroom enrollments"
                  count={enrollments.length}
                />

                {enrollments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center">
                    <GraduationCap
                      size={23}
                      className="mx-auto text-slate-400"
                    />
                    <p className="mt-2 text-sm text-slate-500">
                      No classroom enrollments found.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex flex-col gap-2 border-b border-slate-100 p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
                            <BookOpen size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium text-slate-900">
                              {formatValue(
                                enrollment.classroom_name ??
                                  enrollment.classroom?.name ??
                                  enrollment.classroom,
                              )}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Enrolled: {formatDate(enrollment.enrolled_at)}
                            </p>
                          </div>
                        </div>

                        <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {formatValue(enrollment.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <SectionHeading
                  icon={CalendarDays}
                  title="Assessment scores"
                  count={submissions.length}
                />

                {submissions.length > 0 && possibleScore > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="text-xs text-blue-700">Recorded points</p>
                      <p className="mt-1 text-xl font-bold text-blue-900">
                        {Number(totalScore.toFixed(2))} /{" "}
                        {Number(possibleScore.toFixed(2))}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-xs text-emerald-700">
                        Overall percentage
                      </p>
                      <p className="mt-1 text-xl font-bold text-emerald-900">
                        {averagePercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                {submissions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center">
                    <BookOpen
                      size={23}
                      className="mx-auto text-slate-400"
                    />
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      No assessment submissions found.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Scores will appear here when submissions are available.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    {submissions.map((submission, index) => {
                      const score = getSubmissionScore(submission);
                      const total = getSubmissionTotal(submission);
                      const percentage =
                        score !== null &&
                        total !== null &&
                        Number.isFinite(score) &&
                        Number.isFinite(total) &&
                        total > 0
                          ? (score / total) * 100
                          : null;

                      return (
                        <div
                          key={submission.id ?? `${getSubmissionTitle(submission)}-${index}`}
                          className="flex flex-col gap-3 border-b border-slate-100 p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-slate-900">
                              {getSubmissionTitle(submission)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {getSubmissionStatus(submission)}
                              {submission.submitted_at
                                ? ` · ${formatDate(submission.submitted_at)}`
                                : ""}
                            </p>
                          </div>

                          <div className="shrink-0 sm:text-right">
                            <p className="text-sm font-bold text-slate-900">
                              {score === null
                                ? "Not graded"
                                : `${score}${total !== null ? ` / ${total}` : ""}`}
                            </p>
                            {percentage !== null && (
                              <p className="mt-1 text-xs text-slate-500">
                                {percentage.toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-slate-500">
              Student information is unavailable.
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-slate-200 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={closePanel}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close profile
          </button>
        </footer>
      </section>
    </div>
  );
}
