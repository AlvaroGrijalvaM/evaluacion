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
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [credenciales, setCredenciales] = useState(null);

  const load = () => adminApi.estudiantes().then(setEstudiantes).catch((e) => setErr(e.message));

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

  function isValidBirthDate(dateStr) {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) return false;
    const hoy = new Date();
    let edad = hoy.getFullYear() - y;
    const mesDiff = hoy.getMonth() + 1 - m;
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < d)) edad--;
    return edad >= 15;
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
    if (!form.fecha_nacimiento) {
      newErrors.fecha_nacimiento = "La fecha de nacimiento es requerida";
    } else if (!isValidBirthDate(form.fecha_nacimiento)) {
      newErrors.fecha_nacimiento = "La fecha no es válida. El estudiante debe tener al menos 15 años";
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
      const res = await adminApi.crearEstudiante(form);
      setCredenciales(res);
      setMsg("Estudiante registrado. Guarde las credenciales generadas.");
      setForm({ nombre: "", apellido: "", email: "", telefono: "", curp: "", fecha_nacimiento: "" });
      setErrors({});
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

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    // Clear error on change
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
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
          <Input label="Nombre" value={form.nombre} onChange={(v) => handleChange("nombre", v)} required error={errors.nombre} />
          <Input label="Apellido" value={form.apellido} onChange={(v) => handleChange("apellido", v)} required error={errors.apellido} />
          <Input label="Email" type="email" value={form.email} onChange={(v) => handleChange("email", v)} required error={errors.email} />
          <Input label="Teléfono" value={form.telefono} onChange={(v) => handleChange("telefono", v)} error={errors.telefono} placeholder="6621234567" />
          <Input label="CURP" value={form.curp} onChange={(v) => handleChange("curp", v)} maxLength={18} required error={errors.curp} />
          <Input label="Fecha nacimiento" type="date" value={form.fecha_nacimiento} onChange={(v) => handleChange("fecha_nacimiento", v)} required error={errors.fecha_nacimiento} />
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

export function Input({ label, value, onChange, type = "text", required, maxLength, error, placeholder }) {
  return (
    <label className="block text-left">
      <span className="label-text">{label}</span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${error ? "border-red-500" : ""}`}
      />
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
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