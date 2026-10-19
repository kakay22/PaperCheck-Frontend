import api from "./client";

function getList(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

export async function getAssessments() {
  const response = await api.get("/assessments/");
  return getList(response.data);
}

export async function getAssessment(assessmentId) {
  const response = await api.get(`/assessments/${assessmentId}/`);
  return response.data;
}

export async function createAssessment(assessmentData) {
  const response = await api.post("/assessments/", assessmentData);
  return response.data;
}

export async function updateAssessment(assessmentId, assessmentData) {
  const response = await api.patch(
    `/assessments/${assessmentId}/`,
    assessmentData,
  );
  return response.data;
}

export async function publishAssessment(assessmentId) {
  const response = await api.post(
    `/assessments/${assessmentId}/publish/`,
  );
  return response.data;
}

export async function closeAssessment(assessmentId) {
  const response = await api.post(
    `/assessments/${assessmentId}/close/`,
  );
  return response.data;
}