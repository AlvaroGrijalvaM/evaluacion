import { useEffect, useState } from "react";
import { adminApi } from "../../api/api";
import { Alert, Panel, Table } from "./Estudiantes";

export default function AdminClases() {
  const [clases, setClases] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [maestros, setMaestros] = useState([]);
  const [form, setForm] = useState({ id_grupo: "", id_asignatura: "", id_maestro: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadClases = () => adminApi.clases().then(setClases).catch((e) => setErr(e.message));

  useEffect(() => {
    Promise.all([adminApi.grupos(), adminApi.maestrosActivos()]).then(([g, m]) => {
      setGrupos(g);
      setMaestros(m);
    });
    loadClases();
  }, []);

  useEffect(() => {
    if (!form.id_grupo) {
      setAsignaturas([]);
      return;
    }
    const grupo = grupos.find((g) => g.id_grupo === Number(form.id_grupo));
    if (!grupo) return;
    adminApi
      .asignaturas({ id_capacitacion: grupo.id_capacitacion, grado: grupo.grado })
      .then(setAsignaturas)
      .catch((e) => setErr(e.message));
  }, [form.id_grupo, grupos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await adminApi.crearClase({
        id_grupo: Number(form.id_grupo),
        id_asignatura: Number(form.id_asignatura),
        id_maestro: Number(form.id_maestro),
      });
      setMsg("Maestro asignado a la clase");
      setForm({ ...form, id_asignatura: "" });
      loadClases();
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta clase?")) return;
    try {
      await adminApi.eliminarClase(id);
      setMsg("Clase eliminada");
      loadClases();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="Asignar maestro a clase (grupo + asignatura)">
        {err && <Alert type="error">{err}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block text-left">
            <span className="text-sm text-gray-600">Grupo</span>
            <select
              value={form.id_grupo}
              onChange={(e) => setForm({ ...form, id_grupo: e.target.value, id_asignatura: "" })}
              className="mt-1 w-full border rounded px-3 py-2"
              required>
              <option value="">Seleccionar</option>
              {grupos.map((g) => (
                <option key={g.id_grupo} value={g.id_grupo}>
                  {g.nombre_grupo} — {g.nombre_capacitacion}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-left">
            <span className="text-sm text-gray-600">Asignatura</span>
            <select
              value={form.id_asignatura}
              onChange={(e) => setForm({ ...form, id_asignatura: e.target.value })}
              className="mt-1 w-full border rounded px-3 py-2"
              required
              disabled={!form.id_grupo}>
              <option value="">Seleccionar</option>
              {asignaturas.map((a) => (
                <option key={a.id_asignatura} value={a.id_asignatura}>
                  {a.nombre_asignatura}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-left">
            <span className="text-sm text-gray-600">Maestro</span>
            <select
              value={form.id_maestro}
              onChange={(e) => setForm({ ...form, id_maestro: e.target.value })}
              className="mt-1 w-full border rounded px-3 py-2"
              required>
              <option value="">Seleccionar</option>
              {maestros.map((m) => (
                <option key={m.id_maestro} value={m.id_maestro}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-3">
            <button type="submit" className="btn-primary">
              Asignar clase
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Clases asignadas">
        <Table
          headers={["Grupo", "Asignatura", "Maestro", "Acciones"]}
          rows={clases.map((c) => [
            c.nombre_grupo,
            c.nombre_asignatura,
            c.maestro,
            <button
              key={c.id_clase}
              onClick={() => handleDelete(c.id_clase)}
              className="btn-danger">
              Eliminar
            </button>,
          ])}
        />
      </Panel>
    </div>
  );
}
