require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./src/doc/swagger.json');
const cors = require('cors');

// IMPORTANTE: Importar la conexión de Sequelize
const sequelize = require('./src/config/db');
// IMPORTANTE: Importar los modelos para que Sequelize sepa que existen antes de sincronizar
require('./src/models/userModel'); 

const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send('Server is running! Check /api-docs for documentation.');
});

app.use('/api/auth', authRoutes);

// ==========================================
// INICIO DEL SERVIDOR CON SEQUELIZE SYNC
// ==========================================

// Sincroniza los modelos con la base de datos.
// { force: false } -> Crea las tablas si no existen, NO borra datos existentes.
// { force: true }  -> BORRA (DROP) las tablas y las vuelve a crear cada vez (útil en desarrollo inicial).
// { alter: true }  -> Intenta modificar las tablas existentes para coincidir con el modelo.
sequelize.sync({ force: false })
    .then(() => {
        console.log("✅ Tablas sincronizadas (base de datos lista)");
        // Solo iniciamos el servidor si la BD sincronizó correctamente
        app.listen(PORT, () => {
          console.log(`Server is running on http://localhost:${PORT}`);
          console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
        });
    })
    .catch((error) => {
        console.error("❌ Error al sincronizar la base de datos:", error);
    });