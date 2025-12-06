# Inicio Rápido

## 1. Configurar Base de Datos

### Opción A: PostgreSQL Local
1. Instala PostgreSQL
2. Crea la base de datos: `CREATE DATABASE clinica_fisioterapia;`
3. Configura `.env` con:
   ```
   DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/clinica_fisioterapia"
   ```

### Opción B: Docker (Más fácil)
```bash
docker run --name postgres-clinica \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=clinica_fisioterapia \
  -p 5432:5432 \
  -d postgres:14
```

Luego en `.env`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/clinica_fisioterapia"
```

## 2. Configurar Backend

```bash
cd backend

# Crear archivo .env (si no existe)
# Copia las variables de .env.example y ajusta DATABASE_URL

# Instalar dependencias (si no lo has hecho)
npm install

# Ejecutar migraciones
npm run prisma:migrate

# Iniciar servidor
npm run dev
```

El backend estará en `http://localhost:5000`

## 3. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Iniciar servidor
npm run dev
```

El frontend estará en `http://localhost:3000`

## 4. Probar

1. Abre `http://localhost:3000`
2. Serás redirigido a `/login`
3. Crea una cuenta con "Registrarse"
4. Inicia sesión
5. Verás el dashboard

## Comandos Útiles

### Backend
- `npm run dev` - Desarrollo
- `npm run build` - Compilar
- `npm run prisma:studio` - Ver BD visualmente
- `npm run prisma:migrate` - Ejecutar migraciones

### Frontend
- `npm run dev` - Desarrollo
- `npm run build` - Compilar para producción
- `npm run start` - Producción

