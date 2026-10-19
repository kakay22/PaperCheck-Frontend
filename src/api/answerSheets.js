import api from "./client";

export async function downloadAnswerSheet(assessmentId) {
  const response = await api.get(
    `/assessments/${assessmentId}/answer-sheet/`,
    { responseType: "blob" }
  );

  const pdfUrl = window.URL.createObjectURL(
    new Blob([response.data], { type: "application/pdf" })
  );

  const link = document.createElement("a");
  link.href = pdfUrl;
  link.download = `papercheck-answer-sheet-${assessmentId}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(pdfUrl);
}
