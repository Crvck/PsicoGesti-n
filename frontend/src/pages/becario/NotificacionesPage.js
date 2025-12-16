import React, { useState, useEffect } from 'react';
import { FiBell, FiCheckCircle, FiClock, FiCalendar, FiMessageSquare } from 'react-icons/fi';

const BecarioNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const fetchNotificaciones = async () => {
    try {
      // Simulación de datos
      setTimeout(() => {
        setNotificaciones([
          {
            id: 1,
            tipo: 'cita_modificada',
            titulo: 'Cita modificada',
            mensaje: 'La cita con Carlos Gómez ha sido reprogramada para mañana a las 11:00 AM',
            fecha: '2024-01-10 09:30:00',
            leida: false
          },
          {
            id: 2,
            tipo: 'cita_nueva',
            titulo: 'Nueva cita asignada',
            mensaje: 'Tienes una nueva cita con Mariana López para el viernes 12 de enero',
            fecha: '2024-01-09 14:15:00',
            leida: true
          },
          {
            id: 3,
            tipo: 'sistema',
            titulo: 'Recordatorio de observación',
            mensaje: 'Recuerda registrar las observaciones de la sesión con Roberto Sánchez',
            fecha: '2024-01-08 16:45:00',
            leida: false
          },
          {
            id: 4,
            tipo: 'mensaje',
            titulo: 'Mensaje del psicólogo',
            mensaje: 'Por favor, prepara el informe del paciente Carlos Gómez para la supervisión',
            fecha: '2024-01-07 10:20:00',
            leida: true
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      setLoading(false);
    }
  };

  const marcarComoLeida = async (notifId) => {
    setNotificaciones(prev => 
      prev.map(notif => 
        notif.id === notifId ? { ...notif, leida: true } : notif
      )
    );
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones(prev => 
      prev.map(notif => ({ ...notif, leida: true }))
    );
  };

  const getIconByTipo = (tipo) => {
    switch (tipo) {
      case 'cita_nueva':
      case 'cita_modificada':
        return <FiCalendar />;
      case 'sistema':
        return <FiBell />;
      case 'mensaje':
        return <FiMessageSquare />;
      default:
        return <FiBell />;
    }
  };

  const getColorByTipo = (tipo) => {
    switch (tipo) {
      case 'cita_nueva':
        return 'var(--grnb)';
      case 'cita_modificada':
        return 'var(--yy)';
      case 'sistema':
        return 'var(--blu)';
      case 'mensaje':
        return 'var(--grnd)';
      default:
        return 'var(--gray)';
    }
  };

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando notificaciones...</div>
      </div>
    );
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Notificaciones</h1>
          <p>Mensajes y alertas del sistema</p>
        </div>
        <div className="flex-row gap-10">
          {notificacionesNoLeidas > 0 && (
            <button className="btn-secondary" onClick={marcarTodasComoLeidas}>
              <FiCheckCircle /> Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      <div className="configuracion-container">
        <div className="config-content">
          <div className="notifications-list">
            {notificaciones.map((notif) => (
              <div 
                key={notif.id} 
                className={`notification-item ${!notif.leida ? 'unread' : ''}`}
                style={{ borderLeftColor: getColorByTipo(notif.tipo) }}
              >
                <div className="notification-icon" style={{ color: getColorByTipo(notif.tipo) }}>
                  {getIconByTipo(notif.tipo)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h4>{notif.titulo}</h4>
                    <div className="notification-time">
                      <FiClock size={12} />
                      {new Date(notif.fecha).toLocaleDateString()} {new Date(notif.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  
                  <p>{notif.mensaje}</p>
                  
                  {!notif.leida && (
                    <button 
                      className="btn-text text-small"
                      onClick={() => marcarComoLeida(notif.id)}
                    >
                      <FiCheckCircle /> Marcar como leída
                    </button>
                  )}
                </div>
                
                {!notif.leida && (
                  <span className="badge badge-info">Nuevo</span>
                )}
              </div>
            ))}
            
            {notificaciones.length === 0 && (
              <div className="no-citas">
                <div className="no-citas-icon">🔔</div>
                <div>No hay notificaciones</div>
                <p className="text-small mt-10">Las notificaciones aparecerán aquí cuando tengas nuevas alertas</p>
              </div>
            )}
          </div>
          
          <div className="mt-20">
            <h4>Tipos de notificaciones</h4>
            <div className="grid-4 mt-10">
              <div className="notification-type">
                <div className="notification-type-icon" style={{ color: 'var(--grnb)' }}>
                  <FiCalendar />
                </div>
                <div className="notification-type-info">
                  <strong>Citas</strong>
                  <p>Nuevas citas, modificaciones y recordatorios</p>
                </div>
              </div>
              
              <div className="notification-type">
                <div className="notification-type-icon" style={{ color: 'var(--blu)' }}>
                  <FiBell />
                </div>
                <div className="notification-type-info">
                  <strong>Sistema</strong>
                  <p>Alertas y recordatorios del sistema</p>
                </div>
              </div>
              
              <div className="notification-type">
                <div className="notification-type-icon" style={{ color: 'var(--grnd)' }}>
                  <FiMessageSquare />
                </div>
                <div className="notification-type-info">
                  <strong>Mensajes</strong>
                  <p>Comunicación con psicólogos y coordinadores</p>
                </div>
              </div>
              
              <div className="notification-type">
                <div className="notification-type-icon" style={{ color: 'var(--yy)' }}>
                  <FiCheckCircle />
                </div>
                <div className="notification-type-info">
                  <strong>Tareas</strong>
                  <p>Recordatorios de tareas pendientes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecarioNotificaciones;