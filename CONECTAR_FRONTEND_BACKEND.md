# 🔗 Conectar Frontend con Backend

## ✅ Backend URL Encontrada

Tu backend está en:
```
https://sistemaclinica-production-3c10.up.railway.app
```

## 🧪 Paso 1: Probar el Backend

Abre en tu navegador:

### Health Check:
```
https://sistemaclinica-production-3c10.up.railway.app/health
```

**Deberías ver:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-05T..."
}
```

### Endpoint Raíz:
```
https://sistemaclinica-production-3c10.up.railway.app/
```

**Deberías ver:**
```json
{
  "message": "API de Clínica de Fisioterapia",
  "version": "1.0.0",
  "endpoints": {...}
}
```

## 🔗 Paso 2: Actualizar Frontend en Vercel

### 2.1 Ir a Vercel Dashboard
1. Ve a https://vercel.com
2. Selecciona tu proyecto: **sistema-clinica**
3. Ve a **Settings** → **Environment Variables**

### 2.2 Actualizar NEXT_PUBLIC_API_URL
1. Busca la variable `NEXT_PUBLIC_API_URL`
2. Haz clic en **Edit** o **Update**
3. Cambia el valor a:
   ```
   https://sistemaclinica-production-3c10.up.railway.app
   ```
   ⚠️ **IMPORTANTE:** NO incluyas `/api` al final, el frontend ya lo agrega automáticamente.
4. Guarda los cambios

### 2.3 Redeploy Frontend
1. Ve a **Deployments**
2. Haz clic en los **3 puntos** (⋯) del último deployment
3. Selecciona **"Redeploy"**

O simplemente espera a que Vercel detecte el cambio automáticamente.

## 🗄️ Paso 3: Ejecutar Migraciones de Prisma

Antes de usar el backend, necesitas ejecutar las migraciones:

### Opción A: Usando Railway CLI (Recomendado)

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

### Opción B: Desde Railway Dashboard

1. Ve a tu servicio en Railway
2. Ve a **Settings** → **Deploy**
3. Busca **"Run Command"** o similar
4. Ejecuta: `pnpm prisma migrate deploy`

## 👤 Paso 4: Crear Usuario Admin

El usuario `admin@clinica.com` no existe por defecto. Necesitas crearlo:

### Opción A: Usando Railway CLI (Recomendado)

```bash
# Asegúrate de estar en el directorio backend
cd backend

# Ejecutar script de creación de admin
railway run pnpm create-admin
```

Esto creará el usuario:
- **Email:** `admin@clinica.com`
- **Contraseña:** `Password123!!`
- **Rol:** `ADMIN`

### Opción B: Usando el endpoint de registro

También puedes crear el usuario usando el endpoint de registro desde el frontend o con una petición HTTP:

```bash
curl -X POST https://sistemaclinica-production-3c10.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinica.com",
    "password": "Password123!!",
    "name": "Administrador",
    "role": "ADMIN"
  }'
```

## ✅ Checklist Final

- [ ] Backend funcionando (probar `/health`)
- [ ] `NEXT_PUBLIC_API_URL` actualizada en Vercel (sin `/api` al final)
- [ ] Frontend redeployado
- [ ] Migraciones ejecutadas
- [ ] Usuario admin creado
- [ ] Login funcionando correctamente

## 🎯 Próximos Pasos

Una vez que todo esté conectado:
1. Prueba hacer login en el frontend
2. Verifica que las peticiones al backend funcionen
3. Prueba crear un paciente, cita, etc.

---

¿El backend responde correctamente cuando pruebas `/health`?

