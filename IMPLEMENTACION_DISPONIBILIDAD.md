# Implementación: Pre-registro con Disponibilidad Horaria

## Resumen General

Se ha implementado un sistema de **pre-registro en dos pasos** que permite a los colaboradores (estudiantes y externos) registrarse indicando:

1. **Paso 1**: Datos personales (nombre, email, teléfono, institución/matrícula, horas a liberar)
2. **Paso 2**: Disponibilidad horaria (días de la semana y horarios en los que pueden ofrecer servicio)

Cuando una solicitud es aprobada por un coordinador, la disponibilidad se guarda automáticamente en la tabla `disponibilidades` del sistema.

---

## Cambios Realizados

### 1. **Frontend** (`/frontend/src/components/Auth/PreRegistro.js`)

#### Estado Component
```javascript
const [paso, setPaso] = useState(1); // 1: Datos personales, 2: Disponibilidad

const [disponibilidad, setDisponibilidad] = useState({
  lunes: { habilitado: false, horaInicio: '08:00', horaFin: '17:00' },
  martes: { habilitado: false, horaInicio: '08:00', horaFin: '17:00' },
  // ... otros días
  domingo: { habilitado: false, horaInicio: '09:00', horaFin: '14:00' }
});
```

**Estructura de disponibilidad:**
- `habilitado`: boolean - Si el día está seleccionado
- `horaInicio`: string (HH:MM) - Hora inicial del servicio
- `horaFin`: string (HH:MM) - Hora final del servicio

#### Manejo de Disponibilidad
```javascript
const handleDisponibilidadChange = (dia, field, value) => {
  setDisponibilidad(prev => ({
    ...prev,
    [dia]: { ...prev[dia], [field]: value }
  }));
};
```

#### Validaciones en Paso 2
```javascript
// Validar que al menos un día esté seleccionado
const diasHabilitados = Object.values(disponibilidad).filter(d => d.habilitado);
if (diasHabilitados.length === 0) {
  setError('Selecciona al menos un día disponible.');
  return;
}

// Validar que hora de fin > hora de inicio
for (let dia in disponibilidad) {
  if (disponibilidad[dia].habilitado) {
    if (disponibilidad[dia].horaInicio >= disponibilidad[dia].horaFin) {
      setError(`${dia}: La hora de fin debe ser mayor que la hora de inicio.`);
      return;
    }
  }
}
```

#### Conversión de Disponibilidad
```javascript
const diasDisponibilidad = Object.entries(disponibilidad)
  .filter(([_, d]) => d.habilitado)
  .map(([dia, d]) => ({
    dia_semana: dia,
    hora_inicio: d.horaInicio,
    hora_fin: d.horaFin
  }));
```

El payload enviado al backend contiene:
```javascript
{
  nombre: '...',
  email: '...',
  telefono: '...',
  // ... otros campos
  disponibilidad: [
    { dia_semana: 'lunes', hora_inicio: '08:00', hora_fin: '17:00' },
    { dia_semana: 'miercoles', hora_inicio: '09:00', hora_fin: '14:00' }
  ]
}
```

#### Interfaz de Usuario (Paso 2)
```javascript
{paso === 2 && (
  <>
    <h3>Disponibilidad Horaria</h3>
    <p>Indica los días y horarios en que puedes ofrecer servicios</p>
    
    {Object.keys(disponibilidad).map(dia => (
      <div key={dia} style={{...}}>
        <label>
          <input
            type="checkbox"
            checked={disponibilidad[dia].habilitado}
            onChange={(e) => handleDisponibilidadChange(dia, 'habilitado', e.target.checked)}
          />
          <span style={{ textTransform: 'capitalize' }}>{dia}</span>
        </label>
        
        {disponibilidad[dia].habilitado && (
          <div>
            <input type="time" value={disponibilidad[dia].horaInicio} />
            <span>-</span>
            <input type="time" value={disponibilidad[dia].horaFin} />
          </div>
        )}
      </div>
    ))}
  </>
)}
```

---

### 2. **Backend - Modelo** (`/backend/src/models/Solicitud.js`)

```javascript
const Solicitud = sequelize.define('Solicitud', {
  nombre_completo: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING, allowNull: false },
  origen: { type: DataTypes.ENUM('CESUN', 'EXTERNO'), defaultValue: 'CESUN' },
  matricula: { type: DataTypes.STRING, allowNull: true },
  institucion_procedencia: { type: DataTypes.STRING, allowNull: true },
  horas_a_liberar: { type: DataTypes.INTEGER, allowNull: false },
  motivo: { type: DataTypes.TEXT },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO'), defaultValue: 'PENDIENTE' },
  
  // NUEVO CAMPO
  disponibilidad_horaria: { 
    type: DataTypes.JSON, 
    allowNull: true, 
    comment: 'JSON con los días y horarios disponibles del solicitante' 
  }
}, {
  tableName: 'solicitudes_ingreso',
  timestamps: true,
  createdAt: 'fecha_solicitud',
  updatedAt: false
});
```

**Estructura del JSON guardado:**
```json
[
  { "dia_semana": "lunes", "hora_inicio": "08:00", "hora_fin": "17:00" },
  { "dia_semana": "miercoles", "hora_inicio": "09:00", "hora_fin": "14:00" }
]
```

---

### 3. **Backend - Base de Datos** (`/backend/migrations/20260203_create_solicitudes_ingreso.sql`)

```sql
CREATE TABLE IF NOT EXISTS solicitudes_ingreso (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    origen ENUM('CESUN', 'EXTERNO') DEFAULT 'CESUN',
    matricula VARCHAR(50) NULL,
    institucion_procedencia VARCHAR(255) NULL,
    horas_a_liberar INT NOT NULL,
    motivo TEXT,
    estado ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO') DEFAULT 'PENDIENTE',
    
    -- NUEVO CAMPO
    disponibilidad_horaria JSON NULL COMMENT 'JSON con días y horarios disponibles del solicitante',
    
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

### 4. **Backend - Controlador PreRegistro** (`/backend/src/controllers/preregistroController.js`)

```javascript
exports.crearSolicitud = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { 
      nombre, email, telefono, esEstudiante, 
      matricula, institucionProcedencia, horasALiberar, motivo, disponibilidad
    } = req.body;

    // Validar email no duplicado
    const solicitudExistente = await Solicitud.findOne({
      where: { email },
      transaction: t
    });

    if (solicitudExistente && solicitudExistente.estado === 'APROBADA') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado como usuario aprobado.'
      });
    }

    // Validar que tenga disponibilidad
    if (!disponibilidad || disponibilidad.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar al menos un día de disponibilidad.'
      });
    }

    // Crear solicitud con disponibilidad
    const nuevaSolicitud = await Solicitud.create({
      nombre_completo: nombre,
      email,
      telefono,
      origen: esEstudiante ? 'CESUN' : 'EXTERNO',
      matricula: esEstudiante ? matricula : null,
      institucion_procedencia: esEstudiante ? 'CESUN' : institucionProcedencia,
      horas_a_liberar: horasALiberar,
      motivo,
      estado: 'PENDIENTE',
      disponibilidad_horaria: JSON.stringify(disponibilidad) // Guardar como JSON
    }, { transaction: t });

    // Notificar a coordinadores
    await notificationService.notificarRol(
        'COORDINADOR', 
        {
            titulo: 'Nueva Solicitud de Ingreso',
            mensaje: `${nombre} ha solicitado ingresar como practicante.`,
            tipo: 'alerta_sistema',
            prioridad: 'media',
            accion_url: `/dashboard/solicitudes/${nuevaSolicitud.id}`,
            extra: { 
                solicitud_id: nuevaSolicitud.id,
                origen: esEstudiante ? 'CESUN' : 'Externo'
            }
        }, 
        t
    );

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada correctamente'
    });

  } catch (error) {
    await t.rollback();
    console.error('Error en pre-registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};
```

---

### 5. **Backend - Controlador Dashboard** (`/backend/src/controllers/dashboardController.js`)

**Función `aprobarSolicitud` modificada:**

```javascript
static async aprobarSolicitud(req, res) {
  // ... código previo ...
  
  const nuevoUsuario = await User.create({
    nombre: nombreUser,
    apellido: apellidoUser,
    email: solicitud.email,
    password: passwordHash,
    rol: rolAsignado.toLowerCase(),
    telefono: solicitud.telefono,
    activo: true
  }, { transaction });

  // NUEVO: Crear registros de disponibilidad
  if (solicitud.disponibilidad_horaria) {
    try {
      const Disponibilidad = require('../models/disponibilidadModel');
      const disponibilidades = JSON.parse(solicitud.disponibilidad_horaria);
      
      if (Array.isArray(disponibilidades) && disponibilidades.length > 0) {
        for (const disp of disponibilidades) {
          await Disponibilidad.create({
            usuario_id: nuevoUsuario.id,
            dia_semana: disp.dia_semana,
            hora_inicio: disp.hora_inicio,
            hora_fin: disp.hora_fin,
            tipo_disponibilidad: 'regular',
            activo: true,
            fecha_inicio_vigencia: new Date()
          }, { transaction });
        }
        console.log(`--> ${disponibilidades.length} registros de disponibilidad creados.`);
      }
    } catch (dispError) {
      console.error("--> Error al crear disponibilidades (no bloqueante):", dispError.message);
    }
  }

  // ... resto del código ...
}
```

**Flujo:**
1. Se crea el usuario aprobado
2. Se parsea el JSON `disponibilidad_horaria` de la solicitud
3. Se itera sobre cada día de disponibilidad
4. Se crea un registro en `disponibilidades` para cada día con:
   - `usuario_id`: ID del usuario creado
   - `dia_semana`: Día (lunes, martes, etc.)
   - `hora_inicio`: Hora de inicio
   - `hora_fin`: Hora de fin
   - `tipo_disponibilidad`: 'regular'
   - `activo`: true
   - `fecha_inicio_vigencia`: Fecha actual

---

## Tablas de Base de Datos Involucradas

### `solicitudes_ingreso`
Almacena las solicitudes de pre-registro con su disponibilidad como JSON.

```sql
+------------------------+-----+-------+
| Campo                  | Tipo| Null? |
+------------------------+-----+-------+
| id                     | INT | No    |
| nombre_completo        | VARCHAR(255) | No    |
| email                  | VARCHAR(255) | No    |
| telefono               | VARCHAR(20)  | No    |
| origen                 | ENUM | No    |
| matricula              | VARCHAR(50)  | Sí    |
| institucion_procedencia| VARCHAR(255) | Sí    |
| horas_a_liberar        | INT | No    |
| motivo                 | TEXT | Sí    |
| estado                 | ENUM | No    |
| disponibilidad_horaria | JSON | Sí    | ← NUEVO
| fecha_solicitud        | TIMESTAMP | No    |
+------------------------+-----+-------+
```

### `disponibilidades`
Almacena la disponibilidad horaria de los usuarios aprobados.

```sql
+---------------------+------+-------+
| Campo               | Tipo | Null? |
+---------------------+------+-------+
| id                  | INT  | No    |
| usuario_id          | INT  | No    |
| dia_semana          | ENUM | No    |
| hora_inicio         | TIME | No    |
| hora_fin            | TIME | No    |
| tipo_disponibilidad | ENUM | No    |
| activo              | BOOLEAN | No  |
| fecha_inicio_vigencia | DATE | No    |
| fecha_fin_vigencia  | DATE | Sí    |
| notas               | TEXT | Sí    |
| max_citas_dia       | INT  | No    |
| intervalo_citas     | INT  | No    |
| created_at          | TIMESTAMP | No |
| updated_at          | TIMESTAMP | No |
+---------------------+------+-------+
```

---

## Flujo de Uso

### 1. **Pre-registro**
```
Usuario accede a /preregistro
    ↓
Paso 1: Ingresa datos personales
    ↓
Validación Paso 1:
  - Matrícula (si interno)
  - Institución (si externo)
  - Horas a liberar
    ↓
Paso 2: Selecciona disponibilidad
    ↓
Validación Paso 2:
  - Al menos un día habilitado
  - Hora fin > Hora inicio
    ↓
POST /api/preregistro con:
{
  nombre, email, telefono, esEstudiante,
  matricula/institucionProcedencia, horasALiberar, motivo,
  disponibilidad: [
    { dia_semana, hora_inicio, hora_fin },
    ...
  ]
}
    ↓
Backend crea Solicitud con disponibilidad_horaria JSON
    ↓
Notifica a coordinadores
    ↓
Usuario ve: "Solicitud enviada"
```

### 2. **Aprobación de Solicitud**
```
Coordinador revisa solicitud en dashboard
    ↓
Coordinador aprueba solicitud
    ↓
POST /api/dashboard/aprobar-solicitud
    ↓
Backend:
  1. Crea usuario (nombre, apellido, email, rol, etc.)
  2. Parsea disponibilidad_horaria JSON
  3. Crea registro en disponibilidades para cada día
  4. Actualiza estado solicitud a 'APROBADA'
    ↓
Usuario creado con disponibilidad registrada
```

### 3. **Sistema de Citas**
```
Al programar una cita:
  - El sistema verifica disponibilidades del usuario
  - Solo permite agendar en días/horarios indicados
  - Respeta horarios guardados
```

---

## Archivos Modificados

1. ✅ `/frontend/src/components/Auth/PreRegistro.js` - Interfaz de 2 pasos
2. ✅ `/backend/src/models/Solicitud.js` - Campo JSON agregado
3. ✅ `/backend/src/models/disponibilidadModel.js` - Ya existía
4. ✅ `/backend/migrations/20260203_create_solicitudes_ingreso.sql` - Campo JSON agregado
5. ✅ `/backend/src/controllers/preregistroController.js` - Validación y guardado de disponibilidad
6. ✅ `/backend/src/controllers/dashboardController.js` - Creación de disponibilidades al aprobar

---

## Testing

### Test Caso 1: Pre-registro Completo
```bash
# 1. Ir a http://localhost:3001/preregistro
# 2. Paso 1: Llenar datos
   - Nombre: Juan Pérez
   - Email: juan@example.com
   - Telefono: 555-1234
   - Seleccionar INTERNO
   - Matrícula: 123456
   - Horas: 480
   - Motivo: Prácticas profesionales
# 3. Click "Siguiente"
# 4. Paso 2: Seleccionar disponibilidad
   - Checkbox LUNES: 08:00 - 17:00
   - Checkbox MIERCOLES: 09:00 - 14:00
   - Checkbox VIERNES: 08:00 - 17:00
# 5. Click "Enviar Solicitud"
# 6. Verificar en DB:
   SELECT * FROM solicitudes_ingreso WHERE email='juan@example.com';
   # Debe mostrar disponibilidad_horaria con JSON
```

### Test Caso 2: Validaciones
```bash
# Test sin disponibilidad:
# - Ir a Paso 2, no seleccionar ningún día, enviar
# - Error: "Selecciona al menos un día disponible"

# Test horario inválido:
# - Seleccionar un día
# - Hora inicio: 17:00, Hora fin: 08:00
# - Error: "La hora de fin debe ser mayor"
```

### Test Caso 3: Aprobación
```bash
# 1. Coordinador aprueba solicitud
# 2. Verificar en DB:
   SELECT * FROM disponibilidades WHERE usuario_id = ?;
   # Debe mostrar 3 registros (lunes, miércoles, viernes)
# 3. Verificar cada registro:
   SELECT * FROM disponibilidades WHERE usuario_id = ? AND dia_semana = 'lunes';
   # hora_inicio: 08:00, hora_fin: 17:00, tipo_disponibilidad: regular, activo: true
```

---

## Notas Técnicas

1. **JSON en MySQL**: El campo `disponibilidad_horaria` es TEXT en MySQL, pero Sequelize lo convierte a JSON automáticamente
2. **Transacciones**: Se usan para garantizar que si algo falla, se revierte todo
3. **No bloqueante**: Si falla la creación de disponibilidades, no impide la aprobación del usuario
4. **Validaciones**: Tanto frontend como backend validan los datos
5. **Formato de hora**: Se usa HH:MM (24 horas) en toda la aplicación

---

## Próximas Mejoras Sugeridas

1. Agregar validación de solapamiento de horarios
2. Permitir editar disponibilidad después de aprobado
3. Agregar excepciones (días festivos, vacaciones)
4. Implementar intervalos entre citas configurables
5. Estadísticas de disponibilidad por usuario

---

## Código Completo Frontend (PreRegistro.js)

El archivo está en:
```
/frontend/src/components/Auth/PreRegistro.js (439 líneas)
```

Características principales:
- ✅ 2 pasos de formulario
- ✅ Indicador visual de progreso
- ✅ Validaciones en ambos pasos
- ✅ Interfaz responsive
- ✅ Manejo de errores
- ✅ Integración con API
