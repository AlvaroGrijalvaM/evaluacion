import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { maestroApi } from "../../api/api";
import { Alert, Panel } from "../admin/Estudiantes";

export default function MaestroCalificaciones() {
  const { claseId } = useParams();
  const [parciales, setParciales] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [id_parcial, setIdParcial] = useState("");
  const [notas, setNotas] = useState({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([maestroApi.parciales(claseId), maestroApi.alumnos(claseId)])
      .then(([p, a]) => {
        setParciales(p);
        setAlumnos(a);
        if (p.length > 0) setIdParcial(String(p[0].id_parcial));
      })
      .catch((e) => setErr(e.message));
  }, [claseId]);

  useEffect(() => {
    if (!id_parcial) return;
    maestroApi
      .calificaciones(claseId, id_parcial)
      .then((rows) => {
        const map = {};
        rows.forEach((r) => {
          map[r.id_alumno] = { calificacion: r.calificacion, observaciones: r.observaciones || "" };
        });
        setNotas(map);
      })
      .catch((e) => setErr(e.message));
  }, [claseId, id_parcial]);

  const handleChange = (idAlumno, field, value) => {
    setNotas((prev) => ({
      ...prev,
      [idAlumno]: { ...prev[idAlumno], [field]: value },
    }));
  };

  const handleSave = async (idAlumno) => {
    const data = notas[idAlumno];
    if (!data?.calificacion && data?.calificacion !== 0) {
      setErr("Ingrese una calificación");
      return;
    }
    setErr("");
    setMsg("");
    try {
      await maestroApi.registrarCalificacion({
        id_parcial: Number(id_parcial),
        id_alumno: idAlumno,
        calificacion: Number(data.calificacion),
        observaciones: data.observaciones,
      });
      setMsg("Calificación guardada");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {err && <Alert type="error">{err}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      <Panel title="Calificar estudiantes por parcial">
        <label className="block text-left mb-4 max-w-xs">
          <span className="text-sm text-gray-600">Parcial</span>
          <select
            value={id_parcial}
            onChange={(e) => setIdParcial(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2">
            {parciales.map((p) => (
              <option key={p.id_parcial} value={p.id_parcial}>
                Parcial {p.numero_parcial}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-4">
          {alumnos.map((a) => (
            <div
              key={a.id_alumno}
              className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border-b pb-4">
              <div className="md:col-span-1 text-left">
                <p className="font-medium">{a.nombre}</p>
                <p className="text-xs text-gray-500">{a.matricula}</p>
              </div>
              <label className="text-left">
                <span className="text-xs text-gray-600">Calificación (0-100)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={notas[a.id_alumno]?.calificacion ?? ""}
                  onChange={(e) => handleChange(a.id_alumno, "calificacion", e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </label>
              <label className="text-left">
                <span className="text-xs text-gray-600">Observaciones</span>
                <input
                  type="text"
                  value={notas[a.id_alumno]?.observaciones ?? ""}
                  onChange={(e) => handleChange(a.id_alumno, "observaciones", e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </label>
              <button
                onClick={() => handleSave(a.id_alumno)}
                className="btn-dark">
                Guardar
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
