# 🚀 Setup Rápido para Vercel

## Comandos Rápidos

### 1. Instalar dependencia de Vercel

```bash
cd backend
npm install @vercel/node --save-dev
```

### 2. Generar JWT Secrets

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT_REFRESH_SECRET (ejecuta de nuevo)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Crear Base de Datos

**Neon (Recomendado):**
1. Ve a https://neon.tech
2. Crea cuenta y proyecto
3. Copia la connection string

### 4. Configurar en Vercel

1. Ve a vercel.com
2. Importa tu repositorio
3. Agrega estas variables de entorno:

**Frontend:**
```
NEXT_PUBLIC_API_URL=https://tu-proyecto.vercel.app/api
```

**Backend:**
```
DATABASE_URL=postgresql://... (de Neon)
JWT_SECRET=... (generado en paso 2)
JWT_REFRESH_SECRET=... (generado en paso 2)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://tu-proyecto.vercel.app
PORT=5000
```

### 5. Ejecutar Migraciones

Después del primer deploy:

```bash
vercel env pull .env.production
cd backend
npx prisma migrate deploy
```

---

## ✅ Checklist

- [ ] `@vercel/node` instalado
- [ ] JWT secrets generados
- [ ] Base de datos creada (Neon)
- [ ] Variables de entorno en Vercel
- [ ] Migraciones ejecutadas

¡Listo! 🎉

