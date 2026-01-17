import React, { useState, useEffect } from 'react';
import { FiBell, FiCheckCircle, FiClock, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import notifications from '../../utils/notifications';
import confirmations from '../../utils/confirmations';

const BecarioNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const fetchNotificaciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/notificaciones', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Adaptar los campos de la API al formato esperado por el componente
          const notificacionesAdaptadas = data.data.map(notif => ({
            ...notif,
            leida: notif.leido, // La API usa 'leido', el componente usa 'leida'
            fecha: notif.created_at // La API usa 'created_at', el componente usa 'fecha'
          }));
          setNotificaciones(notificacionesAdaptadas);
        } else {
          console.error('Error en la respuesta:', data.message);
          notifications.error('Error al cargar notificaciones');
        }
      } else {
        console.error('Error HTTP:', response.status);
        notifications.error('Error al cargar notificaciones');
      }
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      notifications.error('Error de conexión al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/notificaciones/${notifId}/leer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Actualizar el estado local
          setNotificaciones(prev => 
            prev.map(notif => 
              notif.id === notifId ? { ...notif, leida: true } : notif
            )
          );
          notifications.success('Notificación marcada como leída');
        } else {
          notifications.error('Error al marcar notificación como leída');
        }
      } else {
        notifications.error('Error al marcar notificación como leída');
      }
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      notifications.error('Error de conexión');
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/notificaciones/leer-todas', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Actualizar el estado local
          setNotificaciones(prev => 
            prev.map(notif => ({ ...notif, leida: true }))
          );
          notifications.success('Todas las notificaciones marcadas como leídas');
        } else {
          notifications.error('Error al marcar todas las notificaciones como leídas');
        }
      } else {
        notifications.error('Error al marcar todas las notificaciones como leídas');
      }
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      notifications.error('Error de conexión');
    }
  };

  const getIconByTipo = (tipo) => {
    switch (tipo) {
      case 'cita_programada':
      case 'cita_modificada':
      case 'cita_cancelada':
        return <FiCalendar />;
      case 'asignacion_nueva':
        return <FiCheckCircle />;
      case 'observacion_nueva':
        return <FiMessageSquare />;
      case 'alerta_sistema':
      case 'reporte_generado':
        return <FiBell />;
      default:
        return <FiBell />;
    }
  };

  const getColorByTipo = (tipo) => {
    switch (tipo) {
      case 'cita_programada':
        return 'var(--grnb)';
      case 'cita_modificada':
        return 'var(--yy)';
      case 'cita_cancelada':
        return 'var(--red)';
      case 'asignacion_nueva':
        return 'var(--grnd)';
      case 'observacion_nueva':
        return 'var(--blu)';
      case 'alerta_sistema':
        return 'var(--orange)';
      case 'reporte_generado':
        return 'var(--purple)';
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
        </div>
      </div>
    </div>
  );
};

export default BecarioNotificaciones;