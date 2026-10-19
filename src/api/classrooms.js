import api from "./client";

function getList(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

export async function getClassrooms() {
  const response = await api.get("/classes/");
  return getList(response.data);
}

export async function getSchools() {
  const response = await api.get("/schools/");
  return getList(response.data);
}

export async function createClassroom(classroomData) {
  const response = await api.post("/classes/", classroomData);
  return response.data;
}