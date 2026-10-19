import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/client";
import {
  createStudent,
  enrollStudent,
  getEnrollments,
  getStudents,
} from "../api/students";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

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

export default function Students() {
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    student_id: "",
    first_name: "",
    middle_name: "",
    last_name: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [classroomResponse, studentData, enrollmentData] =
        await Promise.all([
          api.get("/classes/"),
          getStudents(),
          getEnrollments(),
        ]);

      const classroomData = Array.isArray(classroomResponse.data)
        ? classroomResponse.data
        : classroomResponse.data?.results || [];

      setClassrooms(classroomData);
      setStudents(studentData);
      setEnrollments(enrollmentData);

      setSelectedClassroom((current) => {
        if (
          current &&
          classroomData.some((item) => String(item.id) === current)
        ) {
          return current;
        }

        return classroomData.length ? String(classroomData[0].id) : "";
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      toast.error("Unable to load student records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeEnrollments = useMemo(() => {
    return enrollments.filter(
      (enrollment) =>
        String(enrollment.classroom) === selectedClassroom &&
        enrollment.status === "ENROLLED",
    );
  }, [enrollments, selectedClassroom]);

  const roster = useMemo(() => {
    const enrolledIds = new Set(
      activeEnrollments.map((enrollment) => Number(enrollment.student)),
    );

    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      if (!enrolledIds.has(Number(student.id))) return false;

      const fullName =
        student.full_name ||
        [student.first_name, student.middle_name, student.last_name]
          .filter(Boolean)
          .join(" ");

      return [
        student.student_id,
        fullName,
        student.first_name,
        student.last_name,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [students, activeEnrollments, search]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    const classroom = classrooms.find(
      (item) => String(item.id) === selectedClassroom,
    );

    if (!classroom) {
      toast.error("Please create or select a classroom first.");
      return;
    }

    if (
      !form.student_id.trim() ||
      !form.first_name.trim() ||
      !form.last_name.trim()
    ) {
      toast.error("Student ID, first name, and last name are required.");
      return;
    }

    setSubmitting(true);

    try {
      let student;

      const existingStudent = students.find(
        (item) =>
          String(item.student_id).trim().toLowerCase() ===
          form.student_id.trim().toLowerCase(),
      );

      if (existingStudent) {
        if (Number(existingStudent.school) !== Number(classroom.school)) {
          toast.error(
            "This student ID belongs to a student from another school.",
          );
          return;
        }

        student = existingStudent;
      } else {
        student = await createStudent({
          school: Number(classroom.school),
          student_id: form.student_id.trim(),
          first_name: form.first_name.trim(),
          middle_name: form.middle_name.trim(),
          last_name: form.last_name.trim(),
          is_active: true,
        });
      }

      const alreadyEnrolled = enrollments.some(
        (enrollment) =>
          Number(enrollment.classroom) === Number(classroom.id) &&
          Number(enrollment.student) === Number(student.id),
      );

      if (alreadyEnrolled) {
        toast.error("This student is already enrolled in this classroom.");
        await loadData();
        return;
      }

      await enrollStudent(classroom.id, student.id);

      toast.success("Student added to the classroom.");

      setForm({
        student_id: "",
        first_name: "",
        middle_name: "",
        last_name: "",
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
            STUDENT MANAGEMENT
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Students
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage student records and classroom enrollment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={classrooms.length === 0}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Add student
        </button>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <GraduationCap size={21} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Students in classroom</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {loading ? "—" : activeEnrollments.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <Users size={21} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Available classrooms</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {loading ? "—" : classrooms.length}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">
              Classroom roster
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Choose a classroom to view its enrolled students.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedClassroom}
              onChange={(event) => setSelectedClassroom(event.target.value)}
              disabled={loading || classrooms.length === 0}
              aria-label="Select classroom"
              className={`${inputClass} sm:w-56`}
            >
              {classrooms.length === 0 && (
                <option value="">No classrooms available</option>
              )}

              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>

            <div className="relative sm:w-56">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students..."
                aria-label="Search students"
                className={`${inputClass} pl-9`}
              />
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              aria-label="Refresh students"
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
                className="h-14 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : classrooms.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Users size={26} className="mx-auto text-slate-400" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              Create a classroom first
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Students must be associated with a classroom.
            </p>
          </div>
        ) : roster.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Users size={26} className="mx-auto text-slate-400" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              {search ? "No matching students" : "No students enrolled yet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try searching by student ID or name."
                : "Add a student to start building this classroom's roster."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-4 text-sm font-semibold text-blue-600"
              >
                Add the first student
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Student ID</th>
                  <th className="px-4 py-3 font-medium">Student name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roster.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {student.student_id}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {student.full_name ||
                        [
                          student.first_name,
                          student.middle_name,
                          student.last_name,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          student.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {student.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && classrooms.length > 0 && (
          <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            Showing {roster.length} of {activeEnrollments.length} enrolled
            students
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
            aria-labelledby="add-student-title"
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="add-student-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Add student
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  The student will be enrolled in the selected classroom.
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
              <Field label="Student ID *">
                <input
                  name="student_id"
                  value={form.student_id}
                  onChange={updateField}
                  required
                  maxLength={50}
                  placeholder="e.g. 2026-001"
                  className={inputClass}
                />
              </Field>

              <Field label="First name *">
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={updateField}
                  required
                  maxLength={100}
                  className={inputClass}
                />
              </Field>

              <Field label="Middle name">
                <input
                  name="middle_name"
                  value={form.middle_name}
                  onChange={updateField}
                  maxLength={100}
                  className={inputClass}
                />
              </Field>

              <Field label="Last name *">
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={updateField}
                  required
                  maxLength={100}
                  className={inputClass}
                />
              </Field>

              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                Classroom:{" "}
                <span className="font-semibold">
                  {
                    classrooms.find(
                      (item) => String(item.id) === selectedClassroom,
                    )?.name
                  }
                </span>
              </div>

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
                  {submitting ? "Saving..." : "Add student"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}