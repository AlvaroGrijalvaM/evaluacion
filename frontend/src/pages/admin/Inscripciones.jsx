import { useEffect, useState } from "react";
import { adminApi } from "../../api/api";
import { Alert, Panel, Table } from "./Estudiantes";

export default function AdminInscripciones() {
  const [grupos, setGrupos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [id_grupo, setIdGrupo] = useState("");
  const [id_alumno, setIdAlumno] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const [g, a, i] = await Promise.all([
        adminApi.grupos(),
        adminApi.alumnosSinGrupo(),
        adminApi.inscripciones(),
      ]);
      setGrupos(g);
      setAlumnos(a);
      setInscripciones(i);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await adminApi.inscribir({ id_grupo: Number(id_grupo), id_alumno: Number(id_alumno) });
      setMsg("Alumno asignado al grupo");
      setIdAlumno("");
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleBaja = async (id) => {
    if (!confirm("¿Cancelar inscripción?")) return;
    try {
      await adminApi.bajaInscripcion(id);
      setMsg("Inscripción cancelada");
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="Asignar estudiante a grupo">
        {err && <Alert type="error">{err}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-left">
            <span className="text-sm text-gray-600">Grupo</span>
            <select
              value={id_grupo}
              onChange={(e) => setIdGrupo(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              required>
              <option value="">Seleccionar grupo</option>
              {grupos.map((g) => (
                <option key={g.id_grupo} value={g.id_grupo}>
                  {g.nombre_grupo} — {g.nombre_capacitacion} ({g.periodo})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-left">
            <span className="text-sm text-gray-600">Estudiante sin grupo</span>
            <select
              value={id_alumno}
              onChange={(e) => setIdAlumno(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              required>
              <option value="">Seleccionar alumno</option>
              {alumnos.map((a) => (
                <option key={a.id_alumno} value={a.id_alumno}>
                  {a.matricula} — {a.nombre_alumno} {a.apellido_alumno}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">
              Asignar al grupo
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Inscripciones activas">
        <Table
          headers={["Grupo", "Alumno", "Matrícula", "Acciones"]}
          rows={inscripciones.map((i) => [
            i.nombre_grupo,
            i.alumno,
            i.matricula,
              <button
              key={i.id_inscripcion}
              onClick={() => handleBaja(i.id_inscripcion)}
              className="btn-danger">
              Dar de baja
            </button>,
          ])}
        />
      </Panel>
    </div>
  );
}
