# ✅ Actualizar Variable en Vercel - Paso a Paso

## 📍 Estás en el Lugar Correcto

Estás en: **Vercel Dashboard → Project Settings → Environment Variables** ✅

## 🎯 Pasos para Actualizar NEXT_PUBLIC_API_URL

### Paso 1: Buscar la Variable Existente

1. En la sección **"Search..."** (abajo de la página)
2. Busca: `NEXT_PUBLIC_API_URL`
3. Si la encuentras, haz clic en ella para editarla

### Paso 2: Si NO Existe la Variable

Si no encuentras `NEXT_PUBLIC_API_URL`:

1. En la parte superior, en los campos **"Key"** y **"Value"**
2. En **"Key"**, escribe:
   ```
   NEXT_PUBLIC_API_URL
   ```
3. En **"Value"**, escribe:
   ```
   https://sistemaclinica-production-3c10.up.railway.app/api
   ```
4. En **"Environments"**, selecciona: **"All Environments"** (o Production, Preview, Development según necesites)
5. Haz clic en **"Save"**

### Paso 3: Si Ya Existe la Variable

1. Haz clic en la variable `NEXT_PUBLIC_API_URL`
2. Actualiza el **"Value"** a:
   ```
   https://sistemaclinica-production-3c10.up.railway.app/api
   ```
3. Haz clic en **"Save"** o **"Update"**

## ⚠️ Importante

- **NO marques** la casilla "Sensitive" para esta variable (es pública)
- Selecciona **"All Environments"** para que funcione en todos los entornos
- Después de guardar, **haz un redeploy** del frontend

## 🔄 Paso 4: Redeploy Frontend

1. Ve a **"Deployments"** (en el menú superior)
2. Haz clic en los **3 puntos** (⋯) del último deployment
3. Selecciona **"Redeploy"**

O simplemente espera a que Vercel detecte el cambio automáticamente.

## ✅ Verificación

Después del redeploy:
1. Ve a tu frontend: `https://sistema-clinica-alx.vercel.app`
2. Intenta hacer login
3. Las peticiones deberían ir al backend de Railway

---

¿Ya actualizaste la variable? Si tienes dudas en algún paso, dime y te guío.

