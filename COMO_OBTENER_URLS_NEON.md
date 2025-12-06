# 🔍 Cómo Obtener las URLs de Neon

## Método 1: Desde el Modal de Conexión

### Paso 1: Abre el Modal de Conexión
1. En tu proyecto de Neon, busca el botón **"Connect"** o **"Connection Details"**
2. Se abrirá un modal con las opciones de conexión

### Paso 2: Selecciona "Prisma"
1. En el dropdown que dice "psql", selecciona **"Prisma"**
2. Verás la connection string formateada para Prisma

### Paso 3: Busca las Dos URLs

**Opción A: Si ves dos pestañas o secciones:**
- **Connection string** (con pooling) → `DATABASE_URL`
- **Direct connection** (sin pooling) → `DIRECT_URL`

**Opción B: Si solo ves una URL:**
- Esa URL probablemente tiene `-pooler` en el hostname
- Para obtener la directa, simplemente **quita `-pooler`** del hostname

## Método 2: Desde el Dashboard de Neon

1. Ve a tu proyecto en Neon
2. Busca la sección **"Connection Details"** o **"Connection String"**
3. Deberías ver:
   - **Pooled connection** (con `-pooler`)
   - **Direct connection** (sin `-pooler`)

## Método 3: Crear la URL Directa Manualmente

Si solo tienes la URL con pooling, puedes crear la directa:

### Ejemplo:

**URL con Pooling (la que tienes):**
```
postgresql://neondb_owner:password@ep-round-morning-ahcgwhzk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**URL Directa (quita `-pooler`):**
```
postgresql://neondb_owner:password@ep-round-morning-ahcgwhzk.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Cambio:** `ep-round-morning-ahcgwhzk-pooler` → `ep-round-morning-ahcgwhzk`

## Método 4: Usar Solo Una URL (Solución Simple)

Si no encuentras la URL directa, **puedes usar la misma URL para ambas variables**. Funciona, aunque no es la configuración óptima:

```
DATABASE_URL=postgresql://...-pooler... (tu URL con pooling)
DIRECT_URL=postgresql://...-pooler... (la misma URL)
```

## 📸 Dónde Buscar en Neon

1. **Dashboard del Proyecto:**
   - Panel izquierdo → "Connection Details"
   - O busca el botón "Connect" / "Connection string"

2. **En el Modal de Conexión:**
   - Pestaña "Connection string" → URL con pooling
   - Pestaña "Direct connection" → URL sin pooling (si está disponible)

3. **Settings del Proyecto:**
   - Settings → Connection Pooling
   - Ahí deberías ver ambas opciones

## ✅ Verificación

Para verificar que tienes la URL correcta:

**URL con Pooling debe tener:**
- `-pooler` en el hostname
- Ejemplo: `ep-xxx-pooler.region.aws.neon.tech`

**URL Directa NO debe tener:**
- `-pooler` en el hostname
- Ejemplo: `ep-xxx.region.aws.neon.tech`

## 🆘 Si No Encuentras la URL Directa

**No te preocupes**, puedes:
1. Usar la misma URL para ambas (funciona)
2. O simplemente quitar `-pooler` del hostname manualmente

