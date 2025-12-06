# ✅ Pasos Después de Configurar Root Directory

## 1. ✅ Root Directory Configurado
Ya configuraste `backend` como Root Directory. Perfecto.

## 2. 🔄 Hacer Redeploy

Ahora necesitas hacer un **redeploy** para que Railway use la nueva configuración:

1. En Railway Dashboard, ve a tu servicio
2. Haz clic en la pestaña **"Deployments"**
3. Haz clic en los **3 puntos** (⋯) del último deployment
4. Selecciona **"Redeploy"**

O simplemente:
- Haz clic en **"Deploy"** o **"Redeploy"** si hay un botón visible

## 3. ⏳ Esperar el Build

Railway ahora debería:
- ✅ Detectar que está en `backend/`
- ✅ Encontrar `package.json` en `backend/`
- ✅ Encontrar el script `"start": "node dist/index.js"`
- ✅ Ejecutar el build correctamente
- ✅ Iniciar el servidor

## 4. 📋 Verificar Variables de Entorno

Mientras esperas el build, verifica que tengas estas variables configuradas:

En **Settings → Variables** del servicio:

✅ **DATABASE_URL** (de Neon)
✅ **DIRECT_URL** (de Neon)
✅ **JWT_SECRET**
✅ **JWT_REFRESH_SECRET**
✅ **JWT_EXPIRES_IN** = 24h
✅ **JWT_REFRESH_EXPIRES_IN** = 7d
✅ **NODE_ENV** = production
✅ **PORT** = 5000
✅ **FRONTEND_URL** = https://tu-proyecto.vercel.app

## 5. 🔍 Revisar Logs

Después del deploy, revisa los logs para verificar:

1. Ve a **"Deployments"** → Haz clic en el deployment más reciente
2. Revisa los logs para ver:
   - ✅ "Installing dependencies..."
   - ✅ "Building..."
   - ✅ "Starting server..."
   - ✅ "🚀 Servidor corriendo en puerto 5000"

## 6. 🧪 Probar el Backend

Una vez que el deploy termine:

1. Ve a **Settings** → **"Domains"** o **"Generate Domain"**
2. Railway te dará una URL como: `https://tu-backend.up.railway.app`
3. Prueba en tu navegador:
   ```
   https://tu-backend.up.railway.app/health
   ```
   
   Deberías ver:
   ```json
   {
     "status": "ok",
     "timestamp": "..."
   }
   ```

## 7. 🗄️ Ejecutar Migraciones

Después de que el backend esté funcionando, ejecuta las migraciones:

```bash
# Instalar Railway CLI (si no lo tienes)
npm install -g @railway/cli

# Iniciar sesión
railway login

# Conectar al proyecto
railway link
# (Selecciona tu proyecto)

# Ejecutar migraciones
cd backend
railway run pnpm prisma migrate deploy
```

## 8. 🔗 Conectar Frontend

Una vez que tengas la URL del backend:

1. Ve a **Vercel Dashboard**
2. **Settings** → **Environment Variables**
3. Actualiza `NEXT_PUBLIC_API_URL`:
   ```
   NEXT_PUBLIC_API_URL = https://tu-backend.up.railway.app/api
   ```
4. Haz **redeploy** del frontend

## ✅ Checklist

- [x] Root Directory configurado como `backend`
- [ ] Redeploy ejecutado
- [ ] Build completado exitosamente
- [ ] Variables de entorno configuradas
- [ ] Backend funcionando (probar `/health`)
- [ ] Migraciones ejecutadas
- [ ] Frontend actualizado con URL del backend
- [ ] Todo funcionando correctamente

---

¿El deploy está funcionando ahora? Si ves algún error en los logs, compártelo y te ayudo a solucionarlo.

