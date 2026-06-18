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

    // ── layout constants ──────────────────────────────────────────
    const W = 400, H = 250, MARGIN = 16;
    const doc = new PDFDocument({ size: [W, H], margin: MARGIN });
    doc.pipe(res);

    // ── color palette ─────────────────────────────────────────────
    const NAVY     = "#1B2A4A";
    const GOLD     = "#C9A84C";
    const WHITE    = "#FFFFFF";
    const LIGHT_BG = "#F4F6FA";
    const DARK     = "#2D3748";
    const GRAY     = "#718096";

    // ── full background ───────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(LIGHT_BG);

    // ── top accent bar ────────────────────────────────────────────
    doc.rect(0, 0, W, 56).fill(NAVY);

    // ── subtle diagonal line in header ────────────────────────────
    doc.rect(0, 52, W, 4).fill(GOLD);

    // ── school name ───────────────────────────────────────────────
    doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE)
       .text("PREPARATORIA",        MARGIN, 10, { align: "left", width: 200 });
    doc.font("Helvetica").fontSize(10).fillColor(WHITE)
       .text("Sistema de Evaluación", MARGIN, 32, { align: "left", width: 200 });

    // ── "CREDENCIAL DIGITAL" badge ────────────────────────────────
    doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE)
       .text("CREDENCIAL DIGITAL", 0, 14, { align: "right", width: W - MARGIN });

    // ── white card body ───────────────────────────────────────────
    const CARD_X = MARGIN, CARD_Y = 68, CARD_W = W - 2 * MARGIN, CARD_H = 140;
    doc.roundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, 6).fill(WHITE);
    doc.roundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, 6).lineWidth(1).stroke("#E2E8F0");

    // ── helper: field label + value ───────────────────────────────
    function field(label, value, y) {
      doc.font("Helvetica-Bold").fontSize(7).fillColor(GRAY)
         .text(label.toUpperCase(), CARD_X + 20, y, { continued: false });
      doc.font("Helvetica").fontSize(11).fillColor(DARK)
         .text(value, CARD_X + 20, y + 10, { continued: false });
    }

    field("Matrícula", cred.matricula, CARD_Y + 14);
    field("Nombre",    cred.nombre_completo, CARD_Y + 48);
    field("Grupo",     `${cred.grado}° ${cred.numero_grupo}`, CARD_Y + 82);

    // ── right column: capacitación & vigencia ─────────────────────
    const col2X = CARD_X + 180;
    doc.font("Helvetica-Bold").fontSize(7).fillColor(GRAY)
       .text("CAPACITACIÓN".toUpperCase(), col2X, CARD_Y + 14);
    doc.font("Helvetica").fontSize(11).fillColor(DARK)
       .text(cred.nombre_capacitacion, col2X, CARD_Y + 24, { width: 170 });

    doc.font("Helvetica-Bold").fontSize(7).fillColor(GRAY)
       .text("VIGENCIA".toUpperCase(), col2X, CARD_Y + 60);
    doc.font("Helvetica").fontSize(12).fillColor(NAVY)
       .text(new Date(cred.vigencia).toLocaleDateString("es-MX"), col2X, CARD_Y + 70);

    // ── subtle separator line inside card ─────────────────────────
    const sepY = CARD_Y + 118;
    doc.moveTo(CARD_X + 20, sepY).lineTo(CARD_X + CARD_W - 20, sepY).lineWidth(0.5).stroke("#E2E8F0");

    // ── QR-style decorative box ───────────────────────────────────
    const qrX = CARD_X + CARD_W - 52, qrY = CARD_Y + 8;
    doc.roundedRect(qrX, qrY, 40, 40, 4).fill(NAVY);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(WHITE)
       .text("ID", qrX, qrY + 6, { align: "center", width: 40 });
    doc.font("Helvetica").fontSize(6).fillColor(GOLD)
       .text(cred.matricula.slice(-6), qrX, qrY + 24, { align: "center", width: 40 });

    // ── "C-1234" code at bottom-right of card ─────────────────────
    doc.font("Helvetica-Bold").fontSize(7).fillColor(GRAY)
       .text(`C-${cred.matricula.slice(-4)}`, CARD_X + CARD_W - 48, sepY + 8, { align: "right" });

    // ── generated notice ──────────────────────────────────────────
    doc.font("Helvetica-Oblique").fontSize(7).fillColor(GRAY)
       .text("Documento generado electrónicamente · Validez oficial",
             MARGIN, H - 22, { align: "center", width: W - 2 * MARGIN });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error al generar credencial" });
    }
  }
});

export default router;
