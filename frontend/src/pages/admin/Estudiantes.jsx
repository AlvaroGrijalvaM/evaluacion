import { useEffect, useState } from "react";
import { adminApi } from "../../api/api";

export default function AdminEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    curp: "",
    fecha_nacimiento: "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [credenciales, setCredenciales] = useState(null);

  const load = () => adminApi.estudiantes().then(setEstudiantes).catch((e) => setErr(e.message));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setCredenciales(null);
    try {
      const res = await adminApi.crearEstudiante(form);
      setCredenciales(res);
      setMsg("Estudiante registrado. Guarde las credenciales generadas.");
      setForm({ nombre: "", apellido: "", email: "", telefono: "", curp: "", fecha_nacimiento: "" });
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleBaja = async (id) => {
    if (!confirm("¿Dar de baja a este estudiante?")) return;
    try {
      await adminApi.bajaEstudiante(id);
      setMsg("Estudiante dado de baja");
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="Alta de estudiante">
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
          <Input label="Fecha nacimiento" type="date" value={form.fecha_nacimiento} onChange={(v) => setForm({ ...form, fecha_nacimiento: v })} required />
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">Registrar estudiante</button>
          </div>
        </form>
      </Panel>

      <Panel title="Estudiantes registrados">
        <Table
          headers={["Matrícula", "Nombre", "Email", "Estado", "Acciones"]}
          rows={estudiantes.map((e) => [
            e.matricula,
            `${e.nombre_alumno} ${e.apellido_alumno}`,
            e.email,
            e.activo ? "Activo" : "Baja",
            e.activo && (
              <button onClick={() => handleBaja(e.id_alumno)} className="btn-danger text-sm">
                Dar de baja
              </button>
            ),
          ])}
        />
      </Panel>
    </div>
  );
}

export function Input({ label, value, onChange, type = "text", required, maxLength }) {
  return (
    <label className="block text-left">
      <span className="label-text">{label}</span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </label>
  );
}

export function Panel({ title, children }) {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      {children}
    </div>
  );
}

export function Alert({ type, children }) {
  const cls = type === "error" ? "alert-error" : type === "success" ? "alert-success" : "alert-info";
  return <div className={cls}>{children}</div>;
}

export function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="table-header">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="table-row">
              {row.map((cell, j) => (
                <td key={j} className="table-cell">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
