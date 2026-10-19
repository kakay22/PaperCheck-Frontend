import api from "./client";

function getList(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

export async function getQuestions(assessmentId) {
  const response = await api.get("/questions/", {
    params: { assessment: assessmentId },
  });

  return getList(response.data);
}

export async function createQuestion(questionData) {
  const response = await api.post("/questions/", questionData);
  return response.data;
}

export async function updateQuestion(questionId, questionData) {
  const response = await api.patch(
    `/questions/${questionId}/`,
    questionData,
  );

  return response.data;
}

export async function deleteQuestion(questionId) {
  await api.delete(`/questions/${questionId}/`);
}
 