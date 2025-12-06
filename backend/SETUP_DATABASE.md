# Configuración de Base de Datos

## Paso 1: Instalar PostgreSQL

Si no tienes PostgreSQL instalado:
- Descarga desde: https://www.postgresql.org/download/windows/
- O usa Docker: `docker run --name postgres-clinica -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14`

## Paso 2: Crear Base de Datos

Abre PostgreSQL (pgAdmin o línea de comandos) y ejecuta:

```sql
CREATE DATABASE clinica_fisioterapia;
```

O desde la línea de comandos:
```bash
psql -U postgres
CREATE DATABASE clinica_fisioterapia;
\q
```

## Paso 3: Configurar .env

Asegúrate de que tu archivo `backend/.env` tenga:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/clinica_fisioterapia"
JWT_SECRET="tu-secret-key-muy-seguro-aqui"
JWT_REFRESH_SECRET="tu-refresh-secret-key-muy-seguro-aqui"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

**Ejemplo con usuario por defecto:**
```env
DATABASE_URL="postgresql://postgres:tu_contraseña@localhost:5432/clinica_fisioterapia"
```

## Paso 4: Ejecutar Migraciones

Una vez configurado el `.env`, ejecuta:

```bash
cd backend
npm run prisma:migrate
```

Esto creará todas las tablas en la base de datos.

## Paso 5: Verificar

Puedes usar Prisma Studio para ver la base de datos:

```bash
npm run prisma:studio
```

Se abrirá en `http://localhost:5555`

## Solución de Problemas

### Error: "Can't reach database server"
- Verifica que PostgreSQL esté corriendo
- Verifica el puerto (debe ser 5432 por defecto)
- Verifica usuario y contraseña en DATABASE_URL

### Error: "database does not exist"
- Crea la base de datos primero (paso 2)

### Error: "password authentication failed"
- Verifica la contraseña en DATABASE_URL
- Puede que necesites cambiar la contraseña de PostgreSQL

