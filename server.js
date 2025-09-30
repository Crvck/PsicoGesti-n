require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const { authenticateToken } = require("./Middleware/auth.js");
const authRoutes = require("./routes/auth.js");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true })); // Habilitar CORS

app.use("/auth", authRoutes);

app.get("/tablero", authenticateToken, (req, res) => {
  res.json({ message: "Datos protegidos", user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `Servidor corriendo en el puerto ${PORT} a las ${new Date().toLocaleTimeString(
      "es-ES",
      { timeZone: "America/Los_Angeles" }
    )} PDT el ${new Date().toLocaleDateString("es-ES", {
      timeZone: "America/Los_Angeles",
    })}`
  );
});

process.on("SIGINT", async () => {
  try {
    const { sql } = require("./config/db.js");
    if (sql && sql.close) {
      await sql.close();
      console.log("Conexión a la base de datos cerrada.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error al cerrar la conexión:", err);
    process.exit(1);
  }
});
