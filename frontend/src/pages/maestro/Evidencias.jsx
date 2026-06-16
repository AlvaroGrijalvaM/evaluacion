import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { maestroApi } from "../../api/api";
import { Alert, Panel } from "../admin/Estudiantes";
import AuthImage from "../../components/AuthImage";

export default function MaestroEvidencias() {
  const { claseId } = useParams();
  const [parciales, setParciales] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [id_parcial, setIdParcial] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const [p, e] = await Promise.all([
        maestroApi.parciales(claseId),
        maestroApi.evidencias(claseId),
      ]);
      setParciales(p);
      setEvidencias(e);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [claseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivo || !id_parcial) return;
    setErr("");
    setMsg("");
    const formData = new FormData();
    formData.append("id_clase", claseId);
    formData.append("id_parcial", id_parcial);
    formData.append("imagen", archivo);
    try {
      await maestroApi.subirEvidencia(formData);
      setMsg("Evidencia subida correctamente");
      setArchivo(null);
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {err && <Alert type="error">{err}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      <Panel title="Subir evidencia de clase">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-left">
            <span className="text-sm text-gray-600">Parcial</span>
            <select
              value={id_parcial}
              onChange={(e) => setIdParcial(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              required>
              <option value="">Seleccionar parcial</option>
              {parciales.map((p) => (
                <option key={p.id_parcial} value={p.id_parcial}>
                  Parcial {p.numero_parcial}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-left">
            <span className="text-sm text-gray-600">Imagen</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setArchivo(e.target.files[0])}
              className="mt-1 w-full border rounded px-3 py-2"
              required
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">
              Subir evidencia
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Evidencias registradas">
        {evidencias.length === 0 ? (
          <p className="text-gray-500">No hay evidencias subidas.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {evidencias.map((ev) => (
              <div key={ev.id_evidencia} className="border rounded p-3 text-left">
                <p className="text-sm font-medium">Parcial {ev.numero_parcial}</p>
                <p className="text-xs text-gray-500 truncate">{ev.nombre_archivo}</p>
                <AuthImage
                  src={maestroApi.imagenEvidencia(ev.id_evidencia)}
                  alt={ev.nombre_archivo}
                  className="mt-2 w-full h-32 object-cover rounded"
                />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
