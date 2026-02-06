# Ejemplos Prácticos: Sistema de Disponibilidad

## 📝 Ejemplos de Datos

### Ejemplo 1: Pre-registro de Estudiante Interno

**Frontend - Paso 1:**
```
Nombre: Ana García López
Email: ana.garcia@cesun.edu.mx
Teléfono: (614) 555-1234
Tipo: Estudiante CESUN
Matrícula: 201234567
Horas a liberar: 600
Motivo: Prácticas profesionales para licenciatura en psicología
```

**Frontend - Paso 2:**
```
Selecciones:
☑ Lunes    08:00 - 18:00
☐ Martes
☑ Miércoles 09:00 - 15:00
☐ Jueves
☑ Viernes  08:00 - 18:00
☐ Sábado
☐ Domingo
```

**Payload POST /api/preregistro:**
```javascript
{
  "nombre": "Ana García López",
  "email": "ana.garcia@cesun.edu.mx",
  "telefono": "(614) 555-1234",
  "esEstudiante": true,
  "matricula": "201234567",
  "institucionProcedencia": "CESUN",
  "horasALiberar": 600,
  "motivo": "Prácticas profesionales para licenciatura en psicología",
  "disponibilidad": [
    {
      "dia_semana": "lunes",
      "hora_inicio": "08:00",
      "hora_fin": "18:00"
    },
    {
      "dia_semana": "miercoles",
      "hora_inicio": "09:00",
      "hora_fin": "15:00"
    },
    {
      "dia_semana": "viernes",
      "hora_inicio": "08:00",
      "hora_fin": "18:00"
    }
  ]
}
```

**BD - solicitudes_ingreso creada:**
```sql
INSERT INTO solicitudes_ingreso 
  (nombre_completo, email, telefono, origen, matricula, 
   institucion_procedencia, horas_a_liberar, motivo, estado, 
   disponibilidad_horaria, fecha_solicitud)
VALUES 
  ('Ana García López', 'ana.garcia@cesun.edu.mx', '(614) 555-1234', 
   'CESUN', '201234567', 'CESUN', 600, 
   'Prácticas profesionales para licenciatura en psicología', 'PENDIENTE',
   '[
     {"dia_semana":"lunes","hora_inicio":"08:00","hora_fin":"18:00"},
     {"dia_semana":"miercoles","hora_inicio":"09:00","hora_fin":"15:00"},
     {"dia_semana":"viernes","hora_inicio":"08:00","hora_fin":"18:00"}
   ]',
   NOW());

-- Resultado: id=1
```

---

### Ejemplo 2: Pre-registro de Foráneo

**Frontend - Paso 1:**
```
Nombre: Carlos Mendoza Rodríguez
Email: carlos.mendoza@escuela.com.mx
Teléfono: (669) 555-5678
Tipo: Foráneo / Fundación
Institución: Instituto Tecnológico de Culiacán
Horas a liberar: 480
Motivo: Servicio social con énfasis en terapia comunitaria
```

**Frontend - Paso 2:**
```
Selecciones:
☑ Lunes    10:00 - 16:00
☑ Martes   10:00 - 16:00
☑ Miércoles 10:00 - 16:00
☑ Jueves   10:00 - 16:00
☑ Viernes  10:00 - 16:00
☐ Sábado
☐ Domingo
```

**Payload POST /api/preregistro:**
```javascript
{
  "nombre": "Carlos Mendoza Rodríguez",
  "email": "carlos.mendoza@escuela.com.mx",
  "telefono": "(669) 555-5678",
  "esEstudiante": false,
  "matricula": null,
  "institucionProcedencia": "Instituto Tecnológico de Culiacán",
  "horasALiberar": 480,
  "motivo": "Servicio social con énfasis en terapia comunitaria",
  "disponibilidad": [
    {"dia_semana": "lunes", "hora_inicio": "10:00", "hora_fin": "16:00"},
    {"dia_semana": "martes", "hora_inicio": "10:00", "hora_fin": "16:00"},
    {"dia_semana": "miercoles", "hora_inicio": "10:00", "hora_fin": "16:00"},
    {"dia_semana": "jueves", "hora_inicio": "10:00", "hora_fin": "16:00"},
    {"dia_semana": "viernes", "hora_inicio": "10:00", "hora_fin": "16:00"}
  ]
}
```

**BD - solicitudes_ingreso creada:**
```sql
INSERT INTO solicitudes_ingreso 
  (nombre_completo, email, telefono, origen, matricula, 
   institucion_procedencia, horas_a_liberar, motivo, estado, 
   disponibilidad_horaria)
VALUES 
  ('Carlos Mendoza Rodríguez', 'carlos.mendoza@escuela.com.mx', 
   '(669) 555-5678', 'EXTERNO', NULL, 
   'Instituto Tecnológico de Culiacán', 480,
   'Servicio social con énfasis en terapia comunitaria', 'PENDIENTE',
   '[
     {"dia_semana":"lunes","hora_inicio":"10:00","hora_fin":"16:00"},
     {"dia_semana":"martes","hora_inicio":"10:00","hora_fin":"16:00"},
     {"dia_semana":"miercoles","hora_inicio":"10:00","hora_fin":"16:00"},
     {"dia_semana":"jueves","hora_inicio":"10:00","hora_fin":"16:00"},
     {"dia_semana":"viernes","hora_inicio":"10:00","hora_fin":"16:00"}
   ]');

-- Resultado: id=2
```

---

## ✅ Proceso de Aprobación

### Coordinador Aprueba Solicitud ID=1 (Ana García López)

**Frontend - Dashboard:**
```
Solicitud: Ana García López
Email: ana.garcia@cesun.edu.mx
Origen: CESUN
Matrícula: 201234567
Horas: 600
Disponibilidad:
  • Lunes: 08:00-18:00
  • Miércoles: 09:00-15:00
  • Viernes: 08:00-18:00

[Aprobar - Rol: Psicólogo] [Aprobar - Rol: Becario] [Rechazar]
```

**Coordinador selecciona: Aprobar - Rol: Psicólogo**

**Payload POST /api/dashboard/aprobar-solicitud:**
```javascript
{
  "solicitudId": 1,
  "rolAsignado": "PSICOLOGO"
}
```

**Backend - Procesa Aprobación:**

```sql
-- 1. Crear Usuario
INSERT INTO users 
  (nombre, apellido, email, password, rol, telefono, activo, 
   created_at, updated_at)
VALUES 
  ('Ana', 'García López', 'ana.garcia@cesun.edu.mx', 
   '$2b$10$[hash_de_Ana123]', 'psicologo', '(614) 555-1234', true,
   NOW(), NOW());

-- Resultado: id=42, user_id=42

-- 2. Crear Disponibilidad - Lunes
INSERT INTO disponibilidades 
  (usuario_id, dia_semana, hora_inicio, hora_fin, 
   tipo_disponibilidad, activo, fecha_inicio_vigencia)
VALUES 
  (42, 'lunes', '08:00', '18:00', 'regular', true, NOW());
-- Resultado: id=100

-- 3. Crear Disponibilidad - Miércoles
INSERT INTO disponibilidades 
  (usuario_id, dia_semana, hora_inicio, hora_fin, 
   tipo_disponibilidad, activo, fecha_inicio_vigencia)
VALUES 
  (42, 'miercoles', '09:00', '15:00', 'regular', true, NOW());
-- Resultado: id=101

-- 4. Crear Disponibilidad - Viernes
INSERT INTO disponibilidades 
  (usuario_id, dia_semana, hora_inicio, hora_fin, 
   tipo_disponibilidad, activo, fecha_inicio_vigencia)
VALUES 
  (42, 'viernes', '08:00', '18:00', 'regular', true, NOW());
-- Resultado: id=102

-- 5. Actualizar Solicitud
UPDATE solicitudes_ingreso 
SET estado = 'APROBADA' 
WHERE id = 1;
```

**Email enviado a ana.garcia@cesun.edu.mx:**
```
Asunto: Bienvenido a PsicoGestión - Cuenta Creada

Hola Ana,

Tu solicitud de ingreso ha sido aprobada.

Datos de acceso:
Email: ana.garcia@cesun.edu.mx
Contraseña temporal: Ana123

Tu rol: Psicólogo

Por favor, cambia tu contraseña al primer inicio de sesión.

Disponibilidad registrada:
• Lunes: 08:00 - 18:00
• Miércoles: 09:00 - 15:00
• Viernes: 08:00 - 18:00

Saludos,
PsicoGestión Team
```

---

## 🔍 Consultas SQL Útiles

### 1. Ver todas las solicitudes pendientes
```sql
SELECT 
  id, nombre_completo, email, origen, 
  horas_a_liberar, estado, fecha_solicitud
FROM solicitudes_ingreso
WHERE estado = 'PENDIENTE'
ORDER BY fecha_solicitud DESC;
```

**Resultado:**
```
| id | nombre_completo        | email                  | origen   | horas | estado    | fecha_solicitud         |
|----|------------------------|------------------------|----------|-------|-----------|-------------------------|
| 2  | Carlos Mendoza R.      | carlos.mendoza@...     | EXTERNO  | 480   | PENDIENTE | 2026-02-05 14:30:22     |
| 1  | Ana García López       | ana.garcia@cesun.edu   | CESUN    | 600   | APROBADA  | 2026-02-05 10:15:00     |
```

---

### 2. Ver disponibilidades de un usuario
```sql
SELECT 
  d.dia_semana,
  d.hora_inicio,
  d.hora_fin,
  d.tipo_disponibilidad,
  d.activo,
  d.max_citas_dia
FROM disponibilidades d
WHERE d.usuario_id = 42
  AND d.activo = true
ORDER BY 
  FIELD(d.dia_semana, 'lunes', 'martes', 'miercoles', 
                      'jueves', 'viernes', 'sabado', 'domingo'),
  d.hora_inicio;
```

**Resultado:**
```
| dia_semana | hora_inicio | hora_fin | tipo_disponibilidad | activo | max_citas |
|------------|-------------|----------|---------------------|--------|-----------|
| lunes      | 08:00       | 18:00    | regular             | 1      | 8         |
| miercoles  | 09:00       | 15:00    | regular             | 1      | 8         |
| viernes    | 08:00       | 18:00    | regular             | 1      | 8         |
```

---

### 3. Disponibilidad horaria para programación de citas
```sql
SELECT 
  u.id,
  u.nombre,
  u.apellido,
  u.rol,
  d.dia_semana,
  d.hora_inicio,
  d.hora_fin,
  COUNT(c.id) as citas_agendadas_ese_dia,
  d.max_citas_dia - COUNT(c.id) as slots_disponibles
FROM users u
  INNER JOIN disponibilidades d ON u.id = d.usuario_id
  LEFT JOIN citas c ON u.id = c.psicologo_id 
    AND DAYNAME(c.fecha) = UPPER(d.dia_semana)
    AND DATE(c.fecha) = CURDATE()
WHERE u.rol = 'psicologo'
  AND d.activo = true
  AND u.activo = true
GROUP BY u.id, d.dia_semana
HAVING slots_disponibles > 0
ORDER BY d.dia_semana, d.hora_inicio;
```

**Resultado:**
```
| usuario_id | nombre | rol      | dia_semana | hora_inicio | citas_hoy | slots |
|------------|--------|----------|------------|-------------|-----------|-------|
| 42         | Ana    | psicologo| lunes      | 08:00       | 3         | 5     |
| 42         | Ana    | psicologo| miercoles  | 09:00       | 1         | 7     |
| 42         | Ana    | psicologo| viernes    | 08:00       | 2         | 6     |
```

---

### 4. Validar horario antes de agendar cita
```sql
SELECT 
  d.id,
  d.hora_inicio,
  d.hora_fin,
  TIME('09:30') as hora_solicitada,
  CASE 
    WHEN TIME('09:30') BETWEEN d.hora_inicio AND d.hora_fin 
      THEN 'DISPONIBLE'
    ELSE 'NO DISPONIBLE'
  END as resultado
FROM disponibilidades d
WHERE d.usuario_id = 42
  AND d.dia_semana = 'miercoles'
  AND d.activo = true;
```

**Resultado:**
```
| id  | hora_inicio | hora_fin | hora_solicitada | resultado       |
|-----|-------------|----------|-----------------|-----------------|
| 101 | 09:00       | 15:00    | 09:30          | DISPONIBLE      |
```

---

### 5. Ver solicitudes por estado
```sql
SELECT 
  estado,
  COUNT(*) as total,
  GROUP_CONCAT(nombre_completo SEPARATOR ', ') as solicitantes
FROM solicitudes_ingreso
GROUP BY estado;
```

**Resultado:**
```
| estado    | total | solicitantes                                |
|-----------|-------|---------------------------------------------|
| PENDIENTE | 1     | Carlos Mendoza Rodríguez                    |
| APROBADA  | 1     | Ana García López                            |
| RECHAZADA | 0     | (vacío)                                     |
```

---

### 6. Disponibilidad JSON en solicitud
```sql
SELECT 
  id,
  nombre_completo,
  disponibilidad_horaria,
  JSON_EXTRACT(disponibilidad_horaria, '$[0].dia_semana') as primer_dia,
  JSON_EXTRACT(disponibilidad_horaria, '$[0].hora_inicio') as primer_dia_inicio
FROM solicitudes_ingreso
WHERE id = 1;
```

**Resultado:**
```
| id | nombre_completo  | disponibilidad_horaria                | primer_dia | primer_dia_inicio |
|----|------------------|---------------------------------------|------------|------------------|
| 1  | Ana García López | [{"dia":"lunes","inicio":"08:00"...] | "lunes"    | "08:00"          |
```

---

### 7. Usuarios con más horas disponibles
```sql
SELECT 
  u.id,
  u.nombre,
  u.apellido,
  u.rol,
  COUNT(DISTINCT d.dia_semana) as dias_disponibles,
  SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(d.hora_fin, d.hora_inicio)))) as horas_totales
FROM users u
  INNER JOIN disponibilidades d ON u.id = d.usuario_id
WHERE d.activo = true
  AND u.activo = true
GROUP BY u.id
ORDER BY horas_totales DESC;
```

**Resultado:**
```
| id | nombre | rol       | dias | horas_totales |
|----|--------|-----------|------|---------------|
| 42 | Ana    | psicologo | 3    | 24:00:00      |
| 45 | Carlos | psicologo | 5    | 30:00:00      |
```

---

### 8. Calendarios de disponibilidad por semana
```sql
SELECT 
  u.nombre,
  SUM(CASE WHEN d.dia_semana = 'lunes' THEN 1 ELSE 0 END) as lunes,
  SUM(CASE WHEN d.dia_semana = 'martes' THEN 1 ELSE 0 END) as martes,
  SUM(CASE WHEN d.dia_semana = 'miercoles' THEN 1 ELSE 0 END) as miercoles,
  SUM(CASE WHEN d.dia_semana = 'jueves' THEN 1 ELSE 0 END) as jueves,
  SUM(CASE WHEN d.dia_semana = 'viernes' THEN 1 ELSE 0 END) as viernes,
  SUM(CASE WHEN d.dia_semana = 'sabado' THEN 1 ELSE 0 END) as sabado,
  SUM(CASE WHEN d.dia_semana = 'domingo' THEN 1 ELSE 0 END) as domingo
FROM users u
  LEFT JOIN disponibilidades d ON u.id = d.usuario_id 
    AND d.activo = true
WHERE u.activo = true
GROUP BY u.id;
```

**Resultado:**
```
| nombre | lunes | martes | miercoles | jueves | viernes | sabado | domingo |
|--------|-------|--------|-----------|--------|---------|--------|---------|
| Ana    | 1     | 0      | 1         | 0      | 1       | 0      | 0       |
| Carlos | 1     | 1      | 1         | 1      | 1       | 0      | 0       |
```

---

## 🔄 Integraciones Sugeridas

### 1. Sistema de Citas
```javascript
// Al agendar cita, validar disponibilidad
const validarDisponibilidad = async (psicologoId, fecha, hora) => {
  const dayName = getDayName(fecha); // 'lunes', 'martes', etc.
  
  const disponibilidad = await Disponibilidad.findOne({
    where: {
      usuario_id: psicologoId,
      dia_semana: dayName,
      activo: true
    }
  });
  
  if (!disponibilidad) {
    throw new Error('Psicólogo no disponible ese día');
  }
  
  if (hora < disponibilidad.hora_inicio || 
      hora > disponibilidad.hora_fin) {
    throw new Error('Hora fuera de disponibilidad');
  }
  
  return true;
};
```

### 2. Dashboard de Coordinador
```javascript
// Mostrar solicitudes con disponibilidad parseada
const solicitudes = await Solicitud.findAll({
  where: { estado: 'PENDIENTE' }
});

const solicitudesConDatos = solicitudes.map(s => ({
  id: s.id,
  nombre: s.nombre_completo,
  disponibilidad: JSON.parse(s.disponibilidad_horaria),
  dias: JSON.parse(s.disponibilidad_horaria).length
}));
```

### 3. Reportes de Disponibilidad
```javascript
// Generar reporte de cobertura
const coverage = await sequelize.query(`
  SELECT 
    d.dia_semana,
    COUNT(DISTINCT d.usuario_id) as psicologos_disponibles,
    MIN(d.hora_inicio) as apertura_mas_temprana,
    MAX(d.hora_fin) as cierre_mas_tarde
  FROM disponibilidades d
  WHERE d.activo = true
  GROUP BY d.dia_semana
  ORDER BY FIELD(...)
`);
```

---

## 📊 Estadísticas

### Ejemplo de Análisis

```sql
-- Cobertura por día de la semana
SELECT 
  d.dia_semana,
  COUNT(DISTINCT d.usuario_id) as profesionales,
  MIN(d.hora_inicio) as primer_horario,
  MAX(d.hora_fin) as ultimo_horario,
  SEC_TO_TIME(AVG(TIME_TO_SEC(TIMEDIFF(d.hora_fin, d.hora_inicio)))) 
    as horas_promedio
FROM disponibilidades d
WHERE d.activo = true
GROUP BY d.dia_semana
ORDER BY FIELD(d.dia_semana, 'lunes', 'martes', 'miercoles', 
                              'jueves', 'viernes', 'sabado', 'domingo');
```

**Resultado:**
```
| dia_semana | profesionales | primer_horario | ultimo_horario | horas_promedio |
|------------|---------------|----------------|----------------|----------------|
| lunes      | 2             | 08:00          | 18:00          | 10:00:00       |
| martes     | 1             | 10:00          | 16:00          | 06:00:00       |
| miercoles  | 2             | 09:00          | 15:00          | 09:30:00       |
| jueves     | 1             | 10:00          | 16:00          | 06:00:00       |
| viernes    | 2             | 08:00          | 18:00          | 10:00:00       |
| sabado     | 0             | NULL           | NULL           | NULL           |
| domingo    | 0             | NULL           | NULL           | NULL           |
```

