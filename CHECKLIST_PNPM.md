# ✅ Checklist: Migración a pnpm

## 📋 Pasos a Realizar

### 1. Limpieza
- [ ] Eliminar `package-lock.json` de frontend
- [ ] Eliminar `package-lock.json` de backend
- [ ] Eliminar `.npmrc` (o actualizar para pnpm)
- [ ] Limpiar node_modules (opcional, pero recomendado)

### 2. Configuración
- [ ] Actualizar `package.json` del root para usar pnpm
- [ ] Crear `.npmrc` para pnpm (si es necesario)
- [ ] Actualizar `.gitignore` para incluir `pnpm-lock.yaml`
- [ ] Verificar que no esté ignorado `pnpm-lock.yaml`

### 3. Instalación
- [ ] Instalar dependencias con pnpm en frontend
- [ ] Instalar dependencias con pnpm en backend
- [ ] Verificar que `pnpm-lock.yaml` se generó correctamente

### 4. Verificación Local
- [ ] Ejecutar `pnpm run build` en frontend
- [ ] Verificar que no hay errores de TypeScript
- [ ] Verificar que no hay errores de ESLint críticos

### 5. Configuración Vercel
- [ ] Crear/actualizar `vercel.json` para pnpm
- [ ] O configurar en Vercel Dashboard

### 6. Commit
- [ ] Agregar `pnpm-lock.yaml` al commit
- [ ] Eliminar `package-lock.json` del repo
- [ ] Commit con mensaje descriptivo

## ⚠️ Importante
- `pnpm-lock.yaml` DEBE estar en el repositorio
- NO debe estar en `.gitignore`
- Vercel necesita el lockfile para funcionar correctamente

