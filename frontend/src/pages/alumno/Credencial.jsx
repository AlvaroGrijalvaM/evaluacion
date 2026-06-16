import { useState } from "react";
import { alumnoApi } from "../../api/api";
import { Alert, Panel } from "../admin/Estudiantes";

export default function AlumnoCredencial() {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setErr("");
    setLoading(true);
    try {
      const blob = await alumnoApi.descargarCredencial();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "credencial_digital.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel title="Credencial digital">
      {err && <Alert type="error">{err}</Alert>}
      <p className="text-gray-600 mb-6">
        Descargue su credencial escolar en formato PDF con matrícula, nombre, grupo, capacitación y vigencia.
      </p>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="btn-primary px-6 py-3">
        {loading ? "Generando PDF..." : "Descargar credencial PDF"}
      </button>
    </Panel>
  );
}
