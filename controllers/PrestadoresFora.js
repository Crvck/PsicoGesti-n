import { getPool } from "../config/db.js";
export const getPrestadoresFora = async (req, res) => {
  try {
    const pool = await getPool();
    const { nombre } = req.query;
    let rows;
    if (nombre) {
      console.log(
        `Consulta prestadores foráneos con filtro nombre LIKE '%${nombre}%'`
      );
      [rows] = await pool.execute(
        `SELECT id_prestador, nombre, telefono, fundacion, 
                  fecha_registro, fecha_estimada_termino, fecha_liberacion ,horas_objetivo,observaciones
              FROM prestadores_foraneos
              WHERE nombre LIKE ?
              LIMIT 1000`,
        [`%${nombre}%`]
      );
    } else {
      console.log("Consulta todos los prestadores foráneos");
      [rows] = await pool.execute(
        `SELECT id_prestador, nombre, telefono, fundacion, 
                  fecha_registro, fecha_estimada_termino, fecha_liberacion ,horas_objetivo,observaciones  
              FROM prestadores_foraneos
              LIMIT 1000`
      );
    }
    console.log(
      "Consulta realizada correctamente. Registros obtenidos: ${rows.length}"
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error en getPrestadoresFora:", err);
    res.status(500).json({ error: err.message });
  }
};
