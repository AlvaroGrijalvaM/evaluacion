import { useEffect, useState } from "react";
import { adminApi } from "../../api/api";
import { Alert, Input, Panel, Table } from "./Estudiantes";

export default function AdminMaestros() {
  const [maestros, setMaestros] = useState([]);
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", telefono: "", curp: "", titulo: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [credenciales, setCredenciales] = useState(null);

  const load = () => adminApi.maestros().then(setMaestros).catch((e) => setErr(e.message));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setCredenciales(null);
    try {
      const res = await adminApi.crearMaestro(form);
      setCredenciales(res);
      setMsg("Maestro registrado.");
      setForm({ nombre: "", apellido: "", email: "", telefono: "", curp: "", titulo: "" });
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleBaja = async (id) => {
    if (!confirm("¿Dar de baja a este maestro?")) return;
    try {
      await adminApi.bajaMaestro(id);
      setMsg("Maestro dado de baja");
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="Alta de maestro">
        {err && <Alert type="error">{err}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        {credenciales && (
          <Alert type="info">
            Usuario: {credenciales.usuario} — Contraseña: {credenciales.password_generada}
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required />
          <Input label="Apellido" value={form.apellido} onChange={(v) => setForm({ ...form, apellido: v })} required />
          <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <Input label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
          <Input label="CURP" value={form.curp} onChange={(v) => setForm({ ...form, curp: v })} maxLength={18} required />
          <Input label="Título" value={form.titulo} onChange={(v) => setForm({ ...form, titulo: v })} />
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">
              Registrar maestro
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Maestros registrados">
        <Table
          headers={["Nombre", "Email", "Título", "Estado", "Acciones"]}
          rows={maestros.map((m) => [
            `${m.nombre_maestro} ${m.apellido_maestro}`,
            m.email,
            m.titulo || "—",
            m.activo ? "Activo" : "Baja",
            m.activo && (
              <button onClick={() => handleBaja(m.id_maestro)} className="btn-danger">
                Dar de baja
              </button>
            ),
          ])}
        />
      </Panel>
    </div>
  );
}
