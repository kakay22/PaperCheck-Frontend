
import api from "./client";

export async function login(username, password) {
  const response = await api.post("/auth/login/", {
    username,
    password,
  });

  const { access, refresh } = response.data;

  localStorage.setItem("papercheck_access", access);
  localStorage.setItem("papercheck_refresh", refresh);

  return response.data;
}

export function logout() {
  localStorage.removeItem("papercheck_access");
  localStorage.removeItem("papercheck_refresh");
}
