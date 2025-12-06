# ✅ Configuración de Base de Datos - IMPORTANTE

## Estado Actual

PostgreSQL está corriendo en Docker en el **puerto 5433** (porque el 5432 está ocupado).

## Configuración Requerida

### 1. Actualizar `backend/.env`

Abre el archivo `backend/.env` y asegúrate de que tenga:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/clinica_fisioterapia"
JWT_SECRET="tu-secret-key-muy-seguro-cambiar-en-produccion"
JWT_REFRESH_SECRET="tu-refresh-secret-key-muy-seguro-cambiar-en-produccion"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

**⚠️ IMPORTANTE:** El puerto es **5433**, no 5432.

### 2. Ejecutar Migraciones

Una vez configurado el `.env` correctamente:

```bash
cd backend
npm run prisma:migrate
```

Esto creará todas las tablas en la base de datos.

### 3. Verificar

Puedes verificar que todo funciona:

```bash
# Ver contenedor corriendo
docker ps

# Ver base de datos con Prisma Studio
cd backend
npm run prisma:studio
```

## Comandos Útiles

### Iniciar PostgreSQL
```bash
docker-compose up -d
```

### Detener PostgreSQL
```bash
docker-compose down
```

### Ver logs
```bash
docker-compose logs postgres
```

### Conectar directamente
```bash
docker exec -it postgres-clinica psql -U postgres -d clinica_fisioterapia
```

