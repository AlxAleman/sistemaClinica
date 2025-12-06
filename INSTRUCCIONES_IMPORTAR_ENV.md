# 📥 Cómo Importar Variables de Entorno en Vercel

## Método 1: Importar desde Archivo (Recomendado)

1. **Abre el archivo `.env.vercel`** en tu editor
2. **Copia TODO el contenido** del archivo
3. **En Vercel**, en la pantalla de configuración del proyecto:
   - Ve a la sección "Environment Variables"
   - Haz click en el botón **"Import .env"**
   - **Pega el contenido** completo del archivo `.env.vercel`
   - Vercel detectará automáticamente todas las variables

4. **IMPORTANTE**: Después de importar:
   - **Edita** `FRONTEND_URL` y `NEXT_PUBLIC_API_URL` con la URL real que Vercel te asigne
   - Esto lo harás después del primer deploy

## Método 2: Agregar Manualmente

Si prefieres agregar una por una:

1. En Vercel, sección "Environment Variables"
2. Para cada variable:
   - Click en "+ Add More"
   - **Key**: El nombre (ej: `DATABASE_URL`)
   - **Value**: El valor (sin comillas)
   - **Environment**: Selecciona "Production" (y también "Preview" y "Development" si quieres)

## 📋 Lista de Variables a Agregar

### Backend (9 variables):
1. `DATABASE_URL`
2. `DIRECT_URL`
3. `JWT_SECRET`
4. `JWT_REFRESH_SECRET`
5. `JWT_EXPIRES_IN`
6. `JWT_REFRESH_EXPIRES_IN`
7. `NODE_ENV`
8. `PORT`
9. `FRONTEND_URL` (actualizar después del deploy)

### Frontend (1 variable):
10. `NEXT_PUBLIC_API_URL` (actualizar después del deploy)

## ⚠️ Recordatorios

- **NO** subas el archivo `.env.vercel` a GitHub (ya está en `.gitignore`)
- **Actualiza** `FRONTEND_URL` y `NEXT_PUBLIC_API_URL` después del primer deploy
- Las variables son **sensibles**, mantenlas seguras

## ✅ Después de Importar

1. Verifica que todas las variables estén agregadas
2. Haz click en "Deploy"
3. Después del deploy, actualiza las URLs con la URL real de Vercel

