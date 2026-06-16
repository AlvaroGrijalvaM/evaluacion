import { useEffect, useState } from "react";
import { alumnoApi } from "../../api/api";
import { Alert, Panel, Table } from "../admin/Estudiantes";

export default function AlumnoCalificaciones() {
  const [calificaciones, setCalificaciones] = useState([]);
  const [grupo, setGrupo] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([alumnoApi.calificaciones(), alumnoApi.grupo()])
      .then(([c, g]) => {
        setCalificaciones(c);
        setGrupo(g);
      })
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="space-y-6">
      {err && <Alert type="error">{err}</Alert>}

      {grupo && (
        <Panel title="Grupo actual">
          <p className="text-primary">
            <strong>{grupo.nombre_grupo}</strong> — {grupo.nombre_capacitacion} — Ciclo {grupo.periodo}
          </p>
          <p className="text-sm text-gray-600">Tutor: {grupo.nombre_tutor}</p>
        </Panel>
      )}

      <Panel title="Boleta de calificaciones">
        <Table
          headers={["Asignatura", "P1", "P2", "P3", "P4", "P5", "Promedio"]}
          rows={calificaciones.map((c) => [
            c.nombre_asignatura,
            c.parcial_1 ?? "—",
            c.parcial_2 ?? "—",
            c.parcial_3 ?? "—",
            c.parcial_4 ?? "—",
            c.parcial_5 ?? "—",
            c.promedio ?? "—",
          ])}
        />
      </Panel>
    </div>
  );
}
