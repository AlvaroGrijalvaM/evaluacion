import { Router } from "express";
import PDFDocument from "pdfkit";
import pool from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, authorize("ALUMNO"));

router.get("/calificaciones", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM vw_boleta_alumno WHERE id_alumno = ?`,
      [req.user.id_alumno]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener calificaciones" });
  }
});

router.get("/grupo", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT dg.* FROM inscripciones i
       INNER JOIN vw_detalle_grupo dg ON i.id_grupo = dg.id_grupo
       WHERE i.id_alumno = ? AND i.estado = 'ACTIVO'
       LIMIT 1`,
      [req.user.id_alumno]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener grupo" });
  }
});

router.get("/credencial/pdf", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM vw_credencial_alumno WHERE id_alumno = ?`,
      [req.user.id_alumno]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No hay inscripción activa" });
    }

    const cred = rows[0];
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=credencial_${cred.matricula}.pdf`
    );

    const doc = new PDFDocument({ size: [400, 250], margin: 20 });
    doc.pipe(res);

    doc.rect(0, 0, 400, 250).stroke("#2E4053");
    doc.fontSize(16).fillColor("#2E4053").text("CREDENCIAL DIGITAL", 20, 20, { align: "center" });
    doc.fontSize(10).fillColor("#555").text("Preparatoria Escolar", 20, 45, { align: "center" });

    doc.moveDown(2);
    doc.fontSize(12).fillColor("#000");
    doc.text(`Matrícula: ${cred.matricula}`, 30, 80);
    doc.text(`Nombre: ${cred.nombre_completo}`, 30, 100);
    doc.text(`Grupo: ${cred.grado}° ${cred.numero_grupo}`, 30, 120);
    doc.text(`Capacitación: ${cred.nombre_capacitacion}`, 30, 140);
    doc.text(`Vigencia: ${new Date(cred.vigencia).toLocaleDateString("es-MX")}`, 30, 160);

    doc.fontSize(8).fillColor("#888").text("Documento generado electrónicamente", 20, 210, { align: "center" });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error al generar credencial" });
    }
  }
});

export default router;
