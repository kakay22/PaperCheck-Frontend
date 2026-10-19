
import api from "./client";

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

async function fetchCount(endpoint) {
  const response = await api.get(endpoint);
  return getList(response.data).length;
}

export async function getDashboardSummary() {
  const endpoints = [
    ["classrooms", "/classes/"],
    ["students", "/students/"],
    ["assessments", "/assessments/"],
  ];

  const results = await Promise.allSettled(
    endpoints.map(async ([key, endpoint]) => [
      key,
      await fetchCount(endpoint),
    ]),
  );

  const summary = {
    classrooms: null,
    students: null,
    assessments: null,
    errors: [],
  };

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const [key, count] = result.value;
      summary[key] = count;
    } else {
      summary.errors.push({
        resource: endpoints[index][0],
        message:
          result.reason?.response?.data?.detail ||
          result.reason?.message ||
          "Unable to load data.",
      });
    }
  });

  return summary;
}
