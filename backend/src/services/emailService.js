const nodemailer = require('nodemailer');

class EmailService {
    
    static transporter = null;
    
    static async inicializar() {
        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            
            // Verificar conexión
            await this.transporter.verify();
            console.log('✅ Servicio de email configurado correctamente');
            
        } catch (error) {
            console.error('❌ Error al configurar servicio de email:', error);
            this.transporter = null;
        }
    }
    
    static async enviarEmail(destinatario, asunto, contenido, adjuntos = []) {
        if (!this.transporter) {
            console.warn('Servicio de email no configurado');
            return false;
        }
        
        try {
            const mailOptions = {
                from: `"Sistema de Gestión Psicológica" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: destinatario,
                subject: asunto,
                html: contenido,
                attachments: adjuntos
            };
            
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Email enviado a ${destinatario}: ${info.messageId}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al enviar email:', error);
            return false;
        }
    }
    
    static async enviarNotificacionCita(datosCita) {
        const { paciente, fecha, hora, tipo_consulta, ubicacion, psicologo } = datosCita;
        
        const asunto = `Recordatorio de Cita - ${fecha}`;
        
        const contenido = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4a6fa5; color: var(--white); padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
                    .details { margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #4a6fa5; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Recordatorio de Cita</h1>
                    </div>
                    <div class="content">
                        <p>Estimado/a <strong>${paciente.nombre}</strong>,</p>
                        
                        <p>Le recordamos que tiene programada una cita de terapia psicológica:</p>
                        
                        <div class="details">
                            <p><strong>Fecha:</strong> ${fecha}</p>
                            <p><strong>Hora:</strong> ${hora}</p>
                            <p><strong>Modalidad:</strong> ${tipo_consulta === 'virtual' ? 'Virtual' : 'Presencial'}</p>
                            ${tipo_consulta === 'presencial' ? `<p><strong>Ubicación:</strong> ${ubicacion || 'Consultorio asignado'}</p>` : ''}
                            <p><strong>Psicólogo/a:</strong> ${psicologo.nombre} ${psicologo.apellido}</p>
                        </div>
                        
                        ${tipo_consulta === 'virtual' ? `
                        <p><strong>Enlace para la sesión virtual:</strong> <a href="${ubicacion}">${ubicacion}</a></p>
                        ` : ''}
                        
                        <p>Por favor, confirme su asistencia respondiendo a este correo o contactando a su terapeuta.</p>
                        
                        <p>Si necesita reprogramar o cancelar su cita, hágalo con al menos 24 horas de anticipación.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un mensaje automático del Sistema de Gestión Psicológica.</p>
                        <p>Por favor, no responda a este correo.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.enviarEmail(paciente.email, asunto, contenido);
    }
    
    static async enviarNotificacionAlta(datosAlta) {
        const { paciente, fecha_alta, tipo_alta, recomendaciones, psicologo } = datosAlta;
        
        const asunto = `Proceso de Alta - ${paciente.nombre} ${paciente.apellido}`;
        
        const contenido = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #28a745; color: var(--white); padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
                    .details { margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #28a745; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Proceso de Alta Completado</h1>
                    </div>
                    <div class="content">
                        <p>Estimado/a <strong>${paciente.nombre} ${paciente.apellido}</strong>,</p>
                        
                        <p>Le informamos que se ha completado su proceso terapéutico en nuestro centro.</p>
                        
                        <div class="details">
                            <p><strong>Fecha de alta:</strong> ${fecha_alta}</p>
                            <p><strong>Tipo de alta:</strong> ${this.obtenerDescripcionAlta(tipo_alta)}</p>
                            <p><strong>Psicólogo/a responsable:</strong> ${psicologo.nombre} ${psicologo.apellido}</p>
                        </div>
                        
                        ${recomendaciones ? `
                        <h3>Recomendaciones:</h3>
                        <p>${recomendaciones}</p>
                        ` : ''}
                        
                        <p>Le agradecemos la confianza depositada en nosotros y le deseamos lo mejor en su continuo crecimiento personal.</p>
                        
                        <p>Si en el futuro requiere apoyo psicológico, no dude en contactarnos nuevamente.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un mensaje automático del Sistema de Gestión Psicológica.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.enviarEmail(paciente.email, asunto, contenido);
    }
    
    static async enviarNotificacionObservacion(datosObservacion) {
        const { becario, supervisor, fecha, calificacion, aspectos } = datosObservacion;
        
        const asunto = `Nueva Observación - ${fecha}`;
        
        const contenido = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
                    .details { margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #ffc107; }
                    .aspecto { margin: 10px 0; padding: 10px; background-color: #f8f9fa; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Nueva Observación de Supervisión</h1>
                    </div>
                    <div class="content">
                        <p>Estimado/a <strong>${becario.nombre} ${becario.apellido}</strong>,</p>
                        
                        <p>Su supervisor ${supervisor.nombre} ${supervisor.apellido} ha registrado una nueva observación sobre su desempeño.</p>
                        
                        <div class="details">
                            <p><strong>Fecha:</strong> ${fecha}</p>
                            <p><strong>Calificación general:</strong> ${calificacion}/10</p>
                        </div>
                        
                        ${aspectos && aspectos.length > 0 ? `
                        <h3>Aspectos evaluados:</h3>
                        ${aspectos.map(aspecto => `
                            <div class="aspecto">
                                <p><strong>${aspecto.nombre}:</strong> ${aspecto.calificacion}/10</p>
                                ${aspecto.comentario ? `<p><em>${aspecto.comentario}</em></p>` : ''}
                            </div>
                        `).join('')}
                        ` : ''}
                        
                        <p>Revise su panel para ver los detalles completos y las recomendaciones de mejora.</p>
                        
                        <p>Esta retroalimentación tiene como objetivo apoyar su desarrollo profesional.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un mensaje automático del Sistema de Gestión Psicológica.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.enviarEmail(becario.email, asunto, contenido);
    }
    
    static async enviarBienvenidaUsuario(datosUsuario) {
        const { nombre, apellido, email, passwordTemporal, rol } = datosUsuario;
        
        const nombreCompleto = `${nombre} ${apellido}`;
        const rolTexto = {
            'psicologo': 'Psicólogo/a',
            'psicopedagogico': 'Psicopedagógico/a',
            'terapeuta': 'Terapeuta',
            'coterapeuta': 'Coterapeuta',
            'becario': 'Practicante/Becario',
            'coordinador': 'Coordinador/a'
        }[rol] || rol;
        
        const asunto = `Bienvenido al Sistema de Gestión Psicológica - ${nombreCompleto}`;
        
        const contenido = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4a6fa5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
                    .credentials { margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #4a6fa5; border-radius: 4px; }
                    .password { background-color: #e8f4fd; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold; color: #2c5aa0; }
                    .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>¡Bienvenido al Sistema!</h1>
                    </div>
                    <div class="content">
                        <p>Estimado/a <strong>${nombreCompleto}</strong>,</p>
                        
                        <p>¡Felicitaciones! Su solicitud de registro ha sido aprobada y ahora forma parte de nuestro equipo como <strong>${rolTexto}</strong>.</p>
                        
                        <div class="credentials">
                            <h3>Sus credenciales de acceso:</h3>
                            <p><strong>Correo electrónico:</strong> ${email}</p>
                            <p><strong>Contraseña temporal:</strong></p>
                            <div class="password">${passwordTemporal}</div>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Importante:</strong> Esta es una contraseña temporal. Le recomendamos cambiarla inmediatamente después de su primer inicio de sesión por motivos de seguridad.
                        </div>
                        
                        <p><strong>¿Cómo acceder al sistema?</strong></p>
                        <ol>
                            <li>Visite: <a href="http://localhost:3001">http://localhost:3001</a></li>
                            <li>Inicie sesión con su correo electrónico y la contraseña temporal</li>
                            <li>Cambie su contraseña en la sección de perfil</li>
                        </ol>
                        
                        <p>Si tiene alguna duda o necesita asistencia, no dude en contactar al equipo de coordinación.</p>
                        
                        <p>¡Le damos la bienvenida y esperamos que tenga una excelente experiencia en nuestro sistema!</p>
                    </div>
                    <div class="footer">
                        <p>Este es un mensaje automático del Sistema de Gestión Psicológica.</p>
                        <p>Por favor, no responda a este correo.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.enviarEmail(email, asunto, contenido);
    }
    
    static async enviarReporteAdjunto(destinatario, asunto, contenido, archivoBuffer, nombreArchivo) {
        const adjuntos = [{
            filename: nombreArchivo,
            content: archivoBuffer,
            contentType: this.obtenerContentType(nombreArchivo)
        }];
        
        return await this.enviarEmail(destinatario, asunto, contenido, adjuntos);
    }
    
    static async enviarRecordatoriosCitas() {
        try {
            // Esta función se llamaría desde un job/cron
            // Obtener citas para mañana
            const fechaManana = new Date();
            fechaManana.setDate(fechaManana.getDate() + 1);
            const fechaStr = fechaManana.toISOString().split('T')[0];
            
            // En una implementación real, se obtendrían las citas de la BD
            const citasRecordatorio = []; // Obtener de BD
            
            for (const cita of citasRecordatorio) {
                if (cita.paciente.email) {
                    await this.enviarNotificacionCita(cita);
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('Error al enviar recordatorios:', error);
            return false;
        }
    }

    static async enviarRecordatorioCitasUsuario({ usuario, citas, rangoDias }) {
        const asunto = `Recordatorio de citas programadas (${rangoDias} días)`;

        const rows = citas.map(c => {
            const totalSesiones = Number(c.total_sesiones || 1);
            const numeroSesion = Number(c.numero_sesion || 1);
            const restantes = Math.max(0, totalSesiones - numeroSesion);
            return `
            <tr>
                <td>${c.fecha}</td>
                <td>${c.hora?.substring(0, 5) || ''}</td>
                <td>${c.Paciente ? `${c.Paciente.nombre} ${c.Paciente.apellido}` : 'Paciente'}</td>
                <td>${c.tipo_consulta === 'virtual' ? 'Virtual' : 'Presencial'}</td>
                <td>${c.estado || ''}</td>
                <td>${numeroSesion}/${totalSesiones}</td>
                <td>${restantes}</td>
            </tr>
        `;
        }).join('');

        const contenido = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4a6fa5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f0f3f6; }
                    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Recordatorio de Citas Programadas</h1>
                    </div>
                    <div class="content">
                        <p>Hola <strong>${usuario.nombre} ${usuario.apellido}</strong>,</p>
                        <p>Estas son tus citas programadas para los próximos ${rangoDias} días:</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Paciente</th>
                                    <th>Modalidad</th>
                                    <th>Estado</th>
                                    <th>Sesión</th>
                                    <th>Restantes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                    <div class="footer">
                        <p>Mensaje automático del Sistema de Gestión Psicológica.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.enviarEmail(usuario.email, asunto, contenido);
    }
    
    // Métodos auxiliares
    static obtenerDescripcionAlta(tipo_alta) {
        const descripciones = {
            'terapeutica': 'Alta Terapéutica (Objetivos cumplidos)',
            'abandono': 'Abandono del Tratamiento',
            'traslado': 'Traslado a otro centro',
            'graduacion': 'Graduación del Programa',
            'no_continua': 'No Continúa el Tratamiento',
            'otro': 'Otro motivo'
        };
        return descripciones[tipo_alta] || tipo_alta;
    }
    
    static obtenerContentType(nombreArchivo) {
        const extension = nombreArchivo.split('.').pop().toLowerCase();
        
        const tipos = {
            'pdf': 'application/pdf',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'csv': 'text/csv',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword'
        };
        
        return tipos[extension] || 'application/octet-stream';
    }

    static async enviarCambioContrasena(datosUsuario) {
        const { nombre, apellido, email, passwordNueva } = datosUsuario;
        
        const nombreCompleto = `${nombre} ${apellido}`;
        
        const asunto = `Cambio de Contraseña - Sistema de Gestión Psicológica`;
        
        const contenido = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4a6fa5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
                    .credentials { margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #4a6fa5; border-radius: 4px; }
                    .password { background-color: #e8f4fd; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold; color: #2c5aa0; }
                    .success { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Cambio de Contraseña Confirmado</h1>
                    </div>
                    <div class="content">
                        <p>Estimado/a <strong>${nombreCompleto}</strong>,</p>
                        
                        <div class="success">
                            <strong>✓ Su contraseña ha sido actualizada exitosamente</strong>
                        </div>
                        
                        <p>Su contraseña en el Sistema de Gestión Psicológica ha sido modificada por el equipo de coordinación. A continuación le proporcionamos su nueva contraseña:</p>
                        
                        <div class="credentials">
                            <h3>Sus nuevas credenciales de acceso:</h3>
                            <p><strong>Correo electrónico:</strong> ${email}</p>
                            <p><strong>Contraseña:</strong></p>
                            <div class="password">${passwordNueva}</div>
                        </div>
                        
                        <p><strong>Próximos pasos:</strong></p>
                        <ol>
                            <li>Visite: <a href="http://localhost:3001">http://localhost:3001</a></li>
                            <li>Inicie sesión con su correo electrónico y la nueva contraseña</li>
                            <li>Le recomendamos cambiar la contraseña nuevamente por su propia seguridad</li>
                        </ol>
                        
                        <p>Si usted no solicitó este cambio de contraseña o tiene dudas al respecto, comuníquese inmediatamente con el equipo de coordinación.</p>
                        
                        <p>Agradecemos su confianza en nuestro sistema.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un mensaje automático del Sistema de Gestión Psicológica.</p>
                        <p>Por favor, no responda a este correo.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.enviarEmail(email, asunto, contenido);
    }
}

// Inicializar al cargar el módulo
EmailService.inicializar().catch(console.error);

module.exports = EmailService;