import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminEstudiantes from "./pages/admin/Estudiantes";
import AdminMaestros from "./pages/admin/Maestros";
import AdminInscripciones from "./pages/admin/Inscripciones";
import AdminClases from "./pages/admin/Clases";
import AdminPromover from "./pages/admin/Promover";
import AlumnoCalificaciones from "./pages/alumno/Calificaciones";
import AlumnoCredencial from "./pages/alumno/Credencial";
import MaestroClases from "./pages/maestro/Clases";
import MaestroEvidencias from "./pages/maestro/Evidencias";
import MaestroCalificaciones from "./pages/maestro/Calificaciones";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="admin">
              <Route index element={<Navigate replace to="estudiantes" />} />
              <Route
                path="estudiantes"
                element={
                  <ProtectedRoute roles={["ADMIN"]}>
                    <AdminEstudiantes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="maestros"
                element={
                  <ProtectedRoute roles={["ADMIN"]}>
                    <AdminMaestros />
                  </ProtectedRoute>
                }
              />
              <Route
                path="inscripciones"
                element={
                  <ProtectedRoute roles={["ADMIN"]}>
                    <AdminInscripciones />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clases"
                element={
                  <ProtectedRoute roles={["ADMIN"]}>
                    <AdminClases />
                  </ProtectedRoute>
                }
              />
              <Route
                path="promover"
                element={
                  <ProtectedRoute roles={["ADMIN"]}>
                    <AdminPromover />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="alumno">
              <Route index element={<Navigate replace to="calificaciones" />} />
              <Route
                path="calificaciones"
                element={
                  <ProtectedRoute roles={["ALUMNO"]}>
                    <AlumnoCalificaciones />
                  </ProtectedRoute>
                }
              />
              <Route
                path="credencial"
                element={
                  <ProtectedRoute roles={["ALUMNO"]}>
                    <AlumnoCredencial />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="maestro">
              <Route index element={<Navigate replace to="clases" />} />
              <Route
                path="clases"
                element={
                  <ProtectedRoute roles={["MAESTRO"]}>
                    <MaestroClases />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clases/:claseId/evidencias"
                element={
                  <ProtectedRoute roles={["MAESTRO"]}>
                    <MaestroEvidencias />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clases/:claseId/calificaciones"
                element={
                  <ProtectedRoute roles={["MAESTRO"]}>
                    <MaestroCalificaciones />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate replace to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
