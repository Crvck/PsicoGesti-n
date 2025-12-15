const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./src/doc/swagger.json');
const cors = require('cors');

const sequelize = require('./src/config/db');
require('./src/models/userModel'); 

const authRoutes = require('./src/routes/authRoutes');

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


sequelize.sync({ force: false })
    .then(() => {
        console.log("✅ Tablas sincronizadas (base de datos lista)");
        app.listen(PORT, () => {
          console.log(`Backend running on http://localhost:${PORT}`);
          console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
          console.log(`CORS permitido para: http://localhost:3001`);
        });
    })
    .catch((error) => {
        console.error("❌ Error al sincronizar la base de datos:", error.message);
    });