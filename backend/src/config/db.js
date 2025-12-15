const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

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
        
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },

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
        console.log('✅ Conexión a base de datos establecida exitosamente.');
    } catch (error) {
        console.error('❌ No se pudo conectar a la base de datos:', error);
    }
}

testConnection();

module.exports = sequelize;