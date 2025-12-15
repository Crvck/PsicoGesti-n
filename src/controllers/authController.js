const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Importamos el modelo de Sequelize
const User = require('../models/userModel'); 

class AuthController {
    
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // 1. Validar entrada básica
            if (!email || !password) {
                return res.status(400).json({ message: 'Por favor ingrese email y contraseña' });
            }

            // 2. Buscar el usuario usando Sequelize
            // En vez de SQL crudo, usamos el método findOne con una cláusula 'where'
            const user = await User.findOne({ 
                where: { email: email } 
            });

            // 3. Verificar si el usuario existe
            if (!user) {
                // 'user' será null si no se encuentra
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            // 4. Comparar la contraseña (user.password accede al campo del objeto Sequelize)
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            // 5. Generar el JWT (usamos user.id y user.email del objeto Sequelize)
            const payload = {
                id: user.id,
                email: user.email
            };

            const token = jwt.sign(
                payload, 
                process.env.JWT_SECRET, 
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            // 6. Responder (user.toJSON() limpia metadatos de Sequelize si es necesario)
            res.json({
                message: 'Login exitoso',
                token: token,
                user: { id: user.id, email: user.email }
            });

        } catch (error) {
            console.error('Error en el login:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
}

module.exports = AuthController;