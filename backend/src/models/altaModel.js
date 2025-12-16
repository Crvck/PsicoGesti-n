const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Paciente = require('./pacienteModel');
const User = require('./userModel');

const Alta = sequelize.define('Alta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Paciente,
            key: 'id'
        }
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    tipo_alta: {
        type: DataTypes.ENUM(
            'terapeutica',
            'abandono',
            'traslado',
            'graduacion',
            'no_continua',
            'otro'
        ),
        allowNull: false
    },
    fecha_alta: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    motivo_detallado: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    recomendaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sesiones_totales: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    evaluacion_final: {
        type: DataTypes.ENUM('excelente', 'buena', 'regular', 'mala'),
        allowNull: true
    },
    seguimiento_recomendado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    fecha_seguimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'altas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
        {
            fields: ['paciente_id']
        },
        {
            fields: ['fecha_alta']
        },
        {
            fields: ['tipo_alta']
        }
    ]
});

Alta.belongsTo(Paciente, { foreignKey: 'paciente_id' });
Alta.belongsTo(User, { foreignKey: 'usuario_id' });

module.exports = Alta;