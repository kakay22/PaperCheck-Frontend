
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import QuestionEditor from "./pages/QuestionEditor";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />

      <Route
        path="/assessments/:assessmentId/questions"
        element={<QuestionEditor />}
      />
    </Routes>
  );
}
