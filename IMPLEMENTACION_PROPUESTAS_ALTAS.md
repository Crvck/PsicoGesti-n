# Implementación: Sistema de Propuesta y Aprobación de Altas

## Descripción General
Se ha implementado un flujo de dos pasos para el proceso de altas terapéuticas:
1. **Psicólogo**: Propone un paciente para alta tras evaluarlo
2. **Coordinador**: Revisa la propuesta y toma la decisión final (aprobar/rechazar)

## Cambios en la Base de Datos

### Migración: `20260119_add_estado_propuesta_to_altas.sql`
Agregados los siguientes campos a la tabla `altas`:
- `estado` (ENUM): 'propuesta', 'aprobada', 'rechazada' (default: 'aprobada')
- `psicologo_id` (INT): FK que referencia al usuario psicólogo que propone
- `motivo_rechazo` (TEXT): Razón por la que el coordinador rechaza la propuesta
- `fecha_propuesta` (DATE): Fecha en que se creó la propuesta
- Índices para `estado` y `psicologo_id`

## Cambios en el Backend

### Nuevos Métodos en `altaController.js`

#### 1. `proponerAlta(req, res)` - POST /altas/proponer/:paciente_id
**Rol**: Psicólogo
**Función**: Propone un paciente para alta terapéutica

**Validaciones**:
- Paciente existe y está activo
- Psicólogo tiene asignado el paciente
- No existe otra propuesta pendiente para el mismo paciente

**Datos enviados**:
```json
{
  "evaluacion_final": "excelente|buena|regular|mala",
  "recomendaciones": "Texto con recomendaciones"
}
```

**Resultado**:
- Crea registro en tabla `altas` con `estado = 'propuesta'`
- Notifica a todos los coordinadores
- Devuelve la propuesta creada

#### 2. `procesarPropuesta(req, res)` - PUT /altas/:id/procesar
**Rol**: Coordinador
**Función**: Aprueba o rechaza una propuesta de alta

**Datos enviados - Si aprueba**:
```json
{
  "accion": "aprobar",
  "tipo_alta": "terapeutica|abandono|traslado|graduacion|no_continua|otro",
  "evaluacion_final": "excelente|buena|regular|mala",
  "recomendaciones": "Texto del psicólogo"
}
```

**Datos enviados - Si rechaza**:
```json
{
  "accion": "rechazar",
  "motivo_rechazo": "Razón del rechazo"
}
```

**Si aprueba**:
1. Cambia `estado` a 'aprobada'
2. Desactiva el paciente
3. Finaliza asignaciones activas
4. Cancela citas futuras
5. Notifica a psicólogo y becario
6. Registra en logs del sistema

**Si rechaza**:
1. Cambia `estado` a 'rechazada'
2. Guarda motivo del rechazo
3. Notifica al psicólogo

### Cambios en rutas `altaRoutes.js`
```javascript
router.post('/proponer/:paciente_id', requireRole(['psicologo']), AltaController.proponerAlta);
router.put('/:id/procesar', requireRole(['coordinador']), AltaController.procesarPropuesta);
```

### Cambios en `altaController.obtenerAltas()`
Agregado filtro por `estado` en query parameters:
```
GET /altas?estado=propuesta  // Solo propuestas pendientes
GET /altas?estado=aprobada   // Solo altas aprobadas
GET /altas?estado=rechazada  // Solo propuestas rechazadas
```

### Actualización de Modelo `altaModel.js`
Agregados los nuevos campos al modelo Sequelize:
- `estado` (ENUM)
- `psicologo_id` (INTEGER, FK)
- `motivo_rechazo` (TEXT)
- `fecha_propuesta` (DATEONLY)
- Relación: `Alta.belongsTo(User, { foreignKey: 'psicologo_id', as: 'psicologoPropone' })`

## Cambios en el Frontend

### 1. Página de Expedientes del Psicólogo (`ExpedientesPage.js`)

**Nuevos estados**:
```javascript
const [showModalPropuesta, setShowModalPropuesta] = useState(false);
const [propuestaData, setPropuestaData] = useState({
  evaluacion_final: '',
  recomendaciones: ''
});
```

**Nuevo método**:
- `enviarPropuestaAlta()`: Envía propuesta al backend
- `abrirModalPropuesta()`: Abre modal para crear propuesta

**Interfaz**:
- Botón "Proponer para Alta" en el footer del modal de expediente
- Modal con campos:
  - Evaluación Final (required)
  - Recomendaciones (textarea)
  - Botones: Cancelar, Enviar Propuesta

### 2. Página de Altas del Coordinador (`AltasPage.js`)

**Nuevos estados**:
```javascript
const [propuestas, setPropuestas] = useState([]);
const [showModalProcesarPropuesta, setShowModalProcesarPropuesta] = useState(false);
const [selectedPropuesta, setSelectedPropuesta] = useState(null);
const [procesarData, setProcesarData] = useState({
  accion: 'aprobar',
  tipo_alta: 'terapeutica',
  evaluacion_final: '',
  motivo_rechazo: ''
});
```

**Nuevos métodos**:
- `fetchPropuestas()`: Obtiene propuestas con estado 'propuesta'
- `abrirModalProcesarPropuesta(propuesta)`: Abre modal para procesar
- `procesarPropuesta()`: Envía decisión al backend

**Interfaz**:
1. **Estadística nueva**: Muestra contador de "Propuestas Pendientes"
2. **Nueva sección**: "Propuestas de Alta Pendientes"
   - Tarjetas con información del paciente
   - Evaluación del psicólogo
   - Recomendaciones
   - Botón "Revisar"
3. **Modal para procesar propuesta**:
   - Campo selector: Aprobar/Rechazar
   - Si aprueba: Tipo de alta, Evaluación final
   - Si rechaza: Campo de texto para motivo
   - Botones: Cancelar, Confirmar

## Flujo de Uso

### Para el Psicólogo
1. Abre expediente del paciente
2. Hace clic en botón "Proponer para Alta"
3. Completa evaluación y recomendaciones
4. Envía propuesta
5. Recibe notificación cuando el coordinador procesa su propuesta

### Para el Coordinador
1. Ve en dashboard estadística de propuestas pendientes
2. Va a sección "Propuestas de Alta Pendientes"
3. Revisa información de la propuesta
4. Hace clic en "Revisar"
5. Elige aprobar o rechazar
6. Si aprueba: Selecciona tipo de alta (por defecto "terapéutica")
7. Confirma decisión
8. El sistema:
   - Actualiza estado del paciente
   - Cancela citas futuras
   - Notifica a psicólogo y becario
   - Registra en sistema

## Validaciones

### En el Backend
- Paciente debe existir y estar activo
- Psicólogo debe tener asignado el paciente
- No puede haber propuesta pendiente duplicada
- Solo coordinadores pueden procesar propuestas
- Coordinador debe proporcionar motivo si rechaza

### En el Frontend
- Evaluación final es obligatoria para proponer
- Si se rechaza, motivo es obligatorio
- Confirmación antes de enviar/procesar

## Notificaciones
- **Psicólogo propone**: Notificación a coordinadores
- **Coordinador aprueba**: Notificación a psicólogo y becario
- **Coordinador rechaza**: Notificación a psicólogo

## Estados Posibles de una Propuesta
1. **Propuesta**: Recién creada por el psicólogo, pendiente de revisión
2. **Aprobada**: El coordinador aprobó, paciente dado de alta
3. **Rechazada**: El coordinador rechazó, requiere más evaluación

## Próximas Mejoras Sugeridas
- Agregar historial de propuestas rechazadas
- Permitir que psicólogo requiera siguiente evaluación después de rechazo
- Notificaciones por email al coordinador cuando hay propuestas pendientes
- Reporte de tiempo promedio de respuesta de coordinadores
- Auditoría de cambios en propuestas
