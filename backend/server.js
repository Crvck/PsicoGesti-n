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
const citaRoutes = require('./src/routes/citaRoutes');
const roleRoutes = require('./src/routes/roleRoutes');
const fundacionRoutes = require('./src/routes/fundacionRoutes');
const asignacionRoutes = require('./src/routes/asignacionRoutes');
const sesionRoutes = require('./src/routes/sesionRoutes');
const notificacionRoutes = require('./src/routes/notificacionRoutes');
const altaRoutes = require('./src/routes/altaRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');
const observacionRoutes = require('./src/routes/observacionRoutes');
const disponibilidadRoutes = require('./src/routes/disponibilidadRoutes');
const expedienteRoutes = require('./src/routes/expedienteRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const agendaRoutes = require('./src/routes/agendaRoutes');
const estadisticaRoutes = require('./src/routes/estadisticaRoutes');
const pacienteRoutes = require('./src/routes/pacienteRoutes');
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
app.use('/api/fundaciones', fundacionRoutes);
app.use('/api/asignaciones', asignacionRoutes);
app.use('/api/sesiones', sesionRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/altas', altaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/observaciones', observacionRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/estadisticas', estadisticaRoutes);
const userRoutes = require('./src/routes/userRoutes');
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/pacientes', pacienteRoutes);
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