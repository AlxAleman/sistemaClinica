# 🚀 Guía Completa: Deploy en Vercel Paso a Paso

## 📋 Pre-requisitos

- [x] ✅ Código en GitHub (o listo para subir)
- [x] ✅ Base de datos Neon creada
- [x] ✅ URLs de conexión de Neon
- [ ] ⏳ JWT secrets generados
- [ ] ⏳ Proyecto en Vercel

---

## Paso 1: Generar JWT Secrets

Primero, genera los secrets JWT que necesitarás:

```bash
# Abre PowerShell o Terminal en la carpeta backend
cd backend

# Genera JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copia el resultado (será algo como: a1b2c3d4e5f6...)

# Genera JWT_REFRESH_SECRET (ejecuta de nuevo)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copia este resultado también
```

**Guarda ambos secrets** en un lugar seguro (notas, documento temporal, etc.)

---

## Paso 2: Subir Código a GitHub (si no lo has hecho)

### Si ya tienes GitHub:
```bash
# En la raíz del proyecto
git add .
git commit -m "Preparado para deployment en Vercel"
git push
```

### Si NO tienes GitHub aún:

1. Ve a [github.com](https://github.com)
2. Crea una cuenta (si no tienes)
3. Click en "New repository"
4. Nombre: `clinica-gestor` (o el que prefieras)
5. **NO** marques "Initialize with README"
6. Click "Create repository"
7. Luego ejecuta:

```bash
# En la raíz de tu proyecto
git init
git add .
git commit -m "Initial commit - Sistema de Gestión Clínica"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

---

## Paso 3: Crear Proyecto en Vercel

1. **Ve a [vercel.com](https://vercel.com)**
2. **Inicia sesión** con GitHub (recomendado) o email
3. **Click en "Add New Project"** o "New Project"
4. **Importa tu repositorio:**
   - Si usaste GitHub, verás tu repositorio en la lista
   - Click en "Import" al lado de tu repositorio
5. **Configuración del proyecto:**
   - **Framework Preset**: Vercel lo detectará automáticamente (Next.js)
   - **Root Directory**: `.` (raíz del proyecto) o déjalo vacío
   - **Build Command**: Vercel lo detectará automáticamente
   - **Output Directory**: Vercel lo detectará automáticamente
   - **Install Command**: `npm install` (o déjalo por defecto)

6. **NO hagas click en "Deploy" todavía** - primero configuraremos las variables de entorno

---

## Paso 4: Configurar Variables de Entorno

**ANTES de hacer deploy**, configura las variables:

### 4.1. En la misma pantalla de configuración, busca "Environment Variables"

O después de crear el proyecto, ve a:
**Settings > Environment Variables**

### 4.2. Agrega estas variables (una por una):

#### Para PRODUCTION (todas las variables):

**1. DATABASE_URL** (con pooling):
```
postgresql://neondb_owner:npg_X2mskJizGE6O@ep-round-morning-ahcgwhzk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**2. DIRECT_URL** (sin pooling):
```
postgresql://neondb_owner:npg_X2mskJizGE6O@ep-round-morning-ahcgwhzk.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**3. JWT_SECRET**:
```
(pega aquí el primer secret que generaste)
```

**4. JWT_REFRESH_SECRET**:
```
(pega aquí el segundo secret que generaste)
```

**5. JWT_EXPIRES_IN**:
```
24h
```

**6. JWT_REFRESH_EXPIRES_IN**:
```
7d
```

**7. NODE_ENV**:
```
production
```

**8. PORT**:
```
5000
```

**9. FRONTEND_URL**:
```
https://tu-proyecto.vercel.app
```
*(Reemplaza "tu-proyecto" con el nombre que Vercel te asigne, o actualízalo después del primer deploy)*

**10. NEXT_PUBLIC_API_URL** (para frontend):
```
https://tu-proyecto.vercel.app/api
```
*(Mismo nombre que FRONTEND_URL)*

### 4.3. Para cada variable:
- **Key**: El nombre (ej: `DATABASE_URL`)
- **Value**: El valor (sin comillas)
- **Environment**: Selecciona **Production** (y también **Preview** y **Development** si quieres)

---

## Paso 5: Hacer el Primer Deploy

1. **Click en "Deploy"** o "Deploy Project"
2. **Espera** a que termine el build (puede tomar 2-5 minutos)
3. **Anota la URL** que te da Vercel (algo como: `tu-proyecto.vercel.app`)

---

## Paso 6: Actualizar FRONTEND_URL

Después del primer deploy:

1. Ve a **Settings > Environment Variables**
2. Busca `FRONTEND_URL` y `NEXT_PUBLIC_API_URL`
3. **Edítalas** con la URL real que Vercel te dio:
   ```
   FRONTEND_URL=https://tu-proyecto-real.vercel.app
   NEXT_PUBLIC_API_URL=https://tu-proyecto-real.vercel.app/api
   ```
4. **Haz un nuevo deploy** (Vercel lo hará automáticamente o click en "Redeploy")

---

## Paso 7: Ejecutar Migraciones de Base de Datos

Después del primer deploy exitoso, necesitas ejecutar las migraciones:

### Opción A: Desde Vercel CLI (Recomendado)

```bash
# Instala Vercel CLI globalmente
npm install -g vercel

# Conecta con tu proyecto
vercel link

# Descarga las variables de entorno
vercel env pull .env.production

# Ve a la carpeta backend
cd backend

# Ejecuta las migraciones
npx prisma migrate deploy
```

### Opción B: Desde Neon Dashboard

1. Ve al dashboard de Neon
2. Abre "SQL Editor"
3. Copia el contenido de tus migraciones desde:
   `backend/prisma/migrations/[nombre-migracion]/migration.sql`
4. Ejecuta el SQL en Neon

### Opción C: Desde Local (con variables de Vercel)

```bash
# Descarga variables de Vercel
vercel env pull .env.production

# Configura DATABASE_URL y DIRECT_URL en .env.production
# Luego:
cd backend
npx prisma migrate deploy
```

---

## Paso 8: Verificar que Todo Funciona

1. **Visita tu URL de Vercel**: `https://tu-proyecto.vercel.app`
2. **Deberías ver** la página de login
3. **Prueba crear una cuenta** o hacer login
4. **Revisa los logs** en Vercel Dashboard > Deployments > [último deploy] > Functions

---

## ✅ Checklist Final

- [ ] Código subido a GitHub
- [ ] Proyecto creado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Primer deploy completado
- [ ] FRONTEND_URL actualizada con URL real
- [ ] Migraciones ejecutadas
- [ ] Aplicación funcionando

---

## 🆘 Problemas Comunes

### Error: "Cannot find module '@prisma/client'"
**Solución**: Verifica que `postinstall` esté en `package.json` del backend

### Error: "Database connection failed"
**Solución**: 
- Verifica que `DATABASE_URL` y `DIRECT_URL` estén correctas
- Verifica que no tengan comillas
- Verifica que la base de datos permita conexiones externas

### Error: "Build failed"
**Solución**:
- Revisa los logs en Vercel
- Verifica que todas las dependencias estén en `package.json`
- Verifica que no haya errores de TypeScript

### Las migraciones no se ejecutan
**Solución**:
- Ejecuta manualmente: `npx prisma migrate deploy`
- O desde Vercel CLI: `vercel exec -- npm run prisma:migrate:deploy`

---

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en:
- **Frontend**: `https://tu-proyecto.vercel.app`
- **Backend API**: `https://tu-proyecto.vercel.app/api`

---

## 📚 Próximos Pasos

1. Configurar dominio personalizado (opcional)
2. Configurar CI/CD automático
3. Monitoreo y logs
4. Optimizaciones de performance

¡Éxito con tu deployment! 🚀

