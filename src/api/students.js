import api from "./client";

function getList(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

export async function getStudents() {
  const response = await api.get("/students/");
  return getList(response.data);
}

export async function getEnrollments() {
  const response = await api.get("/enrollments/");
  return getList(response.data);
}

export async function createStudent(studentData) {
  const response = await api.post("/students/", studentData);
  return response.data;
}

export async function enrollStudent(classroomId, studentId) {
  const response = await api.post("/enrollments/", {
    classroom: Number(classroomId),
    student: Number(studentId),
    status: "ENROLLED",
  });

  return response.data;
}

export async function updateEnrollment(enrollmentId, enrollmentData) {
  const response = await api.patch(
    `/enrollments/${enrollmentId}/`,
    enrollmentData,
  );

  return response.data;
}
