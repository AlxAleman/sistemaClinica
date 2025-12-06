# Iniciar Base de Datos con Docker

## Si tienes Docker instalado:

### Opción 1: Docker Compose (Recomendado)
```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Esto iniciará PostgreSQL en el puerto 5432.

### Opción 2: Docker directo
```bash
docker run --name postgres-clinica \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=clinica_fisioterapia \
  -p 5432:5432 \
  -d postgres:14
```

## Configurar .env

Una vez que PostgreSQL esté corriendo, configura `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/clinica_fisioterapia"
JWT_SECRET="tu-secret-key-muy-seguro-cambiar-en-produccion"
JWT_REFRESH_SECRET="tu-refresh-secret-key-muy-seguro-cambiar-en-produccion"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

## Ejecutar Migraciones

```bash
cd backend
npm run prisma:migrate
```

## Verificar que está corriendo

```bash
docker ps
```

Deberías ver el contenedor `postgres-clinica` corriendo.

## Detener la base de datos

```bash
docker-compose down
# O si usaste docker run:
docker stop postgres-clinica
docker rm postgres-clinica
```

