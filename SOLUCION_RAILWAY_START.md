# 🔧 Solución: Railway No Encuentra Start Command

## ⚠️ Problema

Railway está buscando el comando de inicio en la **raíz del repositorio**, pero el backend está en la carpeta `backend/`.

## ✅ Solución: Configurar Root Directory en Railway

### Opción 1: Configurar Root Directory (RECOMENDADO)

1. En **Railway Dashboard**, ve a tu servicio
2. Haz clic en **Settings**
3. Busca la sección **"Root Directory"** o **"Working Directory"**
4. Escribe: `backend`
5. Guarda los cambios
6. Haz un **redeploy**

### Opción 2: Verificar Configuración del Servicio

Si creaste el servicio desde GitHub:

1. Ve a **Settings** → **Source**
2. Verifica que **"Root Directory"** esté configurado como: `backend`
3. Si no, cámbialo y haz redeploy

### Opción 3: Configurar Manualmente en Railway Dashboard

En **Settings** → **Deploy**:

**Build Command:**
```bash
pnpm install && pnpm run build && pnpm prisma generate
```

**Start Command:**
```bash
node dist/index.js
```

**O simplemente:**
```bash
pnpm start
```

## 📋 Archivos Creados

He creado estos archivos para ayudar a Railway:

1. **`backend/Procfile`**: Le dice a Railway cómo iniciar la app
2. **`backend/nixpacks.toml`**: Configuración explícita para Nixpacks
3. **`backend/railway.json`**: Configuración de Railway

## 🔍 Verificación

Después de configurar el Root Directory, Railway debería:

1. ✅ Detectar `backend/package.json`
2. ✅ Encontrar el script `"start": "node dist/index.js"`
3. ✅ Ejecutar el build correctamente
4. ✅ Iniciar el servidor

## ⚡ Si Aún No Funciona

1. **Verifica que el Root Directory esté configurado** como `backend`
2. **Haz un redeploy manual** después de cambiar la configuración
3. **Revisa los logs** para ver qué está buscando Railway

