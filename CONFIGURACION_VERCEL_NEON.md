# ✅ Configuración de Variables en Vercel con Neon

## 📋 Variables de Entorno para Vercel

Usa estas variables exactas en Vercel Dashboard > Settings > Environment Variables:

### Para BACKEND:

```
DATABASE_URL=postgresql://neondb_owner:npg_X2mskJizGE6O@ep-round-morning-ahcgwhzk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DIRECT_URL=postgresql://neondb_owner:npg_X2mskJizGE6O@ep-round-morning-ahcgwhzk.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=tu-jwt-secret-generado-anteriormente
JWT_REFRESH_SECRET=tu-refresh-secret-generado-anteriormente
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://tu-proyecto.vercel.app
PORT=5000
```

### Para FRONTEND:

```
NEXT_PUBLIC_API_URL=https://tu-proyecto.vercel.app/api
```

## 🔑 Notas Importantes

1. **DATABASE_URL**: URL con pooling (`-pooler`) - para queries normales
2. **DIRECT_URL**: URL sin pooling - para migraciones (es la `DATABASE_URL_UNPOOLED` de Neon)
3. **Sin comillas**: En Vercel, NO pongas comillas alrededor de los valores
4. **Password visible**: La contraseña `npg_X2mskJizGE6O` está visible aquí, pero en Vercel estará segura

## ⚠️ Seguridad

- **NUNCA** subas estas URLs a GitHub
- Vercel encripta las variables de entorno
- Solo tú y tu equipo autorizado pueden verlas

## ✅ Checklist

- [ ] `DATABASE_URL` configurada (con `-pooler`)
- [ ] `DIRECT_URL` configurada (sin `-pooler`)
- [ ] JWT secrets generados y configurados
- [ ] `FRONTEND_URL` actualizada con tu URL de Vercel
- [ ] `NEXT_PUBLIC_API_URL` configurada en frontend

## 🚀 Siguiente Paso

Una vez configuradas las variables, haz deploy y luego ejecuta las migraciones.

