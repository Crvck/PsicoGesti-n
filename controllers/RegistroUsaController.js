import { pool, getPool } from "../config/db.js";
import bcrypt from "bcryptjs";

// Registrar un nuevo usuario
export const registerUser = async (req, res) => {
  try {
    const pool = await getPool();
    const { usuario, correo, contrasena, rol, id_referencia } = req.body;

    // Validar que usuario o correo no existan
    const [existing] = await pool.execute(
      "SELECT * FROM usuarios WHERE usuario = ? OR correo = ?",
      [usuario, correo]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Usuario o correo ya existe" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar usuario
    await pool.execute(
      `INSERT INTO usuarios (usuario, correo, contrasena, rol, id_referencia, fecha_registro)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [usuario, correo, hashedPassword, rol, id_referencia]
    );

    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (err) {
    console.error("Error en registerUser:", err);
    res.status(500).json({ error: err.message });
  }
};

// Login de usuario
export const loginUser = async (req, res) => {
  try {
    const pool = await getPool();
    const { usuario, contrasena } = req.body;

    const [rows] = await pool.execute(
      "SELECT * FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    }

    const user = rows[0];

    // Comparar contraseña
    const isMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (!isMatch) {
      return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    }

    // Generar token JWT si lo usas (opcional)
    // const token = jwt.sign({ id: user.id_usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: "Login exitoso",
      user: {
        id_usuario: user.id_usuario,
        usuario: user.usuario,
        correo: user.correo,
        rol: user.rol,
        id_referencia: user.id_referencia,
      },
      // token
    });
  } catch (err) {
    console.error("Error en loginUser:", err);
    res.status(500).json({ error: err.message });
  }
};

// Obtener todos los usuarios
export const getUsers = async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      "SELECT id_usuario, usuario, correo, rol, id_referencia, fecha_registro FROM usuarios LIMIT 1000"
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error en getUsers:", err);
    res.status(500).json({ error: err.message });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    const [rows] = await pool.execute(
      "SELECT id_usuario, usuario, correo, rol, id_referencia, fecha_registro FROM usuarios WHERE id_usuario = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error en getUserById:", err);
    res.status(500).json({ error: err.message });
  }
};
