
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import QuestionEditor from "./pages/QuestionEditor";
import ScanAnswers from "./pages/ScanAnswers";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />} />
        <Route
          path="/assessments/:assessmentId/questions"
          element={<QuestionEditor />}
        />
        <Route
          path="/assessments/:assessmentId/scan"
          element={<ScanAnswers />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
