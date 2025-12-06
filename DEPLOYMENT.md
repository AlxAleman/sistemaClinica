# Guía de Despliegue - Sistema de Gestión Clínica

## Consideraciones sobre Vercel

### ✅ Frontend (Next.js) → Vercel
**Perfecto para Vercel** - Next.js es la plataforma nativa de Vercel.

### ⚠️ Backend (Express) → Vercel
**Posible pero no recomendado** para este proyecto porque:
- Express con conexiones persistentes a PostgreSQL no es ideal para funciones serverless
- Prisma puede tener problemas con conexiones en funciones serverless
- Mejor usar plataformas diseñadas para aplicaciones Node.js tradicionales

## Opciones Recomendadas de Despliegue

### Opción 1: Separar Frontend y Backend (RECOMENDADO)

#### Frontend → Vercel
```bash
# En la carpeta frontend
vercel deploy
```

**Ventajas:**
- ✅ Despliegue automático con Git
- ✅ CDN global
- ✅ SSL automático
- ✅ Optimizado para Next.js

#### Backend → Railway / Render / DigitalOcean

**Railway (Recomendado - Más fácil)**
1. Conecta tu repositorio GitHub
2. Railway detecta automáticamente Node.js
3. Agrega variable `DATABASE_URL` (Railway puede crear PostgreSQL automáticamente)
4. Deploy automático

**Render**
1. Conecta repositorio
2. Selecciona "Web Service"
3. Build: `cd backend && npm install && npm run build`
4. Start: `cd backend && npm start`
5. Crea PostgreSQL desde el dashboard

**DigitalOcean App Platform**
1. Similar a Render
2. Puede crear PostgreSQL automáticamente

### Opción 2: Todo en Vercel (con limitaciones)

Si quieres usar Vercel para todo:

#### Frontend → Vercel (como siempre)

#### Backend → Vercel Functions (Serverless)

**Cambios necesarios:**
1. Convertir rutas Express a funciones serverless
2. Usar **Vercel Postgres** o **Neon** (PostgreSQL serverless)
3. Configurar Prisma para conexiones serverless

**Estructura necesaria:**
```
backend/
├── api/
│   ├── auth/
│   │   ├── login.ts      # Función serverless
│   │   ├── register.ts   # Función serverless
│   │   └── refresh.ts
│   └── patients/
│       └── index.ts
```

**Vercel Postgres:**
- Integrado con Vercel
- Serverless compatible
- Gratis hasta cierto límite

**Neon (Alternativa):**
- PostgreSQL serverless
- Compatible con Prisma
- Mejor para funciones serverless

### Opción 3: Monorepo con Vercel

Si quieres mantener todo junto:

1. **Frontend** → Vercel (Next.js)
2. **Backend** → Vercel Functions (convertir a serverless)
3. **Base de Datos** → Vercel Postgres o Neon

## Configuración Recomendada (Opción 1)

### 1. Frontend en Vercel

```bash
cd frontend
vercel init
vercel deploy
```

**Variables de entorno en Vercel:**
```
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```

### 2. Backend en Railway

1. Ve a [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio
4. Railway detecta `backend/package.json`
5. Agrega PostgreSQL desde "New" → "Database" → "PostgreSQL"
6. Railway automáticamente inyecta `DATABASE_URL`
7. Agrega otras variables:
   ```
   JWT_SECRET=tu-secret-key
   JWT_REFRESH_SECRET=tu-refresh-secret
   FRONTEND_URL=https://tu-frontend.vercel.app
   NODE_ENV=production
   PORT=5000
   ```

### 3. Base de Datos

**Railway PostgreSQL:**
- Se crea automáticamente
- `DATABASE_URL` se inyecta automáticamente
- Ejecutar migraciones: `railway run npx prisma migrate deploy`

**O usar servicios externos:**
- **Neon**: https://neon.tech (PostgreSQL serverless)
- **Supabase**: https://supabase.com (PostgreSQL + extras)
- **AWS RDS**: Para producción empresarial

## Migraciones de Base de Datos

### En Railway:
```bash
railway run npx prisma migrate deploy
```

### En Render:
Agregar en "Build Command":
```bash
cd backend && npm install && npx prisma generate && npx prisma migrate deploy
```

## Variables de Entorno Necesarias

### Backend (Railway/Render):
```env
DATABASE_URL=postgresql://... (proporcionado por el servicio)
JWT_SECRET=tu-secret-key-seguro
JWT_REFRESH_SECRET=tu-refresh-secret-seguro
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.vercel.app
```

### Frontend (Vercel):
```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```

## Comparación de Opciones

| Opción | Facilidad | Costo | Performance | Recomendado |
|--------|-----------|-------|-------------|-------------|
| **Frontend Vercel + Backend Railway** | ⭐⭐⭐⭐⭐ | Gratis/Barato | ⭐⭐⭐⭐⭐ | ✅ SÍ |
| **Frontend Vercel + Backend Render** | ⭐⭐⭐⭐ | Gratis/Barato | ⭐⭐⭐⭐ | ✅ SÍ |
| **Todo en Vercel (Serverless)** | ⭐⭐⭐ | Gratis | ⭐⭐⭐ | ⚠️ Requiere refactor |
| **Todo en Railway** | ⭐⭐⭐⭐ | Gratis/Barato | ⭐⭐⭐⭐ | ✅ Alternativa |

## Recomendación Final

**Para este proyecto:**
1. ✅ **Frontend (Next.js)** → Vercel
2. ✅ **Backend (Express)** → Railway o Render
3. ✅ **PostgreSQL** → Railway Postgres o Neon

**Razones:**
- Separación de responsabilidades
- Cada servicio en su plataforma óptima
- Fácil de mantener y escalar
- Costo mínimo (planes gratuitos disponibles)

## Próximos Pasos

1. **Desarrollar localmente** (lo que estamos haciendo ahora)
2. **Configurar Railway/Render** para backend
3. **Configurar Vercel** para frontend
4. **Conectar ambos** con variables de entorno
5. **Ejecutar migraciones** en producción

¿Quieres que te ayude a configurar el despliegue cuando estemos listos?

