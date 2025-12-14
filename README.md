# 🧠 Sistema de Gestión - Consultorio de Psicología

Backend para la administración de pacientes, citas e historias clínicas del servicio comunitario de psicología. Desarrollado con Node.js, Express y MySQL.

## 📋 Tabla de Contenidos
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tecnologías](#-tecnologías)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Scripts Disponibles](#-scripts-disponibles)
- [Documentación API (Swagger)](#-documentación-api-swagger)

## 📂 Estructura del Proyecto

La arquitectura sigue el patrón MVC y separación de responsabilidades:

```text
project-root/
├── src/
│   ├── config/          # Configuración de DB, Swagger y variables de entorno
│   ├── controllers/     # Lógica de las peticiones (REQ -> RES)
│   ├── middlewares/     # Validaciones, Autenticación (JWT) y manejo de errores
│   ├── models/          # Modelos de base de datos (Sequelize/MySQL)
│   ├── routes/          # Definición de endpoints de la API
│   ├── services/        # Lógica de negocio compleja y servicios externos
│   ├── utils/           # Funciones auxiliares reutilizables
│   ├── app.js           # Configuración de Express (Middlewares, Cors)
│   └── server.js        # Punto de entrada y arranque del servidor
├── .env                 # Variables de entorno (No subir al repo)
├── package.json         # Dependencias y scripts
└── README.md            # Documentación del proyecto

