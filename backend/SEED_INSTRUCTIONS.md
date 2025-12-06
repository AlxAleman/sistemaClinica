# Instrucciones para Generar Datos Dummy

Este documento explica cómo generar datos de prueba (dummy data) para visualizar el funcionamiento completo del sistema y todas las relaciones entre entidades.

## ¿Qué datos se generan?

El script de seed crea:

- **10 Pacientes** con perfiles médicos completos
- **3 Terapeutas** con horarios de disponibilidad
- **12 Citas** con diferentes estados (programadas, confirmadas, completadas, canceladas)
- **8 Sesiones de Tratamiento** (algunas asociadas a citas, otras independientes)
- **10 Evaluaciones** (iniciales, de progreso y finales)
- **4 Planes de Tratamiento** con diferentes estados y progreso
- **3 Documentos Médicos** de ejemplo

## Cómo ejecutar el seed

### Opción 1: Comando directo (Recomendado)

```bash
cd backend
npm run seed
```

### Opción 2: Con Prisma directamente

```bash
cd backend
npx ts-node prisma/seed.ts
```

## Requisitos previos

1. **Base de datos configurada**: Asegúrate de que PostgreSQL esté corriendo y que la variable `DATABASE_URL` en `.env` esté correctamente configurada.

2. **Migraciones ejecutadas**: Las tablas deben existir en la base de datos:
   ```bash
   npm run prisma:migrate
   ```

3. **Cliente Prisma generado**:
   ```bash
   npm run prisma:generate
   ```

## Comportamiento del seed

- **Idempotente**: El script verifica si los datos ya existen antes de crearlos, evitando duplicados.
- **Relaciones coherentes**: Todas las relaciones entre entidades están correctamente establecidas:
  - Las citas están asociadas a pacientes y terapeutas existentes
  - Las sesiones están relacionadas con citas completadas o son independientes
  - Las evaluaciones están asociadas a pacientes
  - Los planes de tratamiento están vinculados a pacientes
  - Los documentos médicos pertenecen a pacientes

## Datos generados

### Pacientes
- 10 pacientes con información completa (nombre, email, teléfono, DUI, género, fecha de nacimiento, dirección, contacto de emergencia)
- Cada paciente tiene un perfil médico con alergias, historial médico, medicamentos actuales y notas

### Terapeutas
- 3 terapeutas con especialidades diferentes:
  - Dr. Carlos Méndez - Fisioterapia Deportiva
  - Dra. Ana Martínez - Fisioterapia Neurológica
  - Lic. Roberto Silva - Fisioterapia Ortopédica
- Cada terapeuta tiene horarios de disponibilidad configurados

### Citas
- Citas distribuidas en diferentes fechas (hoy, mañana, próxima semana)
- Diferentes estados: SCHEDULED, CONFIRMED, COMPLETED, CANCELLED
- Varias duraciones (30, 45, 60, 90 minutos)

### Sesiones de Tratamiento
- 5 sesiones asociadas a citas completadas
- 3 sesiones independientes (no asociadas a citas)
- Cada sesión incluye: intervenciones, progreso, nivel de dolor, notas

### Evaluaciones
- 5 evaluaciones iniciales (con datos de dolor alto, limitaciones funcionales)
- 3 evaluaciones de progreso (mostrando mejoría)
- 2 evaluaciones finales (con recuperación completa)

### Planes de Tratamiento
- 4 planes con diferentes estados:
  - 1 en DRAFT
  - 1 APPROVED (sin sesiones completadas)
  - 1 IN_PROGRESS (8/10 sesiones completadas)
  - 1 COMPLETED (10/10 sesiones completadas)

### Documentos Médicos
- 3 documentos de ejemplo (Radiografía, Resonancia Magnética, Análisis de Sangre)

## Verificar los datos

Después de ejecutar el seed, puedes verificar los datos de varias formas:

1. **Prisma Studio** (interfaz visual):
   ```bash
   npm run prisma:studio
   ```
   Esto abrirá una interfaz web donde puedes explorar todas las tablas y relaciones.

2. **Frontend**: Inicia el frontend y navega por las diferentes secciones:
   - Dashboard
   - Pacientes
   - Citas
   - Sesiones
   - Planes de Tratamiento
   - Evaluaciones

3. **API directamente**: Puedes hacer peticiones a los endpoints del backend para verificar los datos.

## Limpiar datos (Opcional)

Si necesitas limpiar todos los datos y empezar de nuevo:

```bash
# ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos
npx prisma migrate reset
```

Esto eliminará todas las tablas, las recreará y ejecutará el seed automáticamente.

## Notas importantes

- El seed está diseñado para desarrollo y testing. **NO ejecutes esto en producción**.
- Los datos generados son ficticios y solo para propósitos de demostración.
- El script es idempotente, por lo que puedes ejecutarlo múltiples veces sin crear duplicados.

