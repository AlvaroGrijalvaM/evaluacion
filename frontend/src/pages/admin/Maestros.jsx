import { useEffect, useState } from "react";
import { adminApi } from "../../api/api";
import { Alert, Input, Panel, Table } from "./Estudiantes";

export default function AdminMaestros() {
  const [maestros, setMaestros] = useState([]);
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", telefono: "", curp: "", titulo: "" });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [credenciales, setCredenciales] = useState(null);

  const load = () => adminApi.maestros().then(setMaestros).catch((e) => setErr(e.message));

  useEffect(() => {
    load();
  }, []);

  function isValidEmail(email) {
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(email.trim());
  }

  function isValidPhone(phone) {
    if (!phone) return true; // optional
    const cleaned = phone.trim().replace(/[\s\-()]/g, "");
    if (cleaned.startsWith("+52")) {
      return /^\d{10}$/.test(cleaned.slice(3));
    }
    return /^\d{10}$/.test(cleaned);
  }

  function isValidCURP(curp) {
    return /^[A-Z]{4}[0-9]{6}[HM]{1}[A-Z]{5}[0-9A-Z]{1}[0-9]{1}$/.test(curp.trim().toUpperCase());
  }

  function isValidName(name) {
    const trimmed = name.trim();
    if (trimmed.length < 3) return false;
    if (trimmed.length > 100) return false;
    // Solo permitir: letras Unicode (cualquier idioma), números, espacios, . , - '
    if (!/^[\p{L}0-9\s.,\-']+$/u.test(trimmed)) return false;
    // Evitar repeticiones excesivas (spam tipo "aaaaaa...")
    if (/(.)\1{4,}/.test(trimmed)) return false;
    return true;
  }

  function validateForm() {
    const newErrors = {};
    if (!form.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    } else if (!isValidName(form.nombre)) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres y solo puede contener letras, números, espacios, puntos, comas, guiones y apóstrofes";
    }
    if (!form.apellido.trim()) {
      newErrors.apellido = "El apellido es requerido";
    } else if (!isValidName(form.apellido)) {
      newErrors.apellido = "El apellido debe tener al menos 3 caracteres y solo puede contener letras, números, espacios, puntos, comas, guiones y apóstrofes";
    }
    if (!form.email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!isValidEmail(form.email)) {
      newErrors.email = "El formato del correo electrónico no es válido";
    }
    if (form.telefono && !isValidPhone(form.telefono)) {
      newErrors.telefono = "El teléfono debe ser un número mexicano de 10 dígitos (ej. 6621234567)";
    }
    if (!form.curp.trim()) {
      newErrors.curp = "El CURP es requerido";
    } else if (!isValidCURP(form.curp)) {
      newErrors.curp = "El formato del CURP no es válido. Debe ser: 4 letras, 6 dígitos, H/M, 5 letras, 1 alfanumérico, 1 dígito";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setCredenciales(null);
    if (!validateForm()) return;
    try {
      const res = await adminApi.crearMaestro(form);
      setCredenciales(res);
      setMsg("Maestro registrado.");
      setForm({ nombre: "", apellido: "", email: "", telefono: "", curp: "", titulo: "" });
      setErrors({});
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

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
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
          <Input label="Nombre" value={form.nombre} onChange={(v) => handleChange("nombre", v)} required error={errors.nombre} />
          <Input label="Apellido" value={form.apellido} onChange={(v) => handleChange("apellido", v)} required error={errors.apellido} />
          <Input label="Email" type="email" value={form.email} onChange={(v) => handleChange("email", v)} required error={errors.email} />
          <Input label="Teléfono" value={form.telefono} onChange={(v) => handleChange("telefono", v)} error={errors.telefono} placeholder="6621234567" />
          <Input label="CURP" value={form.curp} onChange={(v) => handleChange("curp", v)} maxLength={18} required error={errors.curp} />
          <Input label="Título" value={form.titulo} onChange={(v) => handleChange("titulo", v)} />
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