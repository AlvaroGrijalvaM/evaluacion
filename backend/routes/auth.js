import { Router } from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { authenticate } from "../middleware/auth.js";

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

export default router;
