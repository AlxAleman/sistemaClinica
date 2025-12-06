# 🚀 Guía Completa: Desplegar Backend en Railway

## 📋 Requisitos Previos

- ✅ Cuenta en Railway (gratis): https://railway.app
- ✅ Cuenta en GitHub (ya tienes el repo)
- ✅ Base de datos Neon configurada (ya la tienes)

---

## 🎯 Paso 1: Crear Proyecto en Railway

### 1.1 Acceder a Railway
1. Ve a https://railway.app
2. Haz clic en **"Login"** o **"Start a New Project"**
3. Inicia sesión con GitHub (recomendado)

### 1.2 Crear Nuevo Proyecto
1. Haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Autoriza Railway a acceder a tus repositorios (si es la primera vez)
4. Busca y selecciona: `AlxAleman/sistemaClinica`

---

## 🎯 Paso 2: Configurar el Servicio Backend

### 2.1 Railway Detectará Automáticamente
- Railway detectará que hay una carpeta `backend/` con `package.json`
- Creará un servicio automáticamente

### 2.2 Si No Detecta Automáticamente
1. Haz clic en **"New"** → **"GitHub Repo"**
2. Selecciona tu repositorio
3. En **"Root Directory"**, escribe: `backend`
4. Railway detectará Node.js automáticamente

---

## 🎯 Paso 3: Configurar Variables de Entorno

### 3.1 Acceder a Variables de Entorno
1. Haz clic en el servicio que creó Railway
2. Ve a la pestaña **"Variables"**
3. Haz clic en **"New Variable"**

### 3.2 Agregar Variables (Una por Una)

#### Base de Datos (Neon)
```
DATABASE_URL = postgresql://neondb_owner:npg_X2mskJizGE6O@ep-round-morning-ahcgwhzk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

```
DIRECT_URL = postgresql://neondb_owner:npg_X2mskJizGE6O@ep-round-morning-ahcgwhzk.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### JWT Secrets (Generar Nuevos o Usar los Existentes)
```
JWT_SECRET = 707f1c5ddf777c2ab213942c193c5afefa47d10261d2f522eff7067d864fb4f290650a04316f01ae34ff63e0226764a3bc9b1c292c83af23798fbb37ee018094
```

```
JWT_REFRESH_SECRET = beffb572dd2b48e51cb86e46e7786b3e4a3fe1b352a6c9dcad8e27fca5dcb950f4660c3eaed4b7063fcab3862c1133140488bb845a336a259c4ad760c6e3fb95
```

```
JWT_EXPIRES_IN = 24h
```

```
JWT_REFRESH_EXPIRES_IN = 7d
```

#### Configuración General
```
NODE_ENV = production
```

```
PORT = 5000
```

#### URL del Frontend (Actualizar con tu URL de Vercel)
```
FRONTEND_URL = https://tu-proyecto.vercel.app
```

**⚠️ IMPORTANTE:** Reemplaza `tu-proyecto` con la URL real que Vercel te asignó.

---

## 🎯 Paso 4: Configurar Build y Start Commands

### 4.1 Acceder a Settings
1. En el servicio, ve a la pestaña **"Settings"**
2. Busca la sección **"Build & Deploy"**

### 4.2 Configurar Commands

**Build Command:**
```bash
pnpm install && pnpm run build
```

**Start Command:**
```bash
pnpm start
```

**O si Railway no detecta pnpm automáticamente:**
```bash
npm install && npm run build
npm start
```

### 4.3 Root Directory
Asegúrate de que esté configurado como:
```
backend
```

---

## 🎯 Paso 5: Ejecutar Migraciones de Prisma

### 5.1 Usando Railway CLI (Recomendado)

1. **Instalar Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Iniciar sesión:**
```bash
railway login
```

3. **Conectar al proyecto:**
```bash
railway link
```
(Selecciona el proyecto que creaste)

4. **Ejecutar migraciones:**
```bash
cd backend
railway run pnpm prisma migrate deploy
```

**O si no tienes pnpm instalado globalmente:**
```bash
railway run npx prisma migrate deploy
```

### 5.2 Usando Railway Dashboard (Alternativa)

1. En Railway Dashboard, ve a tu servicio
2. Haz clic en **"Deployments"**
3. Haz clic en **"View Logs"**
4. En la terminal, puedes ejecutar comandos (si Railway lo permite)

---

## 🎯 Paso 6: Verificar el Deploy

### 6.1 Obtener la URL del Backend
1. En Railway Dashboard, ve a tu servicio
2. Haz clic en la pestaña **"Settings"**
3. Busca **"Domains"** o **"Generate Domain"**
4. Railway generará una URL como: `https://tu-backend.up.railway.app`

### 6.2 Probar el Backend
Abre en tu navegador:
```
https://tu-backend.up.railway.app/api/health
```

O si no tienes endpoint de health:
```
https://tu-backend.up.railway.app/api
```

Deberías ver una respuesta (puede ser un error 404, pero significa que el servidor está funcionando).

---

## 🎯 Paso 7: Conectar Frontend con Backend

### 7.1 Actualizar Variable en Vercel
1. Ve a Vercel Dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Actualiza `NEXT_PUBLIC_API_URL`:
```
NEXT_PUBLIC_API_URL = https://tu-backend.up.railway.app/api
```

### 7.2 Redeploy Frontend
1. En Vercel, ve a **Deployments**
2. Haz clic en los **3 puntos** del último deploy
3. Selecciona **"Redeploy"**

---

## ✅ Checklist Final

- [ ] Proyecto creado en Railway
- [ ] Servicio backend configurado
- [ ] Variables de entorno agregadas
- [ ] Build y Start commands configurados
- [ ] Migraciones de Prisma ejecutadas
- [ ] Backend desplegado y funcionando
- [ ] URL del backend obtenida
- [ ] Frontend actualizado con nueva URL del backend
- [ ] Frontend redeployado
- [ ] Todo funcionando correctamente

---

## 🆘 Solución de Problemas

### Error: "Cannot find module"
- Verifica que `Root Directory` esté configurado como `backend`
- Verifica que `package.json` esté en `backend/`

### Error: "Prisma Client not generated"
- Ejecuta: `railway run pnpm prisma generate`
- O agrega en `package.json`: `"postinstall": "prisma generate"`

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` esté correcta
- Verifica que Neon permita conexiones desde Railway (debería permitir desde cualquier IP)

### Error: "Port already in use"
- Railway asigna el puerto automáticamente
- Usa `process.env.PORT` en tu código (ya debería estar así)

---

## 📝 Notas Importantes

1. **Railway es gratuito** hasta cierto límite (500 horas/mes)
2. **El backend se duerme** después de inactividad (en plan gratuito)
3. **La primera petición puede tardar** unos segundos (cold start)
4. **Las variables de entorno** son sensibles, no las compartas públicamente

---

¿Necesitas ayuda con algún paso específico?

