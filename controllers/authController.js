import { getPool } from "../config/db.js";
import bcrypt from "bcryptjs";

// 🔐 Login con comparación de contraseña hasheada
export const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    console.log("📥 Solicitud de login recibida");

    if (!correo || !contrasena) {
      console.warn("⚠️ Correo o contraseña no proporcionados");
      return res.status(400).json({ message: "Correo y contraseña son requeridos" });
    }

    // ✅ Usamos el pool global
    const pool = await getPool();
    console.log("✅ Conexión al pool de la base de datos establecida");

    const [rows] = await pool.execute(
      `SELECT * FROM usuarios WHERE correo = ?`,
      [correo.toLowerCase()]
    );

    const user = rows[0];

    if (!user) {
      console.warn("❌ Usuario no encontrado para el correo proporcionado");
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    console.log("🔑 Verificando contraseña...");

    const passwordIsValid = await bcrypt.compare(contrasena, user.contrasena);

    if (!passwordIsValid) {
      console.warn("❌ Contraseña inválida");
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    console.log("✅ Usuario autenticado correctamente");

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id_usuario,
        usuario: user.usuario,
        correo: user.correo,
        rol: user.rol,
        id_referencia: user.id_referencia,
      },
    });

  } catch (err) {
    console.error("❗ Error interno al iniciar sesión:", err.message);
    res.status(500).json({ message: "Error del servidor al iniciar sesión" });
  }
};
