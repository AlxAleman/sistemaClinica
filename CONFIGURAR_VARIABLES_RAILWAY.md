# 🔧 Configurar Variables de Entorno en Railway

## ⚠️ Problema Actual

El backend está iniciando pero no encuentra las variables de entorno:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

## ✅ Solución: Agregar Variables en Railway

### Paso 1: Ir a Variables de Entorno

1. En **Railway Dashboard**, ve a tu **servicio** (backend)
2. Haz clic en la pestaña **"Variables"**
3. Haz clic en **"New Variable"** o **"Add Variable"**

### Paso 2: Agregar Cada Variable (Una por Una)

Agrega estas variables **una por una**:

#### 1. DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://neondb_owner:npg_X2mskJizGE6O@ep-round-morning-ahcgwhzk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### 2. DIRECT_URL
```
Key: DIRECT_URL
Value: postgresql://neondb_owner:npg_X2mskJizGE6O@ep-round-morning-ahcgwhzk.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### 3. JWT_SECRET
```
Key: JWT_SECRET
Value: 707f1c5ddf777c2ab213942c193c5afefa47d10261d2f522eff7067d864fb4f290650a04316f01ae34ff63e0226764a3bc9b1c292c83af23798fbb37ee018094
```

#### 4. JWT_REFRESH_SECRET
```
Key: JWT_REFRESH_SECRET
Value: beffb572dd2b48e51cb86e46e7786b3e4a3fe1b352a6c9dcad8e27fca5dcb950f4660c3eaed4b7063fcab3862c1133140488bb845a336a259c4ad760c6e3fb95
```

#### 5. JWT_EXPIRES_IN
```
Key: JWT_EXPIRES_IN
Value: 24h
```

#### 6. JWT_REFRESH_EXPIRES_IN
```
Key: JWT_REFRESH_EXPIRES_IN
Value: 7d
```

#### 7. NODE_ENV
```
Key: NODE_ENV
Value: production
```

#### 8. PORT
```
Key: PORT
Value: 5000
```

#### 9. FRONTEND_URL
```
Key: FRONTEND_URL
Value: https://tu-proyecto.vercel.app
```
**⚠️ IMPORTANTE:** Reemplaza `tu-proyecto` con la URL real de tu frontend en Vercel.

### Paso 3: Guardar y Redeploy

1. Después de agregar todas las variables, **guarda** los cambios
2. Railway debería hacer un **redeploy automático**
3. Si no, haz un **redeploy manual**

### Paso 4: Verificar

Después del redeploy, revisa los logs. Deberías ver:
- ✅ Sin advertencias de variables faltantes
- ✅ "Servidor corriendo en puerto 5000"
- ✅ Conexión a la base de datos exitosa

## 📋 Checklist de Variables

- [ ] DATABASE_URL
- [ ] DIRECT_URL
- [ ] JWT_SECRET
- [ ] JWT_REFRESH_SECRET
- [ ] JWT_EXPIRES_IN
- [ ] JWT_REFRESH_EXPIRES_IN
- [ ] NODE_ENV
- [ ] PORT
- [ ] FRONTEND_URL

## 🆘 Si No Funciona

1. **Verifica que las variables estén en el servicio correcto** (no en el proyecto)
2. **Verifica que no haya espacios** antes o después de los valores
3. **Haz un redeploy manual** después de agregar las variables
4. **Revisa los logs** para ver si hay otros errores

