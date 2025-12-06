# Solución al Error de Autenticación

## Problema
El contenedor PostgreSQL puede tener una contraseña diferente o necesitar reiniciarse.

## Solución Paso a Paso

### Opción 1: Reiniciar el contenedor (Recomendado)

1. **Detener y eliminar el contenedor actual:**
```bash
docker stop postgres-clinica
docker rm postgres-clinica
```

2. **Iniciar nuevamente con docker-compose:**
```bash
docker-compose up -d
```

Esto creará el contenedor con la contraseña "password" configurada.

### Opción 2: Verificar y cambiar la contraseña

Si el contenedor ya está corriendo, puedes cambiar la contraseña:

1. **Conectarse al contenedor:**
```bash
docker exec -it postgres-clinica bash
```

2. **Dentro del contenedor, conectarse a PostgreSQL:**
```bash
psql -U postgres
```

3. **Cambiar la contraseña:**
```sql
ALTER USER postgres WITH PASSWORD 'password';
\q
exit
```

### Opción 3: Verificar la configuración actual

Verifica que el contenedor tenga la configuración correcta:

```bash
docker inspect postgres-clinica | findstr POSTGRES_PASSWORD
```

Debería mostrar: `"POSTGRES_PASSWORD=password"`

## Una vez solucionado

Ejecuta las migraciones:

```bash
cd backend
npm run prisma:migrate
```

## Si sigue fallando

Puedes probar con una conexión directa para verificar:

```bash
docker exec -it postgres-clinica psql -U postgres -d clinica_fisioterapia -c "SELECT 1;"
```

Si esto funciona, el problema está en el formato de la DATABASE_URL en el .env.

## DATABASE_URL correcta

Asegúrate de que `backend/.env` tenga exactamente:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/clinica_fisioterapia"
```

**Sin espacios, sin comillas adicionales, exactamente así.**

