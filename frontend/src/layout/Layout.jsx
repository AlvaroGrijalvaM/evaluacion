import Breadcrumb from "../breadcrumb";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-[100dvh] page-bg">
      <header className="header-primary px-6 py-4 flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-[#C9A84C]">Sistema de Evaluación</h1>
        {user && (
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span>
              {user.nombre} {user.apellido} ({user.tipo})
            </span>
            <Link to="/cambiar-password" className="btn-inverted text-xs">
              Cambiar contraseña
            </Link>
            <button onClick={handleLogout} className="btn-inverted">
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-col items-center gap-6 py-8 px-4">
        <Breadcrumb />
        <div className="w-full max-w-5xl">
          <Outlet />
        </div>

        {user?.tipo === "ADMIN" && (
          <nav className="flex flex-wrap gap-3 justify-center">
            <NavLink to="/admin/estudiantes">Estudiantes</NavLink>
            <NavLink to="/admin/maestros">Maestros</NavLink>
            <NavLink to="/admin/inscripciones">Inscripciones</NavLink>
            <NavLink to="/admin/clases">Clases</NavLink>
            <NavLink to="/admin/promover">Promover grupo</NavLink>
          </nav>
        )}
        {user?.tipo === "ALUMNO" && (
          <nav className="flex gap-3">
            <NavLink to="/alumno/calificaciones">Ver calificaciones</NavLink>
            <NavLink to="/alumno/credencial">Credencial digital</NavLink>
          </nav>
        )}
        {user?.tipo === "MAESTRO" && (
          <nav className="flex gap-3">
            <NavLink to="/maestro/clases">Mis clases</NavLink>
          </nav>
        )}
      </div>
    </div>
  );
}

function NavLink({ to, children }) {
  return (
    <Link to={to} className="nav-link">
      {children}
    </Link>
  );
}
