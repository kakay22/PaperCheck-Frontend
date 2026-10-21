
import api from "./client";

export async function getMyAccount() {
  const response = await api.get("/auth/me/");
  return response.data;
}

export async function updateMyAccount(accountData) {
  const response = await api.patch("/auth/me/", accountData);
  return response.data;
}

export async function changeMyPassword(passwordData) {
  const response = await api.post(
    "/auth/change-password/",
    passwordData,
  );
  return response.data;
}

export async function registerTeacher(teacherData) {
  const response = await api.post("/auth/register/", teacherData);
  return response.data;
}
