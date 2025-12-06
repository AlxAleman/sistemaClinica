# Backend - Sistema de Gestión Clínica

## Setup Inicial

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
Crea un archivo `.env` en la raíz del backend con las siguientes variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/clinica_fisioterapia"
JWT_SECRET="tu-secret-key-aqui"
JWT_REFRESH_SECRET="tu-refresh-secret-key-aqui"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

3. **Configurar base de datos:**
Asegúrate de tener PostgreSQL corriendo y crear la base de datos:
```sql
CREATE DATABASE clinica_fisioterapia;
```

4. **Ejecutar migraciones:**
```bash
npm run prisma:migrate
```

5. **Generar cliente Prisma:**
```bash
npm run prisma:generate
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Inicia el servidor en producción
- `npm run prisma:generate` - Genera el cliente de Prisma
- `npm run prisma:migrate` - Ejecuta migraciones de base de datos
- `npm run prisma:studio` - Abre Prisma Studio (interfaz visual de BD)

## Endpoints Disponibles

### Autenticación

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Renovar token de acceso
- `GET /api/auth/me` - Obtener información del usuario autenticado (requiere token)

### Health Check

- `GET /health` - Verificar estado del servidor

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuraciones (DB, env, CORS)
│   ├── controllers/     # Controladores de rutas
│   ├── middleware/      # Middlewares (auth, error, validation)
│   ├── routes/          # Definición de rutas
│   ├── services/        # Lógica de negocio
│   ├── utils/           # Utilidades (JWT, hash, validators)
│   ├── types/           # Tipos TypeScript
│   └── index.ts         # Punto de entrada
├── prisma/
│   └── schema.prisma    # Schema de base de datos
└── package.json
```

## Testing

Para probar los endpoints, puedes usar:
- Thunder Client (extensión de VSCode)
- Postman
- Insomnia
- curl

### Ejemplo de registro:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinica.com",
    "password": "password123",
    "name": "Administrador",
    "role": "ADMIN"
  }'
```

### Ejemplo de login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinica.com",
    "password": "password123"
  }'
```

