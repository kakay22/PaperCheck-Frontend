import api from "./client";

export async function uploadScans(assessmentId, files) {
  const formData = new FormData();

  files.forEach((file, index) => {
    let name = file.name || "";
    if (!/\.(jpe?g|png|webp)$/i.test(name)) {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      name = `scan-${Date.now()}-${index}.${ext}`;
    }
    formData.append("files", file, name);
  });

  const response = await api.post(
    `/assessments/${assessmentId}/scan-uploads/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return response.data;
}

export async function processScanFile(scanFileId) {
  const response = await api.post(`/scan-files/${scanFileId}/process/`);
  return response.data;
}

export async function getScanResults(scanFileId) {
  const response = await api.get(`/scan-files/${scanFileId}/results/`);
  return response.data;
}

export async function reviewScanResult(scanResultId, selectedLabel) {
  const response = await api.patch(`/scan-results/${scanResultId}/review/`, {
    selected_label: selectedLabel,
  });
  return response.data;
}

export async function confirmDetectedAnswers(scanFileId) {
  const response = await api.post(
    `/scan-files/${scanFileId}/confirm-detected/`,
  );
  return response.data;
}

export async function gradeScanFile(scanFileId, studentId) {
  const response = await api.post(`/scan-files/${scanFileId}/grade/`, {
    student_id: studentId,
  });
  return response.data;
}

export async function approveSubmission(submissionId) {
  const response = await api.post(`/submissions/${submissionId}/approve/`);
  return response.data;
}

export async function getScanPreview(scanFileId) {
  try {
    const response = await api.get(`/scan-files/${scanFileId}/preview/`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "image/jpeg" });
    return window.URL.createObjectURL(blob);
  } catch (error) {
    const data = error.response?.data;
    if (data instanceof Blob) {
      try {
        const body = JSON.parse(await data.text());
        error.message = body.message || body.detail || error.message;
      } catch {
        /* keep the default message */
      }
    }
    throw error;
  }
}

export async function submitEnumerationPhotoReview(scanFileId, studentId) {
  const response = await api.post(
    `/scan-files/${scanFileId}/enumeration-review/`,
    { student_id: studentId },
  );

  return response.data;
}

export async function submitEnumerationAnswers(
  submissionId,
  questionId,
  answers,
) {
  const response = await api.post(
    `/submissions/${submissionId}/enumeration-answers/`,
    {
      question_id: questionId,
      answers,
    },
  );

  return response.data;
}

export async function reviewEnumerationAnswer(
  submissionId,
  answerId,
  answers,
) {
  const response = await api.patch(
    `/submissions/${submissionId}/answers/${answerId}/review/`,
    { answers },
  );

  return response.data;
}
