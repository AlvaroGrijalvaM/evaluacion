import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { maestroApi } from "../../api/api";
import { Alert, Panel, Table } from "../admin/Estudiantes";

export default function MaestroClases() {
  const [clases, setClases] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    maestroApi.clases().then(setClases).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      {err && <Alert type="error">{err}</Alert>}
      <Panel title="Clases asignadas">
        <Table
          headers={["Grupo", "Asignatura", "Acciones"]}
          rows={clases.map((c) => [
            c.nombre_grupo,
            c.nombre_asignatura,
            <div key={c.id_clase} className="flex gap-2 flex-wrap">
              <Link
                to={`/maestro/clases/${c.id_clase}/evidencias`}
                className="btn-primary text-sm">
                Evidencias
              </Link>
              <Link
                to={`/maestro/clases/${c.id_clase}/calificaciones`}
                className="btn-dark text-sm">
                Calificar
              </Link>
            </div>,
          ])}
        />
      </Panel>
    </div>
  );
}
