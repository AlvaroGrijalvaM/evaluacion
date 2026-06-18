import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/api";
import { Panel, Alert } from "./admin/Estudiantes";

export default function CambiarPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password_actual: "",
    password_nueva: "",
    confirmar_password: "",
  });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function isValidEmail(email) {
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(email.trim());
  }

  function validateForm() {
    const newErrors = {};
    if (!form.email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!isValidEmail(form.email)) {
      newErrors.email = "El formato del correo electrónico no es válido";
    }
    if (!form.password_actual) {
      newErrors.password_actual = "La contraseña actual es requerida";
    }
    if (!form.password_nueva) {
      newErrors.password_nueva = "La nueva contraseña es requerida";
    } else if (form.password_nueva.length < 8) {
      newErrors.password_nueva = "La nueva contraseña debe tener al menos 8 caracteres";
    }
    if (!form.confirmar_password) {
      newErrors.confirmar_password = "Confirma la nueva contraseña";
    } else if (form.password_nueva !== form.confirmar_password) {
      newErrors.confirmar_password = "Las contraseñas no coinciden";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!validateForm()) return;
    try {
      const res = await authApi.cambiarPassword(form);
      setMsg(res.mensaje || "Contraseña actualizada correctamente");
      setForm({ email: "", password_actual: "", password_nueva: "", confirmar_password: "" });
      setErrors({});
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
    <div className="max-w-md mx-auto space-y-6">
      <Panel title="Cambiar contraseña">
        {err && <Alert type="error">{err}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(v) => handleChange("email", v)}
            required
            error={errors.email}
          />
          <Input
            label="Contraseña actual"
            type="password"
            value={form.password_actual}
            onChange={(v) => handleChange("password_actual", v)}
            required
            error={errors.password_actual}
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={form.password_nueva}
            onChange={(v) => handleChange("password_nueva", v)}
            required
            error={errors.password_nueva}
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={form.confirmar_password}
            onChange={(v) => handleChange("confirmar_password", v)}
            required
            error={errors.confirmar_password}
          />
          <button type="submit" className="btn-primary w-full">
            Cambiar contraseña
          </button>
        </form>
      </Panel>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, error }) {
  return (
    <label className="block text-left">
      <span className="label-text">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${error ? "border-red-500" : ""}`}
      />
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
    </label>
  );
}