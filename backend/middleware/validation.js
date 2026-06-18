/* Valida un correo electrónico con formato real */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/* Valida un teléfono mexicano */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.trim().replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+52")) {
    const digits = cleaned.slice(3);
    return /^\d{10}$/.test(digits);
  }
  return /^\d{10}$/.test(cleaned);
}

/* Valida CURP mexicano: 4 letras + 6 dígitos + H/M + 5 letras + 1 alfanumérico + 1 dígito */
export function isValidCURP(curp) {
  if (!curp || typeof curp !== "string") return false;
  const re = /^[A-Z]{4}[0-9]{6}[HM]{1}[A-Z]{5}[0-9A-Z]{1}[0-9]{1}$/;
  return re.test(curp.trim().toUpperCase());
}

/* Valida fecha de nacimiento: debe ser una fecha real y la persona debe tener al menos 15 años */
export function isValidBirthDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;

  const parts = dateStr.split("-");
  if (parts.length !== 3) return false;
  const [y, m, d] = parts.map(Number);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;

  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) return false;

  const hoy = new Date();
  let edad = hoy.getFullYear() - y;
  const mesDiff = hoy.getMonth() + 1 - m;
  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < d)) {
    edad--;
  }
  return edad >= 15;
}

/* Valida nombre o apellido: mínimo 3 caracteres, solo letras (cualquier idioma), números, espacios, puntos, comas, guiones y apóstrofes */
export function isValidName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;
  if (trimmed.length > 100) return false; // evitar spam con cadenas muy largas
  // Solo permitir: letras Unicode (cualquier idioma), números, espacios, . , - '
  const re = /^[\p{L}0-9\s.,\-']+$/u;
  if (!re.test(trimmed)) return false;
  // Evitar repeticiones excesivas (spam tipo "aaaaaa...")
  if (/(.)\1{4,}/.test(trimmed)) return false;
  return true;
}

/* Middleware para validar email */
export function validateEmail(field = "email") {
  return (req, res, next) => {
    const email = req.body[field];
    if (!email) {
      return res.status(400).json({ error: "El correo electrónico es requerido" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "El formato del correo electrónico no es válido" });
    }
    next();
  };
}

/* Middleware para validar teléfono */
export function validatePhone(field = "telefono") {
  return (req, res, next) => {
    const phone = req.body[field];
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ error: "El formato del teléfono no es válido. Debe ser un número mexicano de 10 dígitos" });
    }
    next();
  };
}

/* Middleware para validar CURP */
export function validateCURP(field = "curp") {
  return (req, res, next) => {
    const curp = req.body[field];
    if (!curp) {
      return res.status(400).json({ error: "El CURP es requerido" });
    }
    if (!isValidCURP(curp)) {
      return res.status(400).json({ error: "El formato del CURP no es válido. Debe tener el formato: AAAA######HAAAAAA#0 (4 letras, 6 dígitos, H/M, 5 letras, 1 alfanumérico, 1 dígito)" });
    }
    next();
  };
}

/* Middleware para validar fecha de nacimiento (mínimo 15 años) */
export function validateBirthDate(field = "fecha_nacimiento") {
  return (req, res, next) => {
    const dateStr = req.body[field];
    if (!dateStr) {
      return res.status(400).json({ error: "La fecha de nacimiento es requerida" });
    }
    if (!isValidBirthDate(dateStr)) {
      return res.status(400).json({ error: "La fecha de nacimiento no es válida. El estudiante/maestro debe tener al menos 15 años" });
    }
    next();
  };
}

/* Middleware para validar nombre o apellido */
export function validateName(field = "nombre") {
  return (req, res, next) => {
    const name = req.body[field];
    if (!name) {
      return res.status(400).json({ error: `El campo ${field} es requerido` });
    }
    if (!isValidName(name)) {
      return res.status(400).json({ error: `El ${field} debe tener al menos 3 caracteres y solo puede contener letras, números, espacios, puntos, comas, guiones y apóstrofes` });
    }
    next();
  };
}

/* Valida una contraseña (mínimo 8 caracteres, al menos una mayúscula y un número) */
export function isValidPassword(password) {
  if (!password || typeof password !== "string") return false;
  const re = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
}