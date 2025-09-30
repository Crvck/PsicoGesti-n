import { getPool } from "../config/db.js";

export const getPsicologos = async (req, res) => {
  try {
    const pool = await getPool();
    const { nombre } = req.query;
    let rows;

    if (nombre) {
      console.log(
        `Consultar psicólogos disponibles con filtro nombre LIKE '%${nombre}%'`
      );
      [rows] = await pool.execute(
        `SELECT id_psicologo, nombre, telefono, especialidad, id_administrador, observaciones
         FROM consultorio_pscologia.psicologos
         WHERE nombre LIKE ?
         ORDER BY nombre
         LIMIT 1000`,
        [`%${nombre}%`]
      );
    } else {
      console.log("Consulta todos los psicólogos disponibles");
      [rows] = await pool.execute(
        `SELECT id_psicologo, nombre, telefono, especialidad, id_administrador, observaciones
         FROM consultorio_pscologia.psicologos
         ORDER BY nombre
         LIMIT 1000`
      );
    }

    console.log(
      `Consulta realizada correctamente. Registros obtenidos: ${rows.length}`
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error en getPrestadoresFora:", err);
    res.status(500).json({ error: err.message });
  }
};
