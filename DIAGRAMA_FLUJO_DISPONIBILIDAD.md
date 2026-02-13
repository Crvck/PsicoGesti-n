# Diagrama de Flujo: Sistema de Pre-registro con Disponibilidad

## 🔄 Flujo Completo del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     USUARIO NO AUTENTICADO                       │
│                 Accede a /preregistro                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND - PASO 1                             │
│             Datos Personales (PreRegistro.js)                    │
│                                                                   │
│  [Nombre Completo]          [Teléfono]                          │
│  [Correo Electrónico]                                           │
│  ┌─ Selector ─────────┐                                         │
│  │ ○ Estudiante CESUN │                                         │
│  │ ○ Foráneo/Fundación │                                         │
│  └────────────────────┘                                         │
│  │ SI CESUN    SI EXTERNO                                       │
│  │ [Matrícula] [Institución]                                    │
│  [Horas a Liberar]                                              │
│  [Motivo de Solicitud]                                          │
│                                                                   │
│  Validaciones:                                                   │
│  ✓ Matrícula (si interno)                                       │
│  ✓ Institución (si externo)                                     │
│  ✓ Horas requeridas                                             │
│                                                                   │
│  [Atrás] [Siguiente]                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND - PASO 2                             │
│            Disponibilidad Horaria (PreRegistro.js)               │
│                                                                   │
│  Disponibilidad Horaria                                         │
│  "Indica los días y horarios en que puedes ofrecer servicios"   │
│                                                                   │
│  ☐ LUNES                                                         │
│  ☑ MARTES       [08:00] - [17:00]  ◄─ Visible si está checked │
│  ☑ MIÉRCOLES    [09:00] - [14:00]                              │
│  ☐ JUEVES                                                        │
│  ☑ VIERNES      [08:00] - [17:00]                              │
│  ☐ SÁBADO                                                        │
│  ☐ DOMINGO                                                       │
│                                                                   │
│  Validaciones:                                                   │
│  ✓ Mínimo 1 día seleccionado                                    │
│  ✓ Hora fin > Hora inicio                                       │
│                                                                   │
│  [Anterior] [Enviar Solicitud]                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              CONVERSOR DE DISPONIBILIDAD                         │
│                                                                   │
│  Estado Component:                                               │
│  {                                                               │
│    lunes: { habilitado: false, ... },                           │
│    martes: { habilitado: true, horaInicio: '08:00', ... },      │
│    ...                                                            │
│  }                                                               │
│                    │                                             │
│                    ▼                                             │
│  Array de disponibilidad:                                       │
│  [                                                               │
│    { dia_semana: 'martes', hora_inicio: '08:00', ... },        │
│    { dia_semana: 'miercoles', hora_inicio: '09:00', ... },     │
│    { dia_semana: 'viernes', hora_inicio: '08:00', ... }        │
│  ]                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              POST /api/preregistro                               │
│                                                                   │
│  Payload:                                                        │
│  {                                                               │
│    "nombre": "Juan Pérez",                                      │
│    "email": "juan@example.com",                                 │
│    "telefono": "555-1234",                                      │
│    "esEstudiante": true,                                        │
│    "matricula": "123456",                                       │
│    "institucionProcedencia": "CESUN",                           │
│    "horasALiberar": 480,                                        │
│    "motivo": "Prácticas profesionales",                         │
│    "disponibilidad": [                                          │
│      { "dia_semana": "martes", "hora_inicio": "08:00", ...},  │
│      { "dia_semana": "miercoles", "hora_inicio": "09:00", ...},│
│      { "dia_semana": "viernes", "hora_inicio": "08:00", ...}  │
│    ]                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          BACKEND - preregistroController.js                      │
│                                                                   │
│  1. Validar email no duplicado                                  │
│  2. Validar disponibilidad (min 1 día)                          │
│  3. Crear Solicitud:                                            │
│     {                                                             │
│       nombre_completo: 'Juan Pérez',                            │
│       email: 'juan@example.com',                                │
│       ... otros campos ...                                       │
│       disponibilidad_horaria: JSON.stringify([                  │
│         { dia_semana: 'martes', ...},                           │
│         ...                                                      │
│       ])                                                         │
│     }                                                             │
│  4. Notificar a COORDINADORES                                   │
│  5. Commit transacción                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          BASE DE DATOS - solicitudes_ingreso                     │
│                                                                   │
│  id: 1                                                            │
│  nombre_completo: Juan Pérez                                    │
│  email: juan@example.com                                        │
│  estado: PENDIENTE                                              │
│  disponibilidad_horaria: '[                                     │
│    {"dia_semana":"martes",...},                                 │
│    {"dia_semana":"miercoles",...},                              │
│    {"dia_semana":"viernes",...}                                 │
│  ]'                                                             │
│  fecha_solicitud: 2026-02-05 10:30:45                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 COORDINADOR - Dashboard                          │
│                                                                   │
│  Ver solicitud pendiente                                        │
│  ├─ Nombre: Juan Pérez                                          │
│  ├─ Email: juan@example.com                                     │
│  ├─ Origen: CESUN                                               │
│  ├─ Horas: 480                                                  │
│  └─ Disponibilidad: [Ver JSON]                                 │
│                                                                   │
│  Acciones:                                                       │
│  [Aprobar - Rol: Psicólogo]  [Rechazar]                        │
│  [Aprobar - Rol: Becario]                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         POST /api/dashboard/aprobar-solicitud                    │
│                                                                   │
│  {                                                               │
│    "solicitudId": 1,                                            │
│    "rolAsignado": "PSICOLOGO"                                   │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│        BACKEND - dashboardController.js (aprobarSolicitud)       │
│                                                                   │
│  1. Buscar solicitud                                            │
│  2. Validar email no registrado                                 │
│  3. Crear Usuario:                                              │
│     {                                                             │
│       nombre: 'Juan',                                           │
│       apellido: 'Pérez',                                        │
│       email: 'juan@example.com',                                │
│       password: hash('Juan123'),                                │
│       rol: 'psicologo',                                         │
│       telefono: '555-1234',                                     │
│       activo: true                                              │
│     }                                                             │
│     ▼ usuario.id = 42                                           │
│                                                                   │
│  4. Parsear disponibilidad_horaria de solicitud                │
│  5. Para cada día en disponibilidad:                            │
│     Crear en disponibilidades:                                  │
│     {                                                             │
│       usuario_id: 42,                                           │
│       dia_semana: 'martes',                                     │
│       hora_inicio: '08:00',                                     │
│       hora_fin: '17:00',                                        │
│       tipo_disponibilidad: 'regular',                           │
│       activo: true,                                             │
│       fecha_inicio_vigencia: NOW()                              │
│     }                                                             │
│     ↻ 3 registros creados (martes, miér, viernes)             │
│                                                                   │
│  6. Actualizar solicitud.estado = 'APROBADA'                   │
│  7. Commit transacción                                          │
│  8. Enviar email de bienvenida (async)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          BASE DE DATOS - users + disponibilidades                │
│                                                                   │
│  TABLA users:                                                    │
│  id: 42, nombre: Juan, email: juan@example.com                  │
│  rol: psicologo, activo: true                                   │
│                                                                   │
│  TABLA disponibilidades: (3 registros)                          │
│  ┌───────────────────────────────────────┐                     │
│  │ id: 100                               │                     │
│  │ usuario_id: 42                        │                     │
│  │ dia_semana: martes                    │                     │
│  │ hora_inicio: 08:00                    │                     │
│  │ hora_fin: 17:00                       │                     │
│  │ tipo_disponibilidad: regular          │                     │
│  │ activo: true                          │                     │
│  └───────────────────────────────────────┘                     │
│  ┌───────────────────────────────────────┐                     │
│  │ id: 101                               │                     │
│  │ usuario_id: 42                        │                     │
│  │ dia_semana: miercoles                 │                     │
│  │ hora_inicio: 09:00                    │                     │
│  │ hora_fin: 14:00                       │                     │
│  │ tipo_disponibilidad: regular          │                     │
│  │ activo: true                          │                     │
│  └───────────────────────────────────────┘                     │
│  ┌───────────────────────────────────────┐                     │
│  │ id: 102                               │                     │
│  │ usuario_id: 42                        │                     │
│  │ dia_semana: viernes                   │                     │
│  │ hora_inicio: 08:00                    │                     │
│  │ hora_fin: 17:00                       │                     │
│  │ tipo_disponibilidad: regular          │                     │
│  │ activo: true                          │                     │
│  └───────────────────────────────────────┘                     │
│                                                                   │
│  TABLA solicitudes_ingreso:                                     │
│  id: 1, estado: APROBADA, ...                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              ✅ USUARIO APROBADO                                 │
│                                                                   │
│  Juan Pérez ahora puede:                                        │
│  ✓ Iniciar sesión con email: juan@example.com                  │
│  ✓ Password: Juan123                                            │
│  ✓ Rol: Psicólogo                                               │
│  ✓ Ver su disponibilidad registrada                            │
│  ✓ Recibir citas según disponibilidad                          │
│                                                                   │
│  Su disponibilidad en el sistema:                               │
│  • Martes: 08:00-17:00                                          │
│  • Miércoles: 09:00-14:00                                       │
│  • Viernes: 08:00-17:00                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Estructura de Datos

### 1. Estado Component Frontend
```javascript
disponibilidad = {
  lunes: { habilitado: boolean, horaInicio: string, horaFin: string },
  martes: { habilitado: boolean, horaInicio: string, horaFin: string },
  // ... 7 días ...
}
```

### 2. Array para Backend
```javascript
[
  { dia_semana: 'lunes', hora_inicio: '08:00', hora_fin: '17:00' },
  { dia_semana: 'martes', hora_inicio: '08:00', hora_fin: '17:00' },
  // ... únicamente días habilitados ...
]
```

### 3. JSON en Base de Datos (solicitudes_ingreso)
```json
[
  {"dia_semana":"lunes","hora_inicio":"08:00","hora_fin":"17:00"},
  {"dia_semana":"martes","hora_inicio":"08:00","hora_fin":"17:00"}
]
```

### 4. Registros en Tabla disponibilidades
```
Cada día = 1 registro
{
  usuario_id: 42,
  dia_semana: 'lunes',
  hora_inicio: '08:00',
  hora_fin: '17:00',
  tipo_disponibilidad: 'regular',
  activo: true,
  fecha_inicio_vigencia: '2026-02-05',
  fecha_fin_vigencia: null,
  notas: null,
  max_citas_dia: 8,
  intervalo_citas: 50
}
```

---

## 🔐 Validaciones

### Frontend (PreRegistro.js)

**Paso 1:**
```javascript
✓ Nombre no vacío (required)
✓ Email válido (type=email)
✓ Teléfono no vacío (required)
✓ Matrícula no vacía (si interno)
✓ Institución no vacía (si externo)
✓ Horas a liberar > 0 (required, min=1)
```

**Paso 2:**
```javascript
✓ Mínimo 1 día seleccionado
✓ Para cada día seleccionado:
  ✓ horaInicio < horaFin
  ✓ Formato HH:MM válido
```

### Backend (preregistroController.js)

```javascript
✓ Email no registrado (SELECT email FROM users)
✓ Solicitud no aprobada previamente
✓ Disponibilidad array no vacío
✓ Cada elemento tiene: dia_semana, hora_inicio, hora_fin
```

---

## 🚀 Performance

### Queries Usadas

```sql
-- Al crear solicitud (1 INSERT)
INSERT INTO solicitudes_ingreso (...) VALUES (...)

-- Al aprobar (1 INSERT per día + 1 UPDATE)
INSERT INTO disponibilidades (...) VALUES (...)  -- x3
UPDATE solicitudes_ingreso SET estado='APROBADA' WHERE id=1

-- Al buscar usuario con disponibilidad (1 SELECT)
SELECT * FROM disponibilidades 
WHERE usuario_id=42 AND activo=true
ORDER BY dia_semana, hora_inicio
```

### Índices
```sql
-- En solicitudes_ingreso
INDEX idx_solicitudes_estado (estado)
INDEX idx_solicitudes_fecha (fecha_solicitud)

-- En disponibilidades
INDEX idx_usuario_dia_activo (usuario_id, dia_semana, activo)
INDEX idx_fecha_vigencia (fecha_inicio_vigencia, fecha_fin_vigencia)
```

---

## 🧪 Casos de Prueba

| Caso | Entrada | Esperado |
|------|---------|----------|
| Pre-registro completo | Todos datos + 3 días | Solicitud guardada |
| Sin disponibilidad | Todos datos + 0 días | Error: min 1 día |
| Horario inválido | Fin < Inicio | Error: fin > inicio |
| Email duplicado | Email de usuario existente | Error: email registrado |
| Aprobación exitosa | Coordinador aprueba | Usuario + 3 disponibilidades creadas |
| Sin disponibilidad al aprobar | Solicitud sin JSON | Usuario creado, sin disponibilidades |

---

## 📝 Logs del Sistema

```
[INFO] POST /api/preregistro recibido
[INFO] Validando disponibilidad: 3 días
[INFO] Creando Solicitud ID: 1
[INFO] Notificando a 2 coordinadores
[INFO] Solicitud creada exitosamente

[INFO] POST /api/dashboard/aprobar-solicitud
[INFO] Transacción iniciada
[INFO] Usuario creado: ID 42
[INFO] Parseando disponibilidad_horaria: 3 elementos
[INFO] Creando disponibilidad para martes 08:00-17:00
[INFO] Creando disponibilidad para miercoles 09:00-14:00
[INFO] Creando disponibilidad para viernes 08:00-17:00
[INFO] 3 registros de disponibilidad creados
[INFO] Actualizando estado solicitud a APROBADA
[INFO] Transacción completada y usuario creado
```

---

## 🔄 Conversión de Datos

```
Frontend State              Payload API         BD JSON             DB Table
────────────────────────────────────────────────────────────────────────────
{                           [                   [                   3 rows
  lunes: false,               {                   {
  martes: true,                dia: 'martes',      dia: 'martes',    id: 100
  miercoles: true,             inicio: '08:00',    inicio: '08:00',  usuario_id: 42
  jueves: false,               fin: '17:00'        fin: '17:00'      dia_semana: 
  viernes: true,             },                  },                 martes
  sabado: false,              {                   {                  hora_inicio:
  domingo: false                dia: 'miercoles',   dia: 'miercoles', 08:00
}                             inicio: '09:00',    inicio: '09:00',  hora_fin:
                               fin: '14:00'        fin: '14:00'      17:00
                             },                  },                 ...
                             {                   {
                               dia: 'viernes',     dia: 'viernes',
                               inicio: '08:00',    inicio: '08:00',
                               fin: '17:00'        fin: '17:00'
                             }                   }
                           ]                   ]
```

