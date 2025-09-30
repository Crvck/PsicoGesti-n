import { getPool } from "../config/db.js";

// Obtener todos los pacientes o filtrar por nombre
export const getpacientes = async (req, res) => {
  try {
    const pool = await getPool();
    const { nombre } = req.query;
    let rows;

    if (nombre) {
      console.log(`Consulta pacientes con filtro nombre LIKE '%${nombre}%'`);
      [rows] = await pool.execute(
        `SELECT id_paciente, nombre, edad, sexo, telefono, correo,
                motivo_consulta, carrera, es_estudiante, es_foraneo, observaciones
         FROM pacientes
         WHERE nombre LIKE ?
         LIMIT 1000`,
        [`%${nombre}%`]
      );
    } else {
      console.log("Consulta todos los pacientes");
      [rows] = await pool.execute(
        `SELECT id_paciente, nombre, edad, sexo, telefono, correo,
                motivo_consulta, carrera, es_estudiante, es_foraneo, observaciones
         FROM pacientes
         LIMIT 1000`
      );
    }

    console.log(`Consulta realizada correctamente. Registros obtenidos: ${rows.length}`);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error en getpacientes:", err);
    res.status(500).json({ error: err.message });
  }
};

// Obtener un paciente por ID
export const getpacientesById = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`Consulta paciente por ID: ${id}`);

    const [rows] = await pool.execute(
      `SELECT id_paciente, nombre, edad, sexo, telefono, correo,
              motivo_consulta, carrera, es_estudiante, es_foraneo, observaciones
       FROM pacientes
       WHERE id_paciente = ?`,
      [id]
    );

    if (rows.length > 0) {
      console.log(`Consulta por ID realizada. Paciente encontrado: ${rows[0].nombre}`);
      res.status(200).json(rows[0]);
    } else {
      console.log("Paciente no encontrado en consulta por ID");
      res.status(404).json({ message: "Paciente no encontrado" });
    }
  } catch (err) {
    console.error("Error en getpacientesById:", err);
    res.status(500).json({ error: err.message });
  }
};
