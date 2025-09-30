import { getPool } from "../config/db.js";
export const getBecarios = async (req, res) => {
  try {
    const pool = await getPool();
    const { nombre } = req.query;
    let rows;

    if (nombre) {
      console.log(`Consulta becarios con filtro nombre LIKE '%${nombre}%'`);
      [rows] = await pool.execute(
        `SELECT id_becario, nombre, telefono, matricula, cuatrimestre, tipo_servicio,
                fecha_registro, fecha_aceptacion, fecha_estimada_termino, fecha_liberacion
         FROM becarios
         WHERE nombre LIKE ?
         LIMIT 1000`,
        [`%${nombre}%`]
      );
    } else {
      console.log("Consulta todos los becarios");
      [rows] = await pool.execute(
        `SELECT id_becario, nombre,  telefono, 
                 cuatrimestre, tipo_servicio,matricula,
                fecha_registro, fecha_aceptacion, fecha_estimada_termino, fecha_liberacion
         FROM becarios
         LIMIT 1000`
      );
    }
    console.log(
      `Consulta realizada correctamente. Registros obtenidos: ${rows.length}`
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error en getBecarios:", err);
    res.status(500).json({ error: err.message });
  }
};
