# 📋 Requisitos para Montar en Vercel

## ✅ Lo que YA tienes configurado

1. ✅ `vercel.json` - Configuración de monorepo
2. ✅ `backend/src/index.ts` - Export para Vercel Serverless
3. ✅ `frontend/.vercelignore` - Archivos a ignorar
4. ✅ `.gitignore` - Archivos a ignorar en Git
5. ✅ Estructura de proyecto lista

---

## 🔧 Lo que NECESITAS hacer

### 1. Instalar dependencia de Vercel en Backend

```bash
cd backend
npm install @vercel/node --save-dev
```

### 2. Actualizar package.json del Backend

Agrega estos scripts al `backend/package.json`:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && tsc",
    "postinstall": "prisma generate"
  }
}
```

### 3. Configurar Base de Datos en Producción

**Opción A: Neon (Recomendado - PostgreSQL Serverless)**

1. Ve a [neon.tech](https://neon.tech)
2. Crea cuenta gratuita
3. Crea nuevo proyecto
4. Copia la connection string (ejemplo):
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

**Opción B: Supabase**

1. Ve a [supabase.com](https://supabase.com)
2. Crea proyecto
3. Settings > Database > Connection string

**Opción C: Railway PostgreSQL**

1. Ve a [railway.app](https://railway.app)
2. New Project > Database > PostgreSQL
3. Copia la connection string

### 4. Generar Secrets JWT

Ejecuta estos comandos para generar secrets seguros:

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT_REFRESH_SECRET (ejecuta de nuevo)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Guarda estos valores, los necesitarás en Vercel.

### 5. Configurar Variables de Entorno en Vercel

Una vez que tengas tu proyecto en Vercel, ve a:
**Settings > Environment Variables**

#### Variables para FRONTEND:

```
NEXT_PUBLIC_API_URL=https://tu-proyecto.vercel.app/api
```

#### Variables para BACKEND (si usas monorepo):

```
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
DIRECT_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=tu-jwt-secret-generado-anteriormente
JWT_REFRESH_SECRET=tu-refresh-secret-generado-anteriormente
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://tu-proyecto.vercel.app
PORT=5000
```

**Nota**: `DIRECT_URL` es para migraciones. Si solo tienes una URL con pooling, también funciona, pero agrega `DIRECT_URL` para mejor rendimiento.

### 6. Ejecutar Migraciones en Producción

Después del primer deploy, necesitas ejecutar las migraciones:

**Opción A: Desde Vercel CLI**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Conectar con tu proyecto
vercel link

# Ejecutar migraciones
cd backend
vercel env pull .env.production
npx prisma migrate deploy
```

**Opción B: Desde Neon/Supabase Dashboard**

1. Ve al dashboard de tu base de datos
2. Abre SQL Editor
3. Copia y ejecuta las migraciones manualmente desde `backend/prisma/migrations/`

**Opción C: Script de deployment**

Crea un script que ejecute las migraciones automáticamente.

---

## 📝 Checklist Pre-Deployment

### Backend

- [ ] Instalar `@vercel/node`: `npm install @vercel/node --save-dev`
- [ ] Agregar script `vercel-build` en `package.json`
- [ ] Agregar script `postinstall` para Prisma
- [ ] Base de datos creada (Neon/Supabase/Railway)
- [ ] `DATABASE_URL` copiada
- [ ] JWT secrets generados
- [ ] Variables de entorno listas para agregar en Vercel

### Frontend

- [ ] `next.config.js` configurado correctamente
- [ ] `NEXT_PUBLIC_API_URL` listo para configurar en Vercel
- [ ] Build funciona localmente: `npm run build`

### General

- [ ] Código subido a GitHub (recomendado)
- [ ] `.env` NO está en el repositorio (verificado en `.gitignore`)
- [ ] `vercel.json` en la raíz del proyecto

---

## 🚀 Pasos de Deployment

### Paso 1: Preparar el código

```bash
# Verificar que todo compila
cd frontend
npm run build

cd ../backend
npm run build
```

### Paso 2: Subir a GitHub (si no lo has hecho)

```bash
git init
git add .
git commit -m "Preparado para deployment en Vercel"
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

### Paso 3: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con GitHub
3. Click en "Add New Project"
4. Importa tu repositorio
5. Configura:
   - **Framework Preset**: Other (o Next.js si solo despliegas frontend)
   - **Root Directory**: `.` (raíz del proyecto)
   - **Build Command**: (Vercel lo detectará automáticamente)
   - **Output Directory**: (Vercel lo detectará automáticamente)

### Paso 4: Configurar Variables de Entorno

En Vercel Dashboard > Settings > Environment Variables, agrega todas las variables listadas arriba.

### Paso 5: Deploy

Click en "Deploy" y espera a que termine.

### Paso 6: Ejecutar Migraciones

Después del primer deploy exitoso:

```bash
# Opción 1: Desde local con variables de Vercel
vercel env pull .env.production
cd backend
npx prisma migrate deploy

# Opción 2: Desde Vercel CLI
vercel exec -- npm run prisma:migrate:deploy
```

---

## 🔍 Verificación Post-Deployment

1. **Frontend funciona:**
   - Visita `https://tu-proyecto.vercel.app`
   - Debe cargar sin errores

2. **Backend funciona:**
   - Visita `https://tu-proyecto.vercel.app/api`
   - Debe mostrar el JSON con los endpoints

3. **Health check:**
   - Visita `https://tu-proyecto.vercel.app/health`
   - Debe responder `{"status":"ok"}`

4. **Base de datos:**
   - Intenta hacer login/registro
   - Si funciona, la conexión a BD está bien

---

## ⚠️ Problemas Comunes y Soluciones

### Error: "Cannot find module '@prisma/client'"

**Solución:**
Agrega al `backend/package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Error: "Database connection failed"

**Solución:**
- Verifica que `DATABASE_URL` esté configurada en Vercel
- Verifica que la URL incluya `?sslmode=require` si es necesario
- Verifica que la base de datos permita conexiones externas

### Error: "CORS error"

**Solución:**
- Verifica que `FRONTEND_URL` en Vercel sea la URL correcta de tu frontend
- Verifica que `NEXT_PUBLIC_API_URL` apunte a la URL correcta del backend

### Error: "Build failed"

**Solución:**
- Revisa los logs en Vercel Dashboard
- Verifica que todas las dependencias estén en `package.json`
- Verifica que no haya errores de TypeScript

---

## 📚 Archivos de Configuración Necesarios

### `backend/package.json` (actualizar)

```json
{
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "vercel-build": "prisma generate && tsc",
    "postinstall": "prisma generate",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "seed": "ts-node prisma/seed.ts"
  },
  "devDependencies": {
    "@vercel/node": "^3.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.19",
    "@types/jsonwebtoken": "^9.0.10"
  }
}
```

### `vercel.json` (ya existe, verificar)

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
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["backend/prisma/**"]
      }
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

---

## 🎯 Resumen de Requisitos

### Mínimos necesarios:

1. ✅ Cuenta en Vercel (gratis)
2. ✅ Base de datos PostgreSQL (Neon/Supabase - gratis)
3. ✅ Código en GitHub (recomendado) o listo para subir
4. ✅ Variables de entorno configuradas
5. ✅ `@vercel/node` instalado en backend
6. ✅ Scripts de build actualizados

### Tiempo estimado:

- **Setup inicial**: 15-30 minutos
- **Primer deployment**: 5-10 minutos
- **Configuración de BD**: 10-15 minutos
- **Total**: ~30-60 minutos

---

## 🆘 ¿Necesitas ayuda?

Si encuentras algún problema:

1. Revisa los logs en Vercel Dashboard
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que las migraciones se hayan ejecutado
4. Verifica la conexión a la base de datos

¡Listo para deploy! 🚀

