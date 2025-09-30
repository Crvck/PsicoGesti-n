const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const token =
    req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user; // Adjunta el usuario decodificado a la solicitud
    next(); // Continúa al siguiente middleware o ruta
  });
};

module.exports = { authenticateToken };
