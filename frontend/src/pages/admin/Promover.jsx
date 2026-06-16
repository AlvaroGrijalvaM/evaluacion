import { useEffect, useState } from "react";
import { adminApi } from "../../api/api";
import { Alert, Input, Panel } from "./Estudiantes";

export default function AdminPromover() {
  const [grupos, setGrupos] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [maestros, setMaestros] = useState([]);
  const [id_grupo_actual, setIdGrupoActual] = useState("");
  const [id_grupo_nuevo, setIdGrupoNuevo] = useState("");
  const [nuevoGrupo, setNuevoGrupo] = useState({
    grado: "",
    numero_grupo: "",
    id_capacitacion: "",
    id_ciclo: "",
    id_maestro_tutor: "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.grupos(),
      adminApi.ciclos(),
      adminApi.capacitaciones(),
      adminApi.maestrosActivos(),
    ]).then(([g, c, cap, m]) => {
      setGrupos(g);
      setCiclos(c);
      setCapacitaciones(cap);
      setMaestros(m);
    });
  }, []);

  const grupoActual = grupos.find((g) => g.id_grupo === Number(id_grupo_actual));

  useEffect(() => {
    if (grupoActual) {
      setNuevoGrupo((prev) => ({
        ...prev,
        grado: String(Number(grupoActual.grado || 0) + 1),
        numero_grupo: grupoActual.numero_grupo || "",
        id_capacitacion: String(grupoActual.id_capacitacion || ""),
        id_ciclo: String(grupoActual.id_ciclo || ""),
      }));
    }
  }, [id_grupo_actual, grupoActual?.id_grupo]);

  const handleCrearGrupo = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const res = await adminApi.crearGrupo({
        grado: Number(nuevoGrupo.grado),
        numero_grupo: nuevoGrupo.numero_grupo,
        id_capacitacion: Number(nuevoGrupo.id_capacitacion),
        id_ciclo: Number(nuevoGrupo.id_ciclo),
        id_maestro_tutor: Number(nuevoGrupo.id_maestro_tutor),
      });
      setIdGrupoNuevo(String(res.id_grupo));
      setMsg(`Grupo del siguiente grado creado (ID: ${res.id_grupo})`);
      const g = await adminApi.grupos();
      setGrupos(g);
    } catch (e) {
      setErr(e.message);
    }
  };

  const handlePromover = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await adminApi.promoverGrupo({
        id_grupo_actual: Number(id_grupo_actual),
        id_grupo_nuevo: Number(id_grupo_nuevo),
      });
      setMsg("Estudiantes promovidos al nuevo grado");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {err && <Alert type="error">{err}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      <Panel title="Paso 1: Crear grupo del siguiente grado">
        <p className="text-sm text-gray-600 mb-4">
          Cree el grupo destino (grado superior) antes de promover a los alumnos.
        </p>
        <form onSubmit={handleCrearGrupo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Grado" type="number" value={nuevoGrupo.grado} onChange={(v) => setNuevoGrupo({ ...nuevoGrupo, grado: v })} required />
          <Input label="Número de grupo" value={nuevoGrupo.numero_grupo} onChange={(v) => setNuevoGrupo({ ...nuevoGrupo, numero_grupo: v })} required />
          <label className="block text-left">
            <span className="text-sm text-gray-600">Capacitación</span>
            <select
              value={nuevoGrupo.id_capacitacion}
              onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, id_capacitacion: e.target.value })}
              className="input-field"
              required>
              <option value="">Seleccionar</option>
              {capacitaciones.map((c) => (
                <option key={c.id_capacitacion} value={c.id_capacitacion}>{c.nombre_capacitacion}</option>
              ))}
            </select>
          </label>
          <label className="block text-left">
            <span className="text-sm text-gray-600">Ciclo escolar</span>
            <select
              value={nuevoGrupo.id_ciclo}
              onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, id_ciclo: e.target.value })}
              className="input-field"
              required>
              <option value="">Seleccionar</option>
              {ciclos.map((c) => (
                <option key={c.id_ciclo} value={c.id_ciclo}>{c.periodo}</option>
              ))}
            </select>
          </label>
          <label className="block text-left md:col-span-2">
            <span className="text-sm text-gray-600">Maestro tutor</span>
            <select
              value={nuevoGrupo.id_maestro_tutor}
              onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, id_maestro_tutor: e.target.value })}
              className="input-field"
              required>
              <option value="">Seleccionar</option>
              {maestros.map((m) => (
                <option key={m.id_maestro} value={m.id_maestro}>{m.nombre}</option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">
              Crear grupo destino
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Paso 2: Promover estudiantes">
        <form onSubmit={handlePromover} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-left">
            <span className="text-sm text-gray-600">Grupo actual</span>
            <select
              value={id_grupo_actual}
              onChange={(e) => setIdGrupoActual(e.target.value)}
              className="input-field"
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
            <span className="text-sm text-gray-600">Grupo destino (nuevo grado)</span>
            <select
              value={id_grupo_nuevo}
              onChange={(e) => setIdGrupoNuevo(e.target.value)}
              className="input-field"
              required>
              <option value="">Seleccionar</option>
              {grupos.map((g) => (
                <option key={g.id_grupo} value={g.id_grupo}>
                  {g.nombre_grupo} — {g.nombre_capacitacion}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn-dark">
              Promover grupo
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
