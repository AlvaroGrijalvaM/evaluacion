import { Router } from "express";
import pool from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateEmail, validatePhone, validateCURP, validateBirthDate, validateName } from "../middleware/validation.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.get("/estudiantes", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id_alumno, a.nombre_alumno, a.apellido_alumno, a.matricula,
              a.curp, a.telefono, a.fecha_nacimiento, a.activo, u.email
       FROM alumnos a
       INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
       ORDER BY a.apellido_alumno, a.nombre_alumno`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar estudiantes" });
  }
});

router.post("/estudiantes", validateName("nombre"), validateName("apellido"), validateEmail(), validatePhone(), validateCURP(), validateBirthDate(), async (req, res) => {
  const { nombre, apellido, email, telefono, curp, fecha_nacimiento } = req.body;
  if (!nombre || !apellido || !email || !curp || !fecha_nacimiento) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  // Validar que el nombre completo (nombre + apellido) no esté duplicado en alumnos activos
  try {
    const [duplicates] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM alumnos
       WHERE LOWER(CONCAT(nombre_alumno, ' ', apellido_alumno)) = LOWER(CONCAT(?, ?))
         AND activo = TRUE`,
      [nombre.trim(), apellido.trim()]
    );
    if (duplicates[0].cnt > 0) {
      return res.status(409).json({ error: "Ya existe un estudiante con ese nombre y apellido" });
    }

    const [result] = await pool.query(
      `CALL crear_cuenta('ALUMNO', ?, ?, ?, ?, ?, ?, NULL)`,
      [nombre, apellido, email, telefono || null, fecha_nacimiento, curp]
    );
    res.status(201).json(result[0][0]);
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email, CURP o matrícula duplicados" });
    }
    res.status(500).json({ error: "Error al crear estudiante" });
  }
});

router.delete("/estudiantes/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario FROM alumnos WHERE id_alumno = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Estudiante no encontrado" });

    await pool.query(`UPDATE alumnos SET activo = FALSE WHERE id_alumno = ?`, [req.params.id]);
    await pool.query(`UPDATE usuarios SET activo = FALSE WHERE id_usuario = ?`, [rows[0].id_usuario]);
    res.json({ mensaje: "Estudiante dado de baja" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al dar de baja estudiante" });
  }
});

router.get("/maestros", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id_maestro, m.nombre_maestro, m.apellido_maestro, m.curp,
              m.telefono, m.titulo, m.activo, u.email
       FROM maestros m
       INNER JOIN usuarios u ON m.id_usuario = u.id_usuario
       ORDER BY m.apellido_maestro, m.nombre_maestro`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar maestros" });
  }
});

router.post("/maestros", validateName("nombre"), validateName("apellido"), validateEmail(), validatePhone(), validateCURP(), async (req, res) => {
  const { nombre, apellido, email, telefono, curp, titulo } = req.body;
  if (!nombre || !apellido || !email || !curp) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    // Validar que el nombre completo no esté duplicado en maestros activos
    const [duplicates] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM maestros
       WHERE LOWER(CONCAT(nombre_maestro, ' ', apellido_maestro)) = LOWER(CONCAT(?, ?))
         AND activo = TRUE`,
      [nombre.trim(), apellido.trim()]
    );
    if (duplicates[0].cnt > 0) {
      return res.status(409).json({ error: "Ya existe un maestro con ese nombre y apellido" });
    }

    const [result] = await pool.query(
      `CALL crear_cuenta('MAESTRO', ?, ?, ?, ?, '1980-01-01', ?, ?)`,
      [nombre, apellido, email, telefono || null, curp, titulo || null]
    );
    res.status(201).json(result[0][0]);
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email o CURP duplicados" });
    }
    res.status(500).json({ error: "Error al crear maestro" });
  }
});

router.delete("/maestros/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario FROM maestros WHERE id_maestro = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Maestro no encontrado" });

    await pool.query(`UPDATE maestros SET activo = FALSE WHERE id_maestro = ?`, [req.params.id]);
    await pool.query(`UPDATE usuarios SET activo = FALSE WHERE id_usuario = ?`, [rows[0].id_usuario]);
    res.json({ mensaje: "Maestro dado de baja" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al dar de baja maestro" });
  }
});

router.get("/grupos", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT dg.*, g.grado, g.numero_grupo, g.id_capacitacion, g.id_ciclo, g.id_maestro_tutor
       FROM vw_detalle_grupo dg
       INNER JOIN grupos g ON dg.id_grupo = g.id_grupo
       ORDER BY g.grado, g.numero_grupo`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar grupos" });
  }
});

router.get("/alumnos-sin-grupo", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id_alumno, a.nombre_alumno, a.apellido_alumno, a.matricula
       FROM alumnos a
       WHERE a.activo = TRUE
         AND a.id_alumno NOT IN (
           SELECT i.id_alumno FROM inscripciones i WHERE i.estado = 'ACTIVO'
         )
       ORDER BY a.apellido_alumno`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar alumnos disponibles" });
  }
});

router.get("/inscripciones", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.id_inscripcion, i.id_grupo, i.id_alumno, i.estado,
              CONCAT(a.nombre_alumno, ' ', a.apellido_alumno) AS alumno,
              a.matricula, dg.nombre_grupo
       FROM inscripciones i
       INNER JOIN alumnos a ON i.id_alumno = a.id_alumno
       INNER JOIN vw_detalle_grupo dg ON i.id_grupo = dg.id_grupo
       WHERE i.estado = 'ACTIVO'
       ORDER BY dg.nombre_grupo, a.apellido_alumno`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar inscripciones" });
  }
});

router.post("/inscripciones", async (req, res) => {
  const { id_grupo, id_alumno } = req.body;
  if (!id_grupo || !id_alumno) {
    return res.status(400).json({ error: "Grupo y alumno requeridos" });
  }

  try {
    await pool.query(
      `INSERT INTO inscripciones(id_grupo, id_alumno) VALUES (?, ?)`,
      [id_grupo, id_alumno]
    );
    res.status(201).json({ mensaje: "Alumno inscrito al grupo" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El alumno ya está inscrito en ese grupo" });
    }
    res.status(500).json({ error: "Error al inscribir alumno" });
  }
});

router.delete("/inscripciones/:id", async (req, res) => {
  try {
    await pool.query(
      `UPDATE inscripciones SET estado = 'INACTIVO', fecha_baja = CURDATE() WHERE id_inscripcion = ?`,
      [req.params.id]
    );
    res.json({ mensaje: "Inscripción cancelada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cancelar inscripción" });
  }
});

router.get("/clases", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id_clase, c.id_grupo, c.id_asignatura, c.id_maestro,
              dg.nombre_grupo, a.nombre_asignatura,
              CONCAT(m.nombre_maestro, ' ', m.apellido_maestro) AS maestro
       FROM clases c
       INNER JOIN vw_detalle_grupo dg ON c.id_grupo = dg.id_grupo
       INNER JOIN asignaturas a ON c.id_asignatura = a.id_asignatura
       INNER JOIN maestros m ON c.id_maestro = m.id_maestro
       ORDER BY dg.nombre_grupo, a.nombre_asignatura`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar clases" });
  }
});

router.get("/asignaturas", async (req, res) => {
  try {
    const { id_capacitacion, grado } = req.query;
    let sql = `SELECT id_asignatura, nombre_asignatura, grado, id_capacitacion FROM asignaturas WHERE 1=1`;
    const params = [];
    if (id_capacitacion) {
      sql += ` AND id_capacitacion = ?`;
      params.push(id_capacitacion);
    }
    if (grado) {
      sql += ` AND grado = ?`;
      params.push(grado);
    }
    sql += ` ORDER BY nombre_asignatura`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar asignaturas" });
  }
});

router.get("/maestros-activos", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_maestro, CONCAT(nombre_maestro, ' ', apellido_maestro) AS nombre
       FROM maestros WHERE activo = TRUE ORDER BY apellido_maestro`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar maestros" });
  }
});

router.post("/clases", async (req, res) => {
  const { id_grupo, id_asignatura, id_maestro } = req.body;
  if (!id_grupo || !id_asignatura || !id_maestro) {
    return res.status(400).json({ error: "Grupo, asignatura y maestro requeridos" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO clases(id_grupo, id_asignatura, id_maestro) VALUES (?, ?, ?)`,
      [id_grupo, id_asignatura, id_maestro]
    );
    const id_clase = result.insertId;
    for (let p = 1; p <= 3; p++) {
      await conn.query(
        `INSERT INTO parciales(id_clase, numero_parcial) VALUES (?, ?)`,
        [id_clase, p]
      );
    }
    await conn.commit();
    res.status(201).json({ id_clase, mensaje: "Clase asignada correctamente" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Ya existe esa asignatura en el grupo" });
    }
    if (err.errno === 1644) {
      return res.status(400).json({ error: err.sqlMessage });
    }
    res.status(500).json({ error: "Error al asignar clase" });
  } finally {
    conn.release();
  }
});

router.delete("/clases/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM clases WHERE id_clase = ?`, [req.params.id]);
    res.json({ mensaje: "Clase eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar clase" });
  }
});

router.get("/ciclos", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_ciclo, periodo, activo FROM ciclos_escolares ORDER BY fecha_inicio DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar ciclos" });
  }
});

router.get("/capacitaciones", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_capacitacion, nombre_capacitacion, ambito FROM capacitaciones ORDER BY nombre_capacitacion`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar capacitaciones" });
  }
});

router.post("/grupos", async (req, res) => {
  const { grado, numero_grupo, id_capacitacion, id_ciclo, id_maestro_tutor } = req.body;
  if (!grado || !numero_grupo || !id_capacitacion || !id_ciclo || !id_maestro_tutor) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO grupos(grado, numero_grupo, id_capacitacion, id_ciclo, id_maestro_tutor)
       VALUES (?, ?, ?, ?, ?)`,
      [grado, numero_grupo, id_capacitacion, id_ciclo, id_maestro_tutor]
    );
    res.status(201).json({ id_grupo: result.insertId, mensaje: "Grupo creado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear grupo" });
  }
});

router.post("/grupos/promover", async (req, res) => {
  const { id_grupo_actual, id_grupo_nuevo } = req.body;
  if (!id_grupo_actual || !id_grupo_nuevo) {
    return res.status(400).json({ error: "Grupo actual y nuevo requeridos" });
  }

  try {
    await pool.query(`CALL promover_grupo(?, ?)`, [id_grupo_actual, id_grupo_nuevo]);
    res.json({ mensaje: "Grupo promovido al siguiente grado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al promover grupo" });
  }
});

export default router;
