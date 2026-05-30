# Bitácora de Cambios — Clínica Gestor

---

## 2026-05-30

### Entorno local — Setup inicial
- Limpieza completa de Docker (contenedores, volúmenes e imágenes de proyecto anterior `plugnmeet-server`)
- Levantamiento de PostgreSQL `clinica-db` vía `docker compose up -d` (puerto 5433)
- Resolución de conflicto en migraciones de Prisma: la migración `20260511190747_init_full_schema` intentaba recrear enums ya existentes. Se usó `prisma db push --force-reset` como workaround para entorno de desarrollo
- Ejecución de seed: 8 pacientes, 3 terapistas, 56 citas, 22 sesiones, 8 planes de tratamiento
- Instalación de dependencia faltante `busboy` requerida por `multer@1.4.5-lts.2`

### Fix: actualización de pacientes devolvía 400 en producción (Railway)
**Causa:** El formulario de edición inicializaba `email: patient.email || ""`. Cuando el paciente no tenía email, se enviaba `""` al backend. Zod v4 rechaza `""` contra `.email()` aunque el campo sea `.optional().nullable()`.

**Archivos modificados:**
- `frontend/app/dashboard/patients/[id]/edit/page.tsx` — todos los campos opcionales se inicializan como `null` en lugar de `""`
- `backend/src/utils/validators.ts` — `updatePatientSchema` extiende con `z.union([z.string().email(), z.literal(''), z.null()]).transform(...)` para email y acepta cualquier string en `photoUrl`
- `backend/src/services/patientService.ts` — `updatePatient` ahora distingue entre `undefined` (no cambiar el campo) y `null` (limpiar el campo en BD), corrigiendo el bug donde borrar el email/DUI nunca surtía efecto

### Fix: carácter corrupto en base de datos
- `Carlos Ramírez` tenía la `í` almacenada como U+FFFD (carácter de reemplazo) por un problema de encoding al ejecutar el seed en Windows
- Corregido con `UPDATE "Patient" SET name = 'Carlos Ramírez' WHERE encode(name::bytea,'hex') LIKE '%efbfbd%'`

### Feature: filtros en listado de pacientes
**Archivo:** `frontend/app/dashboard/patients/page.tsx`

Nuevos controles de filtrado sobre la tabla de pacientes:
- **Ordenar** (dropdown): Apellido A→Z (default), Apellido Z→A, Nombre A→Z, Nombre Z→A, Más recientes, Más antiguos
- **Género** (pills): Todos / Masculino / Femenino
- **Estado** (pills): Todos / Activos / Inactivos
- Botón "Limpiar" que aparece solo cuando hay filtros activos
- Contador de pacientes totales en el extremo derecho

El ordenamiento por apellido extrae la última palabra del nombre y ordena client-side. Los filtros de género e isActive se envían al backend.

**Backend ajustado para soportar los filtros:**
- `backend/src/services/patientService.ts` — agrega parámetros `gender`, `sortBy`, `sortOrder`
- `backend/src/controllers/patientController.ts` — parsea y pasa `isActive`, `gender`, `sortBy`, `sortOrder` desde el query
- `frontend/services/patientService.ts` — tipos actualizados con los nuevos parámetros

### Feature: toggle activo/inactivo en edición de pacientes
**Archivo:** `frontend/app/dashboard/patients/[id]/edit/page.tsx`

- Se agrega campo `isActive` al formulario de edición con un toggle switch visual
- Muestra descripción del estado: "aparece en búsquedas" vs "archivado"
- Badge verde/gris confirma el estado visualmente
