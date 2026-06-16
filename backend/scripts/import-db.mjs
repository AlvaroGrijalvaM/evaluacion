import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, "../../Preparatoria.sql");

function splitStatements(sql) {
  return sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .map((s) => s.replace(/^(?:--[^\n]*\n)+/, "").trim())
    .filter((s) => s && !/^--/.test(s));
}

function extractRoutineBlocks(content) {
  const blocks = [];
  const regex = /DELIMITER \$\$\s*\n([\s\S]*?)DELIMITER\s*;/g;
  const cleaned = content.replace(regex, (_, body) => {
    blocks.push(body.replace(/\$\$/g, "").trim());
    return "";
  });
  return { cleaned, blocks };
}

async function main() {
  const content = fs.readFileSync(sqlPath, "utf8").replace(/\r\n/g, "\n");
  const { cleaned, blocks } = extractRoutineBlocks(content);
  const vistaIdx = cleaned.indexOf("-- VISTA ASIGNATURAS");
  const schemaPart = vistaIdx >= 0 ? cleaned.slice(0, vistaIdx) : cleaned;
  const dataPart = vistaIdx >= 0 ? cleaned.slice(vistaIdx) : "";
  const schema = splitStatements(schemaPart);
  const data = splitStatements(dataPart);
  const all = [...schema, ...blocks, ...data];

  console.log(`Ejecutando ${all.length} sentencias (${blocks.length} rutinas)...`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  for (let i = 0; i < all.length; i++) {
    try {
      await conn.query(all[i]);
    } catch (err) {
      console.error(`Error en sentencia ${i + 1}:`, err.message);
      console.error(all[i].slice(0, 120).replace(/\n/g, " ") + "...");
      throw err;
    }
  }

  const [users] = await conn.query("SELECT COUNT(*) AS n FROM preparatoria.usuarios");
  console.log(`Importación completa. Usuarios: ${users[0].n}`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
