import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const links = {
    ADMIN: [
      { to: "/admin/estudiantes", label: "Alta/baja de estudiantes" },
      { to: "/admin/maestros", label: "Alta/baja de maestros" },
      { to: "/admin/inscripciones", label: "Asignar estudiantes a grupos" },
      { to: "/admin/clases", label: "Asignar maestros a clases" },
      { to: "/admin/promover", label: "Incremento de grado de grupo" },
    ],
    ALUMNO: [
      { to: "/alumno/calificaciones", label: "Ver calificaciones del grupo" },
      { to: "/alumno/credencial", label: "Descargar credencial digital PDF" },
    ],
    MAESTRO: [
      { to: "/maestro/clases", label: "Acceder a mis clases" },
    ],
  };

  const roleLabel = { ADMIN: "Administrador", ALUMNO: "Estudiante", MAESTRO: "Maestro" };

  return (
    <div className="bg-white rounded-lg shadow p-8 text-left">
      <h2 className="text-2xl text-primary mb-2">
        Bienvenido, {user.nombre} {user.apellido}
      </h2>
      <p className="text-gray-600 mb-6">Panel de {roleLabel[user.tipo]}</p>

      <ul className="space-y-3">
        {(links[user.tipo] || []).map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="dashboard-link">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
