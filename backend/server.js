const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./src/doc/swagger.json');
const cors = require('cors');

const sequelize = require('./src/config/db');

// Importar modelos
require('./src/models/userModel');
require('./src/models/pacienteModel');
require('./src/models/citaModel');
// Importar otros modelos según necesites

const authRoutes = require('./src/routes/authRoutes');
const citaRoutes = require('./src/routes/citaRoutes'); // Añadir esta línea
const roleRoutes = require('./src/routes/roleRoutes');

const app = express();
const PORT = process.env.PORT || 3000;



app.use(cors({
  origin: 'http://localhost:3001',
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
app.use('/api/citas', citaRoutes);

const userRoutes = require('./src/routes/userRoutes');
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

// Sincronizar modelos
sequelize.sync({ force: false, alter: false })
    .then(() => {
        console.log("✅ Tablas sincronizadas (base de datos lista)");
        app.listen(PORT, () => {
          console.log(`Backend running on http://localhost:${PORT}`);
          console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
          console.log(`CORS permitido para: http://localhost:3001`);
          console.log(`Endpoints disponibles:`);
          console.log(`  GET  /api/citas/citas-por-fecha?fecha=YYYY-MM-DD&becario_id=1`);
          console.log(`  GET  /api/citas/reporte-mensual?mes=1&anio=2024`);
          console.log(`  POST /api/citas/alta-paciente`);
          console.log(`  PUT  /api/citas/cita/:id`);
        });
    })
    .catch((error) => {
        console.error("❌ Error al sincronizar la base de datos:", error.message);
    });