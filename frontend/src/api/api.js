const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function apiFetch(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/pdf") || contentType.includes("image/")) {
    if (!res.ok) throw new Error("Error en la solicitud");
    return res;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error en la solicitud");
  return data;
}

export const authApi = {
  login: (email, password) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => apiFetch("/auth/me"),
};

export const adminApi = {
  estudiantes: () => apiFetch("/admin/estudiantes"),
  crearEstudiante: (data) =>
    apiFetch("/admin/estudiantes", { method: "POST", body: JSON.stringify(data) }),
  bajaEstudiante: (id) => apiFetch(`/admin/estudiantes/${id}`, { method: "DELETE" }),
  maestros: () => apiFetch("/admin/maestros"),
  crearMaestro: (data) =>
    apiFetch("/admin/maestros", { method: "POST", body: JSON.stringify(data) }),
  bajaMaestro: (id) => apiFetch(`/admin/maestros/${id}`, { method: "DELETE" }),
  grupos: () => apiFetch("/admin/grupos"),
  alumnosSinGrupo: () => apiFetch("/admin/alumnos-sin-grupo"),
  inscripciones: () => apiFetch("/admin/inscripciones"),
  inscribir: (data) =>
    apiFetch("/admin/inscripciones", { method: "POST", body: JSON.stringify(data) }),
  bajaInscripcion: (id) => apiFetch(`/admin/inscripciones/${id}`, { method: "DELETE" }),
  clases: () => apiFetch("/admin/clases"),
  asignaturas: (params) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/admin/asignaturas${q ? `?${q}` : ""}`);
  },
  maestrosActivos: () => apiFetch("/admin/maestros-activos"),
  crearClase: (data) =>
    apiFetch("/admin/clases", { method: "POST", body: JSON.stringify(data) }),
  eliminarClase: (id) => apiFetch(`/admin/clases/${id}`, { method: "DELETE" }),
  ciclos: () => apiFetch("/admin/ciclos"),
  capacitaciones: () => apiFetch("/admin/capacitaciones"),
  crearGrupo: (data) =>
    apiFetch("/admin/grupos", { method: "POST", body: JSON.stringify(data) }),
  promoverGrupo: (data) =>
    apiFetch("/admin/grupos/promover", { method: "POST", body: JSON.stringify(data) }),
};

export const alumnoApi = {
  calificaciones: () => apiFetch("/alumno/calificaciones"),
  grupo: () => apiFetch("/alumno/grupo"),
  descargarCredencial: async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/alumno/credencial/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al descargar");
    }
    return res.blob();
  },
};

export const maestroApi = {
  clases: () => apiFetch("/maestro/clases"),
  parciales: (claseId) => apiFetch(`/maestro/clases/${claseId}/parciales`),
  alumnos: (claseId) => apiFetch(`/maestro/clases/${claseId}/alumnos`),
  calificaciones: (claseId, idParcial) => {
    const q = idParcial ? `?id_parcial=${idParcial}` : "";
    return apiFetch(`/maestro/clases/${claseId}/calificaciones${q}`);
  },
  registrarCalificacion: (data) =>
    apiFetch("/maestro/calificaciones", { method: "POST", body: JSON.stringify(data) }),
  evidencias: (claseId) => apiFetch(`/maestro/clases/${claseId}/evidencias`),
  subirEvidencia: (formData) =>
    apiFetch("/maestro/evidencias", { method: "POST", body: formData }),
  imagenEvidencia: (id) => `/api/maestro/evidencias/${id}/imagen`,
};
