import { Router } from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { validateEmail } from "../middleware/validation.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña requeridos" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.tipo, u.email,
        COALESCE(a.nombre_alumno, m.nombre_maestro, 'Administrador') AS nombre,
        COALESCE(a.apellido_alumno, m.apellido_maestro, '') AS apellido,
        a.id_alumno, m.id_maestro
       FROM usuarios u
       LEFT JOIN alumnos a ON u.id_usuario = a.id_usuario
       LEFT JOIN maestros m ON u.id_usuario = m.id_usuario
       WHERE u.email = ? AND u.password_hash = SHA2(?, 256) AND u.activo = TRUE`,
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = rows[0];
    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        tipo: user.tipo,
        email: user.email,
        id_alumno: user.id_alumno,
        id_maestro: user.id_maestro,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        tipo: user.tipo,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        id_alumno: user.id_alumno,
        id_maestro: user.id_maestro,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.tipo, u.email,
        COALESCE(a.nombre_alumno, m.nombre_maestro, 'Administrador') AS nombre,
        COALESCE(a.apellido_alumno, m.apellido_maestro, '') AS apellido,
        a.id_alumno, m.id_maestro
       FROM usuarios u
       LEFT JOIN alumnos a ON u.id_usuario = a.id_usuario
       LEFT JOIN maestros m ON u.id_usuario = m.id_usuario
       WHERE u.id_usuario = ?`,
      [req.user.id_usuario]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
});

router.post("/cambiar-password", validateEmail(), async (req, res) => {
  const { email, password_actual, password_nueva, confirmar_password } = req.body;
  if (!password_actual || !password_nueva || !confirmar_password) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }
  if (password_nueva !== confirmar_password) {
    return res.status(400).json({ error: "Las contraseñas nuevas no coinciden" });
  }
  if (password_nueva.length < 8) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
  }

  try {
    const [rows] = await pool.query(
      `CALL actualizar_password(?, ?, ?)`,
      [email, password_actual, password_nueva]
    );
    res.json(rows[0][0]);
  } catch (err) {
    console.error(err);
    if (err.errno === 1644) {
      return res.status(400).json({ error: err.sqlMessage });
    }
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
});

export default router;
