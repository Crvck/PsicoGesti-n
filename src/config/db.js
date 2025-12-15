require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false,
        
        // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---
        dialectOptions: {
            ssl: {
                require: true, // Obliga a usar SSL
                rejectUnauthorized: false // Importante para desarrollo en TiDB Cloud
            }
        },
        // --------------------------------------

        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a base de datos con Sequelize establecida exitosamente.');
    } catch (error) {
        console.error('❌ No se pudo conectar a la base de datos:', error);
    }
}

testConnection();

module.exports = sequelize;