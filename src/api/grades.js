import api from "./client";

export async function getSubmissions(params = {}) {
  const response = await api.get("/submissions/", { params });
  return response.data.results || [];
}