import { Router } from "express";
import multer from "multer";
import pool from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate, authorize("MAESTRO"));

router.get("/clases", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id_clase, c.id_grupo, dg.nombre_grupo, a.nombre_asignatura,
              a.id_asignatura, g.grado
       FROM clases c
       INNER JOIN vw_detalle_grupo dg ON c.id_grupo = dg.id_grupo
       INNER JOIN asignaturas a ON c.id_asignatura = a.id_asignatura
       INNER JOIN grupos g ON c.id_grupo = g.id_grupo
       WHERE c.id_maestro = ?
       ORDER BY dg.nombre_grupo, a.nombre_asignatura`,
      [req.user.id_maestro]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar clases" });
  }
});

router.get("/clases/:id/parciales", async (req, res) => {
  try {
    const [clase] = await pool.query(
      `SELECT id_clase FROM clases WHERE id_clase = ? AND id_maestro = ?`,
      [req.params.id, req.user.id_maestro]
    );
    if (clase.length === 0) return res.status(404).json({ error: "Clase no encontrada" });

    const [rows] = await pool.query(
      `SELECT id_parcial, numero_parcial FROM parciales WHERE id_clase = ? ORDER BY numero_parcial`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar parciales" });
  }
});

router.get("/clases/:id/alumnos", async (req, res) => {
  try {
    const [clase] = await pool.query(
      `SELECT c.id_clase, c.id_grupo FROM clases c WHERE c.id_clase = ? AND c.id_maestro = ?`,
      [req.params.id, req.user.id_maestro]
    );
    if (clase.length === 0) return res.status(404).json({ error: "Clase no encontrada" });

    const [rows] = await pool.query(
      `SELECT a.id_alumno, a.matricula,
              CONCAT(a.nombre_alumno, ' ', a.apellido_alumno) AS nombre
       FROM inscripciones i
       INNER JOIN alumnos a ON i.id_alumno = a.id_alumno
       WHERE i.id_grupo = ? AND i.estado = 'ACTIVO'
       ORDER BY a.apellido_alumno`,
      [clase[0].id_grupo]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar alumnos" });
  }
});

router.get("/clases/:id/calificaciones", async (req, res) => {
  const { id_parcial } = req.query;
  try {
    const [clase] = await pool.query(
      `SELECT id_clase FROM clases WHERE id_clase = ? AND id_maestro = ?`,
      [req.params.id, req.user.id_maestro]
    );
    if (clase.length === 0) return res.status(404).json({ error: "Clase no encontrada" });

    let sql = `SELECT cal.id_calificacion, cal.id_alumno, cal.calificacion, cal.observaciones,
                      p.numero_parcial, p.id_parcial,
                      CONCAT(a.nombre_alumno, ' ', a.apellido_alumno) AS alumno
               FROM calificaciones cal
               INNER JOIN parciales p ON cal.id_parcial = p.id_parcial
               INNER JOIN alumnos a ON cal.id_alumno = a.id_alumno
               WHERE p.id_clase = ?`;
    const params = [req.params.id];
    if (id_parcial) {
      sql += ` AND p.id_parcial = ?`;
      params.push(id_parcial);
    }
    sql += ` ORDER BY p.numero_parcial, a.apellido_alumno`;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener calificaciones" });
  }
});

router.post("/calificaciones", async (req, res) => {
  const { id_parcial, id_alumno, calificacion, observaciones } = req.body;
  if (!id_parcial || !id_alumno || calificacion === undefined) {
    return res.status(400).json({ error: "Parcial, alumno y calificación requeridos" });
  }

  try {
    const [parcial] = await pool.query(
      `SELECT p.id_parcial FROM parciales p
       INNER JOIN clases c ON p.id_clase = c.id_clase
       WHERE p.id_parcial = ? AND c.id_maestro = ?`,
      [id_parcial, req.user.id_maestro]
    );
    if (parcial.length === 0) return res.status(403).json({ error: "No autorizado para este parcial" });

    await pool.query(
      `INSERT INTO calificaciones(id_parcial, id_alumno, calificacion, observaciones)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE calificacion = VALUES(calificacion), observaciones = VALUES(observaciones)`,
      [id_parcial, id_alumno, calificacion, observaciones || null]
    );
    res.json({ mensaje: "Calificación registrada" });
  } catch (err) {
    console.error(err);
    if (err.errno === 3819 || err.errno === 4025) {
      return res.status(400).json({ error: "Calificación debe estar entre 0 y 100" });
    }
    res.status(500).json({ error: "Error al registrar calificación" });
  }
});

router.get("/clases/:id/evidencias", async (req, res) => {
  try {
    const [clase] = await pool.query(
      `SELECT id_clase FROM clases WHERE id_clase = ? AND id_maestro = ?`,
      [req.params.id, req.user.id_maestro]
    );
    if (clase.length === 0) return res.status(404).json({ error: "Clase no encontrada" });

    const [rows] = await pool.query(
      `SELECT e.id_evidencia, e.nombre_archivo, e.fecha_subida, e.id_parcial, p.numero_parcial
       FROM evidencias e
       INNER JOIN parciales p ON e.id_parcial = p.id_parcial
       WHERE e.id_clase = ?
       ORDER BY e.fecha_subida DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar evidencias" });
  }
});

router.get("/evidencias/:id/imagen", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.imagen, e.nombre_archivo FROM evidencias e
       INNER JOIN clases c ON e.id_clase = c.id_clase
       WHERE e.id_evidencia = ? AND c.id_maestro = ?`,
      [req.params.id, req.user.id_maestro]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Evidencia no encontrada" });

    const ext = rows[0].nombre_archivo?.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg";
    res.setHeader("Content-Type", mime);
    res.send(rows[0].imagen);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener imagen" });
  }
});

router.post("/evidencias", upload.single("imagen"), async (req, res) => {
  const { id_clase, id_parcial } = req.body;
  if (!id_clase || !id_parcial || !req.file) {
    return res.status(400).json({ error: "Clase, parcial e imagen requeridos" });
  }

  try {
    const [clase] = await pool.query(
      `SELECT id_clase FROM clases WHERE id_clase = ? AND id_maestro = ?`,
      [id_clase, req.user.id_maestro]
    );
    if (clase.length === 0) return res.status(403).json({ error: "No autorizado" });

    await pool.query(
      `INSERT INTO evidencias(id_clase, id_parcial, nombre_archivo, imagen) VALUES (?, ?, ?, ?)`,
      [id_clase, id_parcial, req.file.originalname, req.file.buffer]
    );
    res.status(201).json({ mensaje: "Evidencia subida correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al subir evidencia" });
  }
});

export default router;
