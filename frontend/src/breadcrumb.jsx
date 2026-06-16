import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

function Arrow() {
  return <span className="text-[#37474F] text-xl select-none">›</span>;
}

const CRUMB = {
  admin: { label: "Administrador", path: "/admin" },
  estudiantes: { label: "Estudiantes", path: "/admin/estudiantes" },
  maestros: { label: "Maestros", path: "/admin/maestros" },
  inscripciones: { label: "Inscripciones", path: "/admin/inscripciones" },
  clases: { label: "Clases", path: "/admin/clases" },
  promover: { label: "Promover grupo", path: "/admin/promover" },
  alumno: { label: "Alumno", path: "/alumno" },
  calificaciones: { label: "Calificaciones", path: "/alumno/calificaciones" },
  credencial: { label: "Credencial", path: "/alumno/credencial" },
  maestro: { label: "Maestro", path: "/maestro" },
  "mis-clases": { label: "Mis clases", path: "/maestro/clases" },
  evidencias: { label: "Evidencias", path: null },
  "calificar": { label: "Calificar", path: null },
};

function CrumbLink({ to, label, active, parent }) {
  return (
    <>
      <Arrow />
      <Link
        to={to}
        className={`breadcrumb-link ${active ? "breadcrumb-link-active" : parent ? "breadcrumb-link-parent" : ""}`}>
        {label}
      </Link>
    </>
  );
}

export default function Breadcrumb() {
  const location = useLocation();
  const { user } = useAuth();
  const parts = location.pathname.split("/").filter(Boolean);

  if (location.pathname === "/login" || location.pathname === "/dashboard") return null;

  const roleSection = parts[0];
  const subSection = parts[1];
  const detail = parts[2];

  return (
    <div className="bg-white w-full">
      <ul className="flex border p-2 gap-6 text-xl text-[#37474F] items-center flex-wrap justify-center">
        <Link
          to="/dashboard"
          className={`breadcrumb-link ${location.pathname === "/dashboard" ? "breadcrumb-link-active" : ""}`}>
          Inicio
        </Link>

        {roleSection === "admin" && user?.tipo === "ADMIN" && (
          <>
            <CrumbLink
              to="/admin/estudiantes"
              label="Administrador"
              active={!subSection}
              parent={!!subSection}
            />
            {subSection && CRUMB[subSection] && (
              <CrumbLink
                to={CRUMB[subSection].path}
                label={CRUMB[subSection].label}
                active={!detail}
                parent={!!detail}
              />
            )}
          </>
        )}

        {roleSection === "alumno" && user?.tipo === "ALUMNO" && (
          <>
            <CrumbLink
              to="/alumno/calificaciones"
              label="Alumno"
              active={!subSection}
              parent={!!subSection}
            />
            {subSection && CRUMB[subSection] && (
              <CrumbLink
                to={CRUMB[subSection].path}
                label={CRUMB[subSection].label}
                active
              />
            )}
          </>
        )}

        {roleSection === "maestro" && user?.tipo === "MAESTRO" && (
          <>
            <CrumbLink
              to="/maestro/clases"
              label="Maestro"
              active={!subSection}
              parent={!!subSection}
            />
            {subSection === "clases" && !detail && (
              <CrumbLink to="/maestro/clases" label="Mis clases" active />
            )}
            {subSection === "clases" && detail && parts[3] === "evidencias" && (
              <>
                <CrumbLink to="/maestro/clases" label="Mis clases" parent />
                <CrumbLink to={`/maestro/clases/${detail}/evidencias`} label="Evidencias" active />
              </>
            )}
            {subSection === "clases" && detail && parts[3] === "calificaciones" && (
              <>
                <CrumbLink to="/maestro/clases" label="Mis clases" parent />
                <CrumbLink
                  to={`/maestro/clases/${detail}/calificaciones`}
                  label="Calificar"
                  active
                />
              </>
            )}
          </>
        )}
      </ul>
    </div>
  );
}