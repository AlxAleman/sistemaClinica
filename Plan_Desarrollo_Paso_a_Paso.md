# PLAN DE DESARROLLO PASO A PASO
## Sistema de Gestión Clínica - Fisioterapia

**Objetivo:** Llevar el proyecto de 0 a producción enfocándose solo en desarrollo

---

## ÍNDICE
1. [Stack Tecnológico Final](#stack-tecnológico-final)
2. [Setup Inicial](#setup-inicial)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Desarrollo por Sprints](#desarrollo-por-sprints)
5. [Checklist de Tareas](#checklist-de-tareas)

---

## STACK TECNOLÓGICO FINAL

### Backend
```
Node.js 18+ LTS
├── Express.js v4
├── TypeScript
├── Prisma ORM (gestión de BD)
├── JWT (autenticación)
├── Zod (validación)
├── Bull (colas de tareas - notificaciones)
├── Winston (logging)
├── Axios (HTTP requests)
└── dotenv (variables de entorno)
```

### Frontend
```
React 18+
├── TypeScript
├── Next.js 14+ (SSR)
├── TailwindCSS
├── Zustand (state management)
├── React Query (data fetching)
├── React Calendar / FullCalendar
├── Axios (HTTP client)
└── react-hot-toast (notificaciones)
```

### Base de Datos
```
PostgreSQL 14+
├── Prisma Migrations
└── pgBackRest (backups)
```

### Infraestructura
```
Docker + Docker Compose (local y producción)
AWS
├── EC2 (servidor)
├── RDS PostgreSQL (base de datos)
├── S3 (almacenamiento de documentos)
└── Route53 (DNS)
```

### Integraciones
```
WhatsApp Business API (notificaciones y citas)
SendGrid (emails)
```

---

## SETUP INICIAL

### Paso 1: Preparación del Entorno Local

#### 1.1 Instalar herramientas necesarias
```bash
# Node.js 18+ LTS
# PostgreSQL 14+
# Docker Desktop
# Git
# VSCode con extensiones:
# - Prisma
# - Thunder Client o Insomnia (para probar APIs)
# - ES7+ React/Redux/React-Native snippets
```

#### 1.2 Crear estructura de carpetas
```bash
mkdir clinica-fisioterapia
cd clinica-fisioterapia

# Backend
mkdir backend
cd backend
npm init -y
npm install express typescript ts-node @types/node @types/express dotenv prisma @prisma/client zod axios

# Frontend (Next.js crea su propia estructura)
cd ..
npx create-next-app@latest frontend --typescript --tailwind --app

# Raíz
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
```

#### 1.3 Crear archivos base
```bash
# Backend
backend/src/index.ts
backend/prisma/schema.prisma
backend/.env
backend/tsconfig.json
backend/package.json

# Frontend
frontend/.env.local
```

---

## ESTRUCTURA DEL PROYECTO

### Estructura Backend (Node.js + Express)

```
backend/
├── src/
│   ├── index.ts                 # Punto de entrada
│   ├── config/
│   │   ├── database.ts          # Configuración Prisma
│   │   ├── env.ts              # Variables de entorno
│   │   └── cors.ts             # Configuración CORS
│   ├── middleware/
│   │   ├── auth.ts             # JWT middleware
│   │   ├── errorHandler.ts     # Manejo de errores
│   │   ├── logger.ts           # Logging
│   │   └── validation.ts       # Validación con Zod
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── patientController.ts
│   │   ├── appointmentController.ts
│   │   ├── sessionController.ts
│   │   ├── evaluationController.ts
│   │   ├── treatmentPlanController.ts
│   │   ├── therapistController.ts
│   │   ├── notificationController.ts
│   │   └── reportController.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── patients.ts
│   │   ├── appointments.ts
│   │   ├── sessions.ts
│   │   ├── evaluations.ts
│   │   ├── treatmentPlans.ts
│   │   ├── therapists.ts
│   │   ├── notifications.ts
│   │   └── reports.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── patientService.ts
│   │   ├── appointmentService.ts
│   │   ├── notificationService.ts
│   │   └── reportService.ts
│   ├── utils/
│   │   ├── jwt.ts              # Manejo de JWT
│   │   ├── hash.ts             # Hashing de contraseñas
│   │   ├── validators.ts       # Schemas Zod
│   │   └── constants.ts        # Constantes globales
│   └── types/
│       └── index.ts            # Types TypeScript globales
├── prisma/
│   ├── schema.prisma           # Definición de BD
│   └── migrations/             # Historial de migraciones
├── .env                        # Variables de entorno
├── .env.example                # Template de env
├── tsconfig.json              # Configuración TypeScript
├── package.json               # Dependencias
└── Dockerfile                 # Para containerizar

```

### Estructura Frontend (Next.js + React)

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout global
│   │   ├── page.tsx            # Home
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx      # Layout protegido
│   │   │   ├── page.tsx        # Dashboard principal
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx    # Listado pacientes
│   │   │   │   ├── [id]/page.tsx # Detalle paciente
│   │   │   │   └── new/page.tsx # Crear paciente
│   │   │   ├── appointments/
│   │   │   │   ├── page.tsx    # Calendario citas
│   │   │   │   └── new/page.tsx # Nueva cita
│   │   │   ├── sessions/
│   │   │   │   ├── page.tsx    # Listado sesiones
│   │   │   │   └── [id]/page.tsx # Registrar sesión
│   │   │   ├── evaluations/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── treatment-plans/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── therapists/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── patients-report/page.tsx
│   │   │   │   ├── sessions-report/page.tsx
│   │   │   │   └── financial-report/page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── (otros endpoints si es necesario)
│   │   └── error.tsx           # Error boundary
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── Card.tsx
│   │   ├── forms/
│   │   │   ├── PatientForm.tsx
│   │   │   ├── AppointmentForm.tsx
│   │   │   ├── SessionForm.tsx
│   │   │   ├── EvaluationForm.tsx
│   │   │   └── TreatmentPlanForm.tsx
│   │   ├── tables/
│   │   │   ├── PatientTable.tsx
│   │   │   ├── AppointmentTable.tsx
│   │   │   ├── SessionTable.tsx
│   │   │   └── ReportTable.tsx
│   │   ├── charts/
│   │   │   ├── PainChart.tsx
│   │   │   ├── AttendanceChart.tsx
│   │   │   └── IncomeChart.tsx
│   │   └── calendar/
│   │       └── AppointmentCalendar.tsx
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth context
│   │   ├── useApi.ts           # Fetch wrapper
│   │   ├── useForm.ts          # Form handling
│   │   └── useNotification.ts  # Notificaciones
│   ├── store/
│   │   ├── authStore.ts        # Zustand auth
│   │   ├── patientStore.ts
│   │   ├── appointmentStore.ts
│   │   └── notificationStore.ts
│   ├── services/
│   │   ├── api.ts              # Configuración Axios
│   │   ├── authService.ts
│   │   ├── patientService.ts
│   │   ├── appointmentService.ts
│   │   ├── sessionService.ts
│   │   └── reportService.ts
│   ├── types/
│   │   └── index.ts            # Types compartidos
│   ├── utils/
│   │   ├── formatters.ts       # Formateo de datos
│   │   ├── validators.ts       # Validaciones cliente
│   │   └── constants.ts        # Constantes
│   └── styles/
│       └── globals.css         # Estilos globales
├── public/
│   ├── images/
│   └── icons/
├── .env.local                  # Variables local
├── .env.example                # Template
├── tsconfig.json              # TypeScript config
├── next.config.js             # Configuración Next
├── tailwind.config.ts         # Tailwind config
├── postcss.config.js          # PostCSS config
└── package.json               # Dependencias
```

---

## DESARROLLO POR SPRINTS

### SPRINT 1: Setup y Autenticación (Semana 1-2)

#### Backend
- [ ] Inicializar proyecto Node.js + Express + TypeScript
- [ ] Configurar variables de entorno (.env)
- [ ] Conectar a PostgreSQL con Prisma
- [ ] Crear schema básico (Users, Patients)
- [ ] Implementar JWT (login, logout, refresh token)
- [ ] Crear middleware de autenticación
- [ ] Rutas: POST /auth/login, POST /auth/register, POST /auth/logout
- [ ] Hashear contraseñas con bcrypt
- [ ] Testing básico de endpoints

#### Frontend
- [ ] Crear proyecto Next.js con TypeScript + Tailwind
- [ ] Configurar estructura de carpetas
- [ ] Crear store Zustand para auth
- [ ] Página de login (formulario básico)
- [ ] Página de registro (formulario básico)
- [ ] Protección de rutas (middleware)
- [ ] Configurar Axios con interceptores para JWT
- [ ] Testing de flujos auth

#### Base de Datos
- [ ] Crear tablas: Users, Patients, MedicalProfiles
- [ ] Índices en email y teléfono
- [ ] Migraciones con Prisma

---

### SPRINT 2: Gestión de Pacientes (Semana 3-4)

#### Backend
- [ ] CRUD completo de pacientes (POST, GET, PUT, DELETE)
- [ ] Validación de datos con Zod
- [ ] Búsqueda de pacientes por nombre, DUI, teléfono
- [ ] Subida de documentos médicos a S3
- [ ] Endpoints:
  - POST /patients (crear)
  - GET /patients (listar con filtros)
  - GET /patients/:id (detalle)
  - PUT /patients/:id (actualizar)
  - POST /patients/:id/documents (subir doc)
  - GET /patients/:id/documents (listar docs)
  - DELETE /patients/:id/documents/:docId (eliminar doc)

#### Frontend
- [ ] Formulario de creación/edición de pacientes
- [ ] Tabla de listado de pacientes
- [ ] Vista detallada de paciente
- [ ] Carga de documentos médicos
- [ ] Búsqueda y filtros
- [ ] Integración con API backend

#### Base de Datos
- [ ] Tabla MedicalDocuments
- [ ] Tabla MedicalProfiles (alergias, historial, medicamentos)

---

### SPRINT 3: Sistema de Citas + Google Calendar (Semana 5-8)

#### Backend
- [ ] Crear tabla Appointments, TherapistAvailability
- [ ] CRUD de citas
- [ ] Validar disponibilidad de terapeutas
- [ ] Gestión de confirmaciones
- [ ] **NUEVO: Integración con Google Calendar**
  - [ ] Instalar `googleapis` y `google-auth-library`: `npm install googleapis google-auth-library`
  - [ ] Crear `src/config/googleCalendar.ts`:
    - Cargar credenciales del JSON
    - Crear cliente JWT de Google
    - Exportar cliente de Google Calendar API
  - [ ] Crear `src/services/googleCalendarService.ts` con funciones:
    - `createClinicCalendarEvent()` - Crear evento en Google Calendar de clínica
    - `createPatientCalendarEvent()` - Crear evento en Google Calendar del paciente
    - `updateCalendarEvent()` - Actualizar eventos en ambos calendarios
    - `deleteCalendarEvent()` - Eliminar eventos en ambos calendarios
    - `getTherapistAvailability()` - Obtener disponibilidad desde Google Calendar
  - [ ] Actualizar schema Prisma: agregar campos `googleEventClinic` y `googleEventPatient` a modelo Appointment
  - [ ] Ejecutar migración: `npx prisma migrate dev --name add_google_calendar_ids`
- [ ] Endpoints:
  - POST /appointments (crear cita + sincronizar a Google Calendar automáticamente)
  - GET /appointments (listar todas)
  - GET /appointments/calendar?date=YYYY-MM-DD (vista calendario por día)
  - PUT /appointments/:id (actualizar + sincronizar cambios)
  - DELETE /appointments/:id (cancelar + eliminar de Google Calendar)
  - POST /appointments/:id/confirm (confirmar cita)
  - GET /therapists/:id/availability (disponibilidad)
  - PUT /therapists/:id/availability (actualizar disponibilidad)
- [ ] Testing de endpoints con Thunder Client/Postman

#### Frontend
- [ ] **NUEVO: Instalar dependencias de calendario**
  - `npm install react-big-calendar moment`
  - `npm install react-hot-toast` (para notificaciones de éxito/error)
- [ ] **NUEVO: Componente de Calendario Sincronizado**
  - [ ] Crear `components/calendar/AppointmentCalendar.tsx`:
    - Usar react-big-calendar para visualizar eventos
    - Mostrar eventos sincronizados automáticamente
    - Mostrar información: nombre paciente, terapeuta, estado, horario
    - Permitir seleccionar horario para crear cita
    - Permitir hacer click en evento para ver detalles
  - [ ] Estilos con TailwindCSS
- [ ] **NUEVA: Formulario mejorado de crear cita**
  - [ ] Crear `components/forms/AppointmentForm.tsx`:
    - Selector de paciente
    - Selector de terapeuta
    - Picker de fecha y hora
    - Selector de duración (15, 30, 45, 60 min)
    - Botón "Crear Cita" que sincroniza a Google Calendar
    - Mostrar toast: "✅ Cita creada y sincronizada a Google Calendar"
    - En caso de error, mostrar: "❌ Error al crear cita"
- [ ] Tabla de citas con acciones (editar, cancelar)
- [ ] Vista de citas del día/semana/mes
- [ ] Confirmación de citas (UI para confirmar asistencia)
- [ ] Gestión de disponibilidad de terapeutas (admin) - asignar horarios
- [ ] Integración con API backend mediante axios
- [ ] **NUEVO: Hook personalizado**
  - [ ] Crear `hooks/useGoogleCalendar.ts`:
    - `syncToGoogleCalendar(appointmentId)` - Sincronizar cita específica
    - `getGoogleCalendarEvents(date)` - Obtener eventos de Google Calendar

#### Base de Datos (Prisma Schema)
```prisma
model Appointment {
  id                    String   @id @default(cuid())
  patientId             String
  patient               Patient  @relation(fields: [patientId], references: [id])
  therapistId           String
  therapist             Therapist @relation(fields: [therapistId], references: [id])
  appointmentDate       DateTime
  duration              Int      // en minutos
  status                String   @default("scheduled")
  
  // Google Calendar IDs
  googleEventClinic     String?  // ID del evento en calendario clínica
  googleEventPatient    String?  // ID del evento en calendario paciente
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([patientId])
  @@index([therapistId])
  @@index([appointmentDate])
}

model Patient {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  phone         String
  appointments  Appointment[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Therapist {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  appointments  Appointment[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Configuración Externa (Pre-requisitos)
- [ ] **NUEVO: Google Cloud Setup**
  1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
  2. Crear nuevo proyecto: "Sistema Clínica Fisioterapia"
  3. Habilitar Google Calendar API
  4. Crear Service Account (cuenta de servicio)
  5. Generar clave privada (JSON)
  6. Descargar JSON y guardar en: `backend/google-credentials.json`
  7. Crear calendario en Gmail: "Citas Clínica" con email clínica@clinica.com
  8. Compartir calendario con el email del Service Account
  9. Asignar permisos: "Hacer cambios en eventos"
  
#### Variables de Entorno (.env backend)
```env
# Google Calendar
CLINIC_CALENDAR_ID="citas@clinicafisioterapia.com"
GOOGLE_CREDENTIALS_PATH="./google-credentials.json"

# Otros (ya existentes)
DATABASE_URL="postgresql://user:password@localhost:5432/clinica"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
```

#### Archivos a Crear/Modificar (Detalle)

**Backend:**
1. `backend/src/config/googleCalendar.ts` - Cliente de Google Calendar
2. `backend/src/services/googleCalendarService.ts` - Servicios de sincronización
3. `backend/src/controllers/appointmentController.ts` - Actualizar controller
4. `backend/src/routes/appointments.ts` - Actualizar rutas
5. `backend/prisma/schema.prisma` - Agregar campos de Google
6. `backend/.env` - Agregar variables de Google
7. `backend/google-credentials.json` - Credenciales (NO COMMITEAR)

**Frontend:**
1. `frontend/src/components/calendar/AppointmentCalendar.tsx` - Calendario
2. `frontend/src/components/forms/AppointmentForm.tsx` - Formulario de cita
3. `frontend/src/hooks/useGoogleCalendar.ts` - Hook personalizado
4. `frontend/src/app/dashboard/appointments/page.tsx` - Página de citas

#### Testing del Sprint
- [ ] Crear cita → Verificar en BD
- [ ] Crear cita → Verificar que aparece en Google Calendar Clínica
- [ ] Crear cita → Verificar que aparece en Google Calendar Paciente
- [ ] Editar cita → Verificar cambios en ambos calendarios
- [ ] Cancelar cita → Verificar que desaparece de ambos calendarios
- [ ] Verificar que campos googleEventClinic y googleEventPatient se populan
- [ ] Verificar reminders automáticos (24h antes, 2h antes)
- [ ] Testing responsive en mobile/tablet

---

### SPRINT 4: Notificaciones WhatsApp (Semana 7-8)

#### Backend
- [ ] Integración con WhatsApp Business API
- [ ] Queue de tareas con Bull
- [ ] Envío de confirmaciones
- [ ] Recordatorios 24h antes
- [ ] Recordatorios 2h antes
- [ ] Servicio de notificaciones
- [ ] Endpoints:
  - GET /notifications (historial)
  - POST /notifications/test (envío de prueba)

#### Frontend
- [ ] Mostrar estado de notificaciones (enviadas, pendientes)
- [ ] Vista de historial de notificaciones

#### Base de Datos
- [ ] Tabla Reminders (registro de notificaciones)

---

### SPRINT 5: Sesiones Clínicas (Semana 9-10)

#### Backend
- [ ] CRUD de sesiones realizadas
- [ ] Registro de asistencia
- [ ] Registro de intervenciones y progreso
- [ ] Actualización de expediente
- [ ] Endpoints:
  - POST /sessions (registrar sesión)
  - GET /sessions (listar)
  - GET /sessions/:id (detalle)
  - PUT /sessions/:id (actualizar)
  - GET /patients/:patientId/sessions (sesiones del paciente)

#### Frontend
- [ ] Formulario de registro de sesión
- [ ] Tabla de sesiones completadas
- [ ] Histórico de progreso por paciente
- [ ] Gráficos de evolución (dolor, movilidad)
- [ ] Integración con API

#### Base de Datos
- [ ] Tabla TreatmentSessions
- [ ] Tabla Evaluations (evaluaciones de progreso)

---

### SPRINT 6: Planes de Tratamiento (Semana 11-12)

#### Backend
- [ ] CRUD de planes de tratamiento
- [ ] Cálculo de sesiones y costos
- [ ] Validación de planes
- [ ] Endpoints:
  - POST /treatment-plans (crear)
  - GET /treatment-plans (listar)
  - GET /treatment-plans/:id (detalle)
  - PUT /treatment-plans/:id (actualizar)
  - POST /treatment-plans/:id/approve (aprobar por paciente)

#### Frontend
- [ ] Formulario de creación de plan
- [ ] Vista del plan con detalles
- [ ] Presentación visual del plan al paciente
- [ ] Opción de confirmación/modificación
- [ ] Integración con API

#### Base de Datos
- [ ] Tabla TreatmentPlans

---

### SPRINT 7: Evaluaciones y Re-evaluaciones (Semana 13-14)

#### Backend
- [ ] CRUD de evaluaciones
- [ ] Comparación de evaluaciones (inicial vs final)
- [ ] Cálculo de progreso
- [ ] Endpoints:
  - POST /evaluations (crear)
  - GET /evaluations (listar)
  - GET /evaluations/:id (detalle)
  - GET /patients/:patientId/evaluations/comparison (comparar inicial/final)

#### Frontend
- [ ] Formulario de evaluación
- [ ] Vista de resultados con gráficos
- [ ] Comparativa visual (antes/después)
- [ ] Integración con API

#### Base de Datos
- [ ] Tabla Evaluations (mejorada)

---

### SPRINT 8: Reportes y Dashboard (Semana 15-16)

#### Backend
- [ ] Dashboard KPIs
  - Pacientes activos
  - Sesiones del día/semana/mes
  - Tasa de asistencia
  - Ingresos
- [ ] Reportes:
  - Pacientes (listado, estado)
  - Sesiones (completadas vs canceladas)
  - Progreso clínico
- [ ] Endpoints:
  - GET /reports/dashboard (KPIs)
  - GET /reports/patients (reporte pacientes)
  - GET /reports/sessions (reporte sesiones)
  - GET /reports/clinical-progress (reporte progreso)
  - GET /reports/export/:type (exportar CSV/PDF)

#### Frontend
- [ ] Dashboard con KPIs en cards
- [ ] Gráficos (asistencia, progreso, ingresos)
- [ ] Tabla de reportes
- [ ] Filtros avanzados
- [ ] Descarga de reportes (CSV, PDF)
- [ ] Integración con API

---

### SPRINT 9: Pre-Registro por WhatsApp (Semana 17-18)

#### Backend
- [ ] Bot de WhatsApp conversacional
- [ ] Recopilación de información del paciente
- [ ] Guardar pre-registro
- [ ] Convertir pre-registro a paciente
- [ ] Endpoints:
  - POST /pre-registrations (crear desde WhatsApp)
  - GET /pre-registrations (listar)
  - POST /pre-registrations/:id/convert (convertir a paciente)
  - PUT /pre-registrations/:id (actualizar)

#### Frontend
- [ ] Vista de pre-registros (admin)
- [ ] Botón para convertir a paciente
- [ ] Integración con API

#### Base de Datos
- [ ] Tabla PreRegistrations

---

### SPRINT 10: Portal de Pacientes (Semana 19-20)

#### Backend
- [ ] Endpoints adicionales para pacientes
  - GET /patients/me (yo mismo)
  - GET /patients/me/appointments (mis citas)
  - GET /patients/me/sessions (mis sesiones)
  - GET /patients/me/progress (mi progreso)

#### Frontend
- [ ] Página dashboard para pacientes
- [ ] Ver mis citas próximas
- [ ] Ver historial de sesiones
- [ ] Ver mi progreso clínico
- [ ] Perfil personal

---

### SPRINT 11: Gestión de Terapeutas (Semana 21-22)

#### Backend
- [ ] CRUD de terapeutas
- [ ] Asignación de horarios y salas
- [ ] Endpoints:
  - POST /therapists (crear)
  - GET /therapists (listar)
  - GET /therapists/:id (detalle)
  - PUT /therapists/:id (actualizar)
  - POST /therapists/:id/availability (asignar disponibilidad)

#### Frontend
- [ ] Gestión de terapeutas (admin)
- [ ] Asignación de horarios
- [ ] Vista de carga de trabajo
- [ ] Integración con API

---

### SPRINT 12: Pulido y Testing (Semana 23-24)

#### Backend
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] API testing (Postman/Thunder Client)
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentación de API (Swagger)

#### Frontend
- [ ] Unit tests (Jest + React Testing Library)
- [ ] E2E tests (Cypress)
- [ ] Testing de formularios
- [ ] Testing de autenticación
- [ ] Performance optimization

#### DevOps
- [ ] Dockerfile backend
- [ ] Dockerfile frontend
- [ ] Docker Compose (local)
- [ ] Configuración AWS
- [ ] CI/CD pipeline (GitHub Actions)

---

## CHECKLIST DE TAREAS

### Pre-Desarrollo

#### Infraestructura
- [ ] Crear repositorio en GitHub (privado)
- [ ] Configurar rama main y develop
- [ ] Crear cuenta AWS
- [ ] Configurar EC2, RDS, S3
- [ ] Comprar dominio
- [ ] Configurar DNS
- [ ] Generar certificado SSL

#### Configuración Externa
- [ ] Crear cuenta WhatsApp Business
- [ ] Obtener credenciales WhatsApp API
- [ ] Crear cuenta SendGrid
- [ ] Obtener API key SendGrid
- [ ] Configurar variables de entorno

### Sprint 1

#### Backend
- [ ] `npm init` en carpeta backend
- [ ] Instalar dependencias base
- [ ] Crear `tsconfig.json`
- [ ] Crear `.env.example`
- [ ] Conectar a PostgreSQL local
- [ ] Crear schema Prisma
- [ ] Implementar middleware JWT
- [ ] Crear controller de auth
- [ ] Crear rutas de auth
- [ ] Crear modelo User en Prisma
- [ ] Implementar hashing de contraseñas
- [ ] Probar endpoints con Thunder Client

#### Frontend
- [ ] `npx create-next-app` con opciones
- [ ] Instalar TailwindCSS
- [ ] Crear estructura de carpetas
- [ ] Configurar Zustand
- [ ] Crear store de auth
- [ ] Página de login
- [ ] Página de registro
- [ ] Protección de rutas
- [ ] Configurar Axios interceptors

#### Base de Datos
- [ ] Crear tabla Users
- [ ] Crear tabla Patients
- [ ] Crear tabla MedicalProfiles
- [ ] Generar primera migración

### Sprint 2

#### Backend
- [ ] Crear controller de pacientes
- [ ] CRUD pacientes en Express
- [ ] Validaciones con Zod
- [ ] Búsqueda y filtros
- [ ] Integración S3 para documentos
- [ ] Rutas de pacientes
- [ ] Tests de API

#### Frontend
- [ ] Página de listado de pacientes
- [ ] Formulario de paciente (nuevo/editar)
- [ ] Página de detalle de paciente
- [ ] Carga de documentos
- [ ] Búsqueda de pacientes
- [ ] Integración con API

#### Base de Datos
- [ ] Crear tabla MedicalDocuments
- [ ] Indexar búsquedas comunes

### Sprint 3

#### Backend
- [ ] Modelo Appointments en Prisma
- [ ] Modelo TherapistAvailability
- [ ] Modelo Therapists
- [ ] Lógica de disponibilidad
- [ ] CRUD de citas
- [ ] Rutas de citas
- [ ] Validaciones
- [ ] **NUEVO: Integración Google Calendar**
  - [ ] Instalar: `npm install googleapis google-auth-library`
  - [ ] Crear `src/config/googleCalendar.ts`
  - [ ] Crear `src/services/googleCalendarService.ts` con funciones core
  - [ ] Agregar campos: googleEventClinic, googleEventPatient
  - [ ] Migración Prisma
  - [ ] Actualizar appointmentController con sync
  - [ ] Testing de API

#### Frontend
- [ ] Instalar: `npm install react-big-calendar moment react-hot-toast`
- [ ] Componente de calendario (react-big-calendar)
- [ ] Formulario mejorado de cita
- [ ] Vista de citas del día
- [ ] Confirmación de citas
- [ ] Gestión de disponibilidad (admin)
- [ ] **NUEVO: UI de Google Calendar**
  - [ ] Indicadores de sincronización
  - [ ] Toasts informativos
  - [ ] Hook useGoogleCalendar

#### Base de Datos
- [ ] Tablas Appointments, Therapists, TherapistAvailability
- [ ] Índices en fechas y FK
- [ ] Campos googleEventClinic y googleEventPatient

#### Google Cloud Setup (PRE-REQUISITO)
- [ ] Proyecto en Google Cloud Console
- [ ] Habilitar Google Calendar API
- [ ] Service Account creado
- [ ] JSON descargado en backend/
- [ ] Calendario compartido con Service Account

### Sprint 4

#### Backend
- [ ] Integración WhatsApp API
- [ ] Servicio de notificaciones
- [ ] Queue con Bull/BullMQ
- [ ] Recordatorios automáticos
- [ ] Tabla Reminders
- [ ] Rutas de notificaciones

#### Frontend
- [ ] Vista de notificaciones
- [ ] Historial de notificaciones

### Sprint 5

#### Backend
- [ ] Modelo TreatmentSessions
- [ ] CRUD de sesiones
- [ ] Registro de progreso
- [ ] Modelo Evaluations
- [ ] Rutas de sesiones

#### Frontend
- [ ] Formulario de sesión
- [ ] Tabla de sesiones
- [ ] Gráficos de progreso
- [ ] Componentes de charts

### Sprint 6

#### Backend
- [ ] Modelo TreatmentPlans
- [ ] CRUD de planes
- [ ] Cálculo automático de costos
- [ ] Rutas de planes

#### Frontend
- [ ] Formulario de plan
- [ ] Visualización de plan
- [ ] Confirmación de plan

### Sprint 7

#### Backend
- [ ] Mejorar modelo Evaluations
- [ ] Lógica de comparación
- [ ] Cálculo de progreso
- [ ] Rutas adicionales

#### Frontend
- [ ] Formulario de evaluación
- [ ] Gráficos comparativos
- [ ] Vista de progreso

### Sprint 8

#### Backend
- [ ] Endpoints de reportes
- [ ] Cálculo de KPIs
- [ ] Exportación CSV
- [ ] Endpoints de dashboard

#### Frontend
- [ ] Dashboard con KPIs
- [ ] Gráficos de reportes
- [ ] Filtros avanzados
- [ ] Descarga de reportes

### Sprint 9

#### Backend
- [ ] Bot WhatsApp conversacional
- [ ] Tabla PreRegistrations
- [ ] Lógica de conversión
- [ ] Rutas de pre-registro

#### Frontend
- [ ] Vista de pre-registros
- [ ] Botones de acción

### Sprint 10

#### Backend
- [ ] Endpoints adicionales para pacientes

#### Frontend
- [ ] Dashboard de paciente
- [ ] Mis citas
- [ ] Mi progreso
- [ ] Mi perfil

### Sprint 11

#### Backend
- [ ] CRUD de terapeutas mejorado
- [ ] Gestión de horarios

#### Frontend
- [ ] Gestión de terapeutas (admin)
- [ ] Asignación de horarios

### Sprint 12

#### Testing Backend
- [ ] Jest setup
- [ ] Unit tests (auth, pacientes, citas)
- [ ] Integration tests
- [ ] API documentation (Swagger)

#### Testing Frontend
- [ ] Jest + React Testing Library setup
- [ ] Unit tests de componentes
- [ ] Cypress E2E tests
- [ ] Performance audit

#### DevOps
- [ ] Dockerfile backend
- [ ] Dockerfile frontend
- [ ] Docker Compose
- [ ] GitHub Actions CI/CD
- [ ] Deploy a staging
- [ ] Deploy a producción

---

---

## REFERENCIA: INTEGRACIÓN GOOGLE CALENDAR DETALLADA

### Flujo Completo de Sincronización

```
USUARIO CREA CITA EN EL SISTEMA
│
├─ Backend recibe solicitud
│  ├─ Valida datos (paciente, terapeuta, fecha)
│  ├─ Guarda en PostgreSQL
│  │
│  ├─ Crea evento en Google Calendar Clínica
│  │  ├─ Email: citas@clinicafisioterapia.com
│  │  ├─ Título: "Cita - Nombre Paciente"
│  │  ├─ Descripción: Paciente, Terapeuta, ID Cita
│  │  ├─ Hora: Fecha/Hora exacta
│  │  ├─ Duración: Según sesión (30/45/60 min)
│  │  ├─ Recordatorios: 24h antes (email), 30min antes (popup)
│  │  └─ Google Event ID → Se guarda en googleEventClinic
│  │
│  └─ Crea evento en Google Calendar Paciente
│     ├─ Email: email del paciente
│     ├─ Título: "Cita Fisioterapia - Nombre Terapeuta"
│     ├─ Descripción: Con terapeuta, ID Cita
│     ├─ Hora: Misma fecha/hora
│     ├─ Duración: Misma
│     ├─ Recordatorios: 24h antes (email), 2h antes (notificación)
│     └─ Google Event ID → Se guarda en googleEventPatient
│
└─ Frontend muestra notificación
   └─ "✅ Cita creada y sincronizada a Google Calendar"

RESULTADO FINAL:
├─ BD: Appointment guardada con googleEventClinic y googleEventPatient
├─ Google Calendar Clínica: Evento visible
├─ Google Calendar Paciente: Evento visible
├─ Paciente recibe: Notificación WhatsApp + Email
└─ Ambos tienen recordatorios automáticos
```

### Funciones de Google Calendar Service

**1. Crear evento en calendario de clínica**
```typescript
createClinicCalendarEvent({
  patientEmail: "paciente@gmail.com",
  patientName: "Juan Pérez",
  therapistName: "Dr. García",
  appointmentDate: 2024-01-15T10:00:00,
  duration: 60,
  appointmentId: "apt123"
})
// Resultado: googleEventClinic = "event_id_12345"
```

**2. Crear evento en calendario de paciente**
```typescript
createPatientCalendarEvent({
  patientEmail: "paciente@gmail.com",
  patientName: "Juan Pérez",
  therapistName: "Dr. García",
  appointmentDate: 2024-01-15T10:00:00,
  duration: 60,
  appointmentId: "apt123"
})
// Resultado: googleEventPatient = "event_id_67890"
```

**3. Actualizar eventos (cuando se modifica la cita)**
```typescript
updateCalendarEvent("apt123", {
  appointmentDate: 2024-01-15T14:00:00,  // Cambió la hora
  duration: 45  // Cambió la duración
})
// Actualiza ambos eventos automáticamente
```

**4. Eliminar eventos (cuando se cancela la cita)**
```typescript
deleteCalendarEvent("apt123")
// Elimina de ambos calendarios automáticamente
```

### Schema Prisma (Campos Agregados)

```prisma
model Appointment {
  // ... campos existentes ...
  
  // NUEVO: Google Calendar IDs
  googleEventClinic     String?    // "event_clinic_12345"
  googleEventPatient    String?    // "event_patient_67890"
  
  // ... resto de campos ...
}
```

### Archivos de Configuración

**`backend/src/config/googleCalendar.ts`**
```typescript
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

// Lee el archivo JSON de credenciales
const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

// Crea cliente JWT autenticado
const auth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

// Crea cliente de Google Calendar API
const calendar = google.calendar({ version: 'v3', auth });

export default calendar;
```

**`backend/.env` (agregar)**
```env
CLINIC_CALENDAR_ID="citas@clinicafisioterapia.com"
GOOGLE_CREDENTIALS_PATH="./google-credentials.json"
```

### Controlador de Citas (Actualizado)

**`backend/src/controllers/appointmentController.ts`**
```typescript
export async function createAppointment(req: Request, res: Response) {
  try {
    const { patientId, therapistId, appointmentDate, duration } = req.body;

    // Obtener datos del paciente y terapeuta
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    const therapist = await prisma.therapist.findUnique({ where: { id: therapistId } });

    // Crear cita en BD
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        therapistId,
        appointmentDate: new Date(appointmentDate),
        duration,
        status: 'scheduled',
      },
    });

    // Sincronizar con Google Calendar Clínica
    try {
      await createClinicCalendarEvent({
        patientEmail: patient.email,
        patientName: patient.name,
        therapistName: therapist.name,
        appointmentDate: new Date(appointmentDate),
        duration,
        appointmentId: appointment.id,
      });
    } catch (error) {
      console.error('Error con Google Calendar clínica:', error);
    }

    // Sincronizar con Google Calendar Paciente
    try {
      await createPatientCalendarEvent({
        patientEmail: patient.email,
        patientName: patient.name,
        therapistName: therapist.name,
        appointmentDate: new Date(appointmentDate),
        duration,
        appointmentId: appointment.id,
      });
    } catch (error) {
      console.error('Error con Google Calendar paciente:', error);
    }

    return res.status(201).json({
      message: '✅ Cita creada y sincronizada a Google Calendar',
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error creando cita' });
  }
}
```

### Componente Frontend (React)

**`frontend/src/components/calendar/AppointmentCalendar.tsx`**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';

const localizer = momentLocalizer(moment);

export default function AppointmentCalendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments');
      
      // Transforma datos para react-big-calendar
      const calendarEvents = response.data.map((apt) => ({
        id: apt.id,
        title: `${apt.patient.name} - ${apt.therapist.name}`,
        start: new Date(apt.appointmentDate),
        end: new Date(
          new Date(apt.appointmentDate).getTime() + apt.duration * 60000
        ),
        resource: {
          status: apt.status,
          googleSync: apt.googleEventClinic ? '✅ Sincronizado' : '⏳ Sincronizando',
        },
      }));
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error cargando citas:', error);
    }
  };

  return (
    <div className="h-full">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
      />
    </div>
  );
}
```

### Componente de Formulario (React)

**`frontend/src/components/forms/AppointmentForm.tsx`**
```typescript
'use client';

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function AppointmentForm() {
  const [formData, setFormData] = useState({
    patientId: '',
    therapistId: '',
    appointmentDate: '',
    duration: 60,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/appointments', formData);
      
      toast.success('✅ Cita creada');
      toast.success('📅 Sincronizada a Google Calendar');
      
      // Limpiar y recargar
      setFormData({ patientId: '', therapistId: '', appointmentDate: '', duration: 60 });
      window.location.reload();
    } catch (error) {
      toast.error('❌ Error creando cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="email" placeholder="Paciente" required />
      <input type="text" placeholder="Terapeuta" required />
      <input type="datetime-local" value={formData.appointmentDate} required />
      <select value={formData.duration}>
        <option value="30">30 minutos</option>
        <option value="45">45 minutos</option>
        <option value="60">60 minutos</option>
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : '📅 Crear Cita'}
      </button>
    </form>
  );
}
```

### Setup de Google Cloud Console (Paso a Paso)

1. **Crear Proyecto**
   - Ir a https://console.cloud.google.com/
   - Click en "Selecciona un proyecto" → "Nuevo proyecto"
   - Nombre: "Sistema Clínica Fisioterapia"
   - Click "Crear"

2. **Habilitar Google Calendar API**
   - En el buscador: "Google Calendar API"
   - Click en el resultado
   - Click "Habilitar"

3. **Crear Service Account**
   - Ir a "Credenciales" en el menú izquierdo
   - Click "+ CREAR CREDENCIALES"
   - Seleccionar "Cuenta de servicio"
   - Nombre: "sistema-clinica"
   - Click "Crear y continuar"

4. **Generar Clave JSON**
   - En la sección "Claves"
   - Click "Agregar clave" → "Crear clave nueva"
   - Seleccionar "JSON"
   - Click "Crear"
   - Se descargará automáticamente → Guardar en `backend/google-credentials.json`

5. **Crear Calendario en Gmail**
   - Ir a https://calendar.google.com/
   - Con email de la clínica
   - Lado izquierdo → "+ Crear nuevo calendario"
   - Nombre: "Citas Clínica"
   - Click "Crear"

6. **Compartir Calendario con Service Account**
   - Click derecho en calendario → "Configuración"
   - Tab "Permisos"
   - Click "Agregar personas"
   - Pegar email del Service Account (del JSON): `sistema-clinica@...iam.gserviceaccount.com`
   - Permiso: "Hacer cambios en eventos"
   - Click "Enviar invitación"

### Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| "PERMISSION_DENIED" | Service Account sin permisos | Compartir calendario con el email de Service Account |
| "Calendar not found" | ID del calendario incorrecto | Usar el email exacto del calendario: `citas@clinicafisioterapia.com` |
| "Invalid credentials" | JSON corrupto o ruta incorrecta | Verificar ruta en googleCalendar.ts y contenido del JSON |
| Eventos no aparecen en Google | Service Account sin permisos suficientes | Dar permisos: "Hacer cambios en eventos" |
| Error al actualizar evento | googleEventClinic es null | Esperar a que se cree el evento primero |

---

## DIAGRAMA DE FLUJO DE DESARROLLO (CON GOOGLE CALENDAR)

```
INICIO
│
├─ SPRINT 1: Auth (2 semanas)
│  └─ Backend: JWT + Express
│  └─ Frontend: Login/Register
│  └─ BD: Users, Patients
│
├─ SPRINT 2: Pacientes (2 semanas)
│  └─ Backend: CRUD Pacientes
│  └─ Frontend: Listado, Formularios
│  └─ BD: MedicalProfiles, Documents
│
├─ SPRINT 3: Citas + Google Calendar (4 semanas) ⭐ AMPLIADO
│  └─ Backend: CRUD, Disponibilidad, Google Calendar API
│  └─ Frontend: Calendario (react-big-calendar), Formulario
│  └─ BD: Appointments + googleEventClinic/googleEventPatient
│  └─ Setup: Google Cloud Console, Service Account, Compartir calendario
│
├─ SPRINT 4: Notificaciones
│  └─ Backend: WhatsApp API, Queue
│  └─ Frontend: Vistas
│  └─ BD: Reminders
│
├─ SPRINT 5: Sesiones
│  └─ Backend: CRUD Sesiones
│  └─ Frontend: Formularios, Gráficos
│  └─ BD: TreatmentSessions
│
├─ SPRINT 6: Planes
│  └─ Backend: CRUD Planes
│  └─ Frontend: Visualización
│  └─ BD: TreatmentPlans
│
├─ SPRINT 7: Evaluaciones
│  └─ Backend: Evaluaciones, Comparación
│  └─ Frontend: Gráficos comparativos
│  └─ BD: Evaluations mejorada
│
├─ SPRINT 8: Reportes
│  └─ Backend: KPIs, Reportes
│  └─ Frontend: Dashboard, Gráficos
│  └─ BD: Queries optimizadas
│
├─ SPRINT 9: Pre-Registro WhatsApp
│  └─ Backend: Bot WhatsApp
│  └─ Frontend: Admin
│  └─ BD: PreRegistrations
│
├─ SPRINT 10: Portal Pacientes
│  └─ Backend: Endpoints paciente
│  └─ Frontend: Dashboard paciente
│  └─ BD: Queries adicionales
│
├─ SPRINT 11: Terapeutas
│  └─ Backend: CRUD Terapeutas
│  └─ Frontend: Gestión
│  └─ BD: Optimizaciones
│
├─ SPRINT 12: Testing + Deploy
│  └─ Backend: Unit + Integration tests
│  └─ Frontend: Unit + E2E tests
│  └─ DevOps: Docker, AWS, CI/CD
│  └─ Deploy a producción
│
└─ LANZAMIENTO 🚀

Duración: 26 semanas (6.5 meses) - 2 semanas extra por Google Calendar
```

---

## COMANDOS RÁPIDOS PARA EMPEZAR

### Inicializar Backend

```bash
cd backend
npm init -y
npm install express typescript ts-node @types/node @types/express dotenv
npm install -D @types/node typescript ts-node
npm install prisma @prisma/client
npm install bcryptjs jsonwebtoken
npm install zod
npm install axios

# Crear archivos
touch .env tsconfig.json src/index.ts prisma/schema.prisma

# Generar prisma
npx prisma init
```

### Inicializar Frontend

```bash
cd ..
npx create-next-app@latest frontend --typescript --tailwind --app --eslint
cd frontend
npm install zustand react-query axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Inicializar Base de Datos

```bash
# PostgreSQL local (en otra terminal)
# Crear archivo .env en backend:
DATABASE_URL="postgresql://user:password@localhost:5432/clinica_fisioterapia"
JWT_SECRET="your-secret-key-here"
NODE_ENV="development"

# En carpeta backend:
npx prisma migrate dev --name init
npx prisma studio  # Interfaz visual para BD
```

---

## PRÓXIMOS PASOS

1. **Semana 1:** Clonar este plan, crear repositorio, setup local
2. **Semana 2:** Completar Sprint 1 (Auth)
3. **Semanas 3-24:** Seguir sprint por sprint

Para cada sprint:
1. Pull request con cambios
2. Code review
3. Merge a develop
4. Test en staging
5. Deploy a producción

---

**¡Estás listo para empezar!** 🚀

