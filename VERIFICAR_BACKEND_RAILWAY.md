# ✅ Verificar que el Backend Esté Funcionando

## 🔍 Qué Buscar en los Logs

Después de "Starting Container", deberías ver:

1. ✅ **"injecting env"** - Variables de entorno cargadas (ya lo ves)
2. ✅ **"Servidor corriendo en puerto 5000"** - Servidor iniciado
3. ✅ **"Ambiente: production"** - Modo producción
4. ✅ **"Frontend URL: https://..."** - URL del frontend configurada

## 🧪 Probar el Backend

### Paso 1: Obtener la URL del Backend

1. En Railway Dashboard, ve a tu servicio
2. Haz clic en **Settings**
3. Busca **"Domains"** o **"Generate Domain"**
4. Railway te dará una URL como: `https://tu-backend.up.railway.app`

### Paso 2: Probar el Endpoint de Health

Abre en tu navegador:
```
https://tu-backend.up.railway.app/health
```

**Deberías ver:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-05T..."
}
```

### Paso 3: Probar el Endpoint Raíz

Abre en tu navegador:
```
https://tu-backend.up.railway.app/
```

**Deberías ver:**
```json
{
  "message": "API de Clínica de Fisioterapia",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth",
    ...
  }
}
```

## ⚠️ Si No Funciona

### Error: "Cannot GET /"
- El servidor está funcionando pero la ruta no existe
- Prueba `/health` en su lugar

### Error: "Connection refused" o timeout
- El servidor no está iniciando correctamente
- Revisa los logs para ver errores

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` esté correcta
- Verifica que Neon permita conexiones desde Railway

## 📋 Checklist

- [ ] Contenedor iniciando
- [ ] Variables de entorno cargadas
- [ ] Servidor corriendo (mensaje en logs)
- [ ] URL del backend obtenida
- [ ] Endpoint `/health` responde correctamente
- [ ] Endpoint `/` responde correctamente

## 🎯 Próximo Paso

Una vez que el backend esté funcionando:
1. Ejecutar migraciones de Prisma
2. Actualizar `NEXT_PUBLIC_API_URL` en Vercel
3. Probar que frontend y backend se comuniquen

