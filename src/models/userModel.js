const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Importamos la conexión

// Definimos el modelo 'User'
const User = sequelize.define('User', {
    // Sequelize añade automáticamente una columna 'id' auto-incremental
    // Si quieres definirla manualmente:
    /* id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, 
    */
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
            msg: 'El correo electrónico ya está registrado'
        },
        validate: {
            isEmail: {
                msg: 'Debe proporcionar un correo electrónico válido'
            },
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    }
    // Sequelize añade automáticamente 'createdAt' y 'updatedAt'
}, {
    tableName: 'users', // Nombre real de la tabla en la BD
    timestamps: true // Asegura que se creen createdAt y updatedAt
});

module.exports = User;