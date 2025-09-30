import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

// Pool de conexión global
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Función para obtener conexión del pool
const getPool = async () => {
  try {
    // Verifica la conexión
    const connection = await pool.getConnection();
    connection.release(); // liberar conexión inmediatamente
    console.log("✅ Pool de conexión MySQL listo");
    return pool;
  } catch (err) {
    console.error("❌ Error al crear pool MySQL:", err);
    throw err;
  }
};

export { pool, getPool };
