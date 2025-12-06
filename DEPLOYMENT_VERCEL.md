# 🚀 Guía de Deployment en Vercel

Esta guía te ayudará a desplegar tanto el **frontend** (Next.js) como el **backend** (Express) en Vercel.

## 📋 Índice

1. [Estrategia de Deployment](#estrategia-de-deployment)
2. [Frontend en Vercel](#frontend-en-vercel)
3. [Backend en Vercel](#backend-en-vercel)
4. [Base de Datos](#base-de-datos)
5. [Variables de Entorno](#variables-de-entorno)
6. [Configuración Final](#configuración-final)

---

## 🎯 Estrategia de Deployment

### Opción 1: Todo en Vercel (Recomendado para empezar)
- **Frontend**: Vercel (Next.js - soporte nativo)
- **Backend**: Vercel Serverless Functions
- **Base de Datos**: Neon, Supabase, o Railway (PostgreSQL serverless)

### Opción 2: Híbrida (Recomendado para producción)
- **Frontend**: Vercel (Next.js)
- **Backend**: Railway, Render, o Fly.io (Express tradicional)
- **Base de Datos**: Neon, Supabase, o Railway

---

## 🎨 Frontend en Vercel

### Paso 1: Preparar el proyecto

1. **Asegúrate de tener un `next.config.js` correcto:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Si usas imágenes externas, agrega los dominios aquí
  images: {
    domains: ['tu-dominio.com'],
  },
}

module.exports = nextConfig
```

### Paso 2: Crear archivo `.vercelignore` (opcional)

```bash
# frontend/.vercelignore
node_modules
.env.local
.env*.local
```

### Paso 3: Desplegar en Vercel

#### Opción A: Desde la CLI de Vercel

```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

Sigue las instrucciones:
- ¿Quieres sobrescribir la configuración? **No** (primera vez)
- ¿Qué directorio quieres desplegar? **./frontend** o **.** (si ya estás en la carpeta)
- ¿Quieres modificar los ajustes? **No** (primera vez)

#### Opción B: Desde GitHub (Recomendado)

1. **Sube tu código a GitHub** (si no lo has hecho):
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

2. **Conecta con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "Add New Project"
   - Importa tu repositorio de GitHub
   - Configura:
     - **Framework Preset**: Next.js
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build` (o `yarn build`)
     - **Output Directory**: `.next` (automático)
     - **Install Command**: `npm install` (o `yarn install`)

3. **Configura Variables de Entorno** (ver sección abajo)

4. **Deploy!** Click en "Deploy"

---

## ⚙️ Backend en Vercel

Vercel puede ejecutar Express como Serverless Functions. Aquí te muestro cómo:

### Paso 1: Crear `vercel.json` en la raíz del proyecto

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Paso 2: Instalar dependencias necesarias

```bash
cd backend
npm install @vercel/node
```

### Paso 3: Modificar `backend/src/index.ts` para Vercel

Necesitas exportar el handler para Vercel:

```typescript
// backend/src/index.ts
import express from 'express';
// ... resto de imports

const app = express();
// ... configuración de Express

// Al final del archivo, exporta para Vercel:
export default app; // Para Vercel Serverless
```

**O mejor aún, crea un wrapper:**

```typescript
// backend/src/index.ts
// ... todo tu código de Express ...

// Para desarrollo local
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Para Vercel
export default app;
```

### Paso 4: Desplegar Backend

#### Opción A: Monorepo (Frontend + Backend en el mismo proyecto)

1. Crea `vercel.json` en la raíz del proyecto:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

2. Despliega desde la raíz:
```bash
vercel
```

#### Opción B: Backend separado

1. Crea un proyecto separado en Vercel para el backend
2. Configura:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

## 🗄️ Base de Datos

### Opción 1: Neon (Recomendado - PostgreSQL Serverless)

1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta y un nuevo proyecto
3. Copia la connection string (ej: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname`)
4. Agrega como variable de entorno `DATABASE_URL` en Vercel

### Opción 2: Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un proyecto
3. Ve a Settings > Database
4. Copia la connection string
5. Agrega como variable de entorno `DATABASE_URL`

### Opción 3: Railway

1. Ve a [railway.app](https://railway.app)
2. Crea un proyecto PostgreSQL
3. Copia la connection string
4. Agrega como variable de entorno `DATABASE_URL`

### Migrar la Base de Datos

Una vez que tengas la `DATABASE_URL` de producción:

```bash
cd backend
# Configura DATABASE_URL en Vercel o localmente
export DATABASE_URL="postgresql://..."

# Ejecuta las migraciones
npx prisma migrate deploy

# (Opcional) Genera el cliente de Prisma
npx prisma generate
```

---

## 🔐 Variables de Entorno

### Frontend (en Vercel Dashboard)

Ve a tu proyecto en Vercel > Settings > Environment Variables:

```
NEXT_PUBLIC_API_URL=https://tu-backend.vercel.app/api
# O si el backend está en otro servicio:
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```

### Backend (en Vercel Dashboard)

```
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=tu-secret-super-seguro-aqui
JWT_REFRESH_SECRET=tu-refresh-secret-super-seguro-aqui
NODE_ENV=production
PORT=5000
```

**⚠️ IMPORTANTE**: 
- **NUNCA** subas `.env` a GitHub
- Usa variables de entorno en Vercel Dashboard
- Para `JWT_SECRET`, genera uno seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📝 Configuración Final

### 1. Actualizar `frontend/services/api.ts`

Asegúrate de que apunte a la URL correcta:

```typescript
// frontend/services/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  // ...
});
```

### 2. Configurar CORS en Backend

Si el frontend y backend están en dominios diferentes:

```typescript
// backend/src/config/cors.ts
const allowedOrigins = [
  'http://localhost:3000',
  'https://tu-frontend.vercel.app',
  // Agrega más dominios si es necesario
];

export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
```

### 3. Prisma en Producción

Asegúrate de que Prisma esté configurado correctamente:

```bash
# En el build command de Vercel (backend)
npm install
npx prisma generate
npm run build
```

O agrega un script en `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && tsc"
  }
}
```

---

## 🚀 Pasos de Deployment

### Frontend

1. **Preparar código:**
```bash
cd frontend
npm run build  # Verifica que compile sin errores
```

2. **Subir a GitHub** (si no lo has hecho)

3. **Conectar con Vercel:**
   - Ve a vercel.com
   - Importa tu repositorio
   - Configura: Root Directory = `frontend`
   - Agrega variables de entorno
   - Deploy!

### Backend

1. **Preparar código:**
```bash
cd backend
npm run build  # Verifica que compile
```

2. **Si usas monorepo:**
   - El `vercel.json` en la raíz manejará todo
   - Solo despliega desde la raíz

3. **Si backend separado:**
   - Crea proyecto separado en Vercel
   - Root Directory = `backend`
   - Agrega variables de entorno
   - Deploy!

---

## ✅ Checklist Pre-Deployment

- [ ] Frontend compila sin errores (`npm run build`)
- [ ] Backend compila sin errores (`npm run build`)
- [ ] Base de datos creada y migrada
- [ ] Variables de entorno configuradas en Vercel
- [ ] CORS configurado correctamente
- [ ] `NEXT_PUBLIC_API_URL` apunta a la URL correcta del backend
- [ ] Prisma generate ejecutado en build
- [ ] Migraciones aplicadas en producción
- [ ] JWT secrets generados y configurados

---

## 🔧 Troubleshooting

### Error: "Cannot find module '@prisma/client'"

**Solución**: Agrega `prisma generate` al build command:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Error: "Database connection failed"

**Solución**: 
- Verifica que `DATABASE_URL` esté configurada en Vercel
- Verifica que la base de datos permita conexiones externas
- Ejecuta `npx prisma migrate deploy` en producción

### Error: CORS

**Solución**: 
- Agrega el dominio de Vercel a `allowedOrigins` en CORS
- Verifica que `credentials: true` esté configurado

### Frontend no encuentra el backend

**Solución**:
- Verifica `NEXT_PUBLIC_API_URL` en Vercel
- Asegúrate de que el backend esté desplegado y accesible
- Revisa los logs de Vercel para errores

---

## 📚 Recursos Adicionales

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Neon Documentation](https://neon.tech/docs)

---

## 🎉 ¡Listo!

Una vez completado, tu aplicación estará disponible en:
- **Frontend**: `https://tu-proyecto.vercel.app`
- **Backend**: `https://tu-backend.vercel.app/api` (o la URL que configuraste)

¡Feliz deployment! 🚀

