# 🔧 Configuración de Neon con Prisma

## 📋 Connection Strings de Neon

Neon te proporciona **dos connection strings**:

### 1. Connection String con Pooling (para queries)
- Hostname incluye `-pooler`
- Usar para: Queries normales, operaciones CRUD
- Variable: `DATABASE_URL`
- Ejemplo: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`

### 2. Connection String Directa (para migraciones)
- Hostname NO incluye `-pooler`
- Usar para: Migraciones de Prisma
- Variable: `DIRECT_URL`
- Ejemplo: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

## 🔍 Cómo obtener ambas URLs en Neon

1. En el modal de conexión, selecciona **"Prisma"**
2. Verás dos URLs:
   - **Connection string** (con pooling) → `DATABASE_URL`
   - **Direct connection** (sin pooling) → `DIRECT_URL`

O puedes:
- Cambiar el hostname manualmente:
  - Con pooling: `ep-xxx-pooler.region.aws.neon.tech`
  - Sin pooling: `ep-xxx.region.aws.neon.tech`

## ⚙️ Configuración en Vercel

Agrega estas **dos variables de entorno** en Vercel:

```
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

## ✅ Ventajas de esta configuración

- **Connection Pooling**: Mejor rendimiento en serverless (Vercel)
- **Migraciones**: Funcionan correctamente con conexión directa
- **Optimizado**: Cada tipo de operación usa la conexión adecuada

## 📝 Nota

Si solo tienes una URL (con pooling), también funciona, pero las migraciones pueden ser más lentas. La configuración con dos URLs es la **mejor práctica** para Neon + Prisma.

