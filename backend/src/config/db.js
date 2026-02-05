const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Sequelize } = require('sequelize');

// Verifica primero si las variables se están leyendo (solo para depuración)
// console.log("User:", process.env.DB_USERNAME); 

const sequelize = new Sequelize(
    process.env.DB_DATABASE, // CAMBIO 1: De DB_NAME a DB_DATABASE
    process.env.DB_USERNAME, // CAMBIO 2: De DB_USER a DB_USERNAME (Aquí estaba el error del prefijo)
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false,
        
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Importante para TiDB Cloud
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