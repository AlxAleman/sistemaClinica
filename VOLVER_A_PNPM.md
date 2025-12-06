# 🔄 Volver a usar pnpm

## ¿Por qué se cambió a npm?

Se cambió temporalmente a npm porque Vercel estaba teniendo problemas con `pnpm-lock.yaml`:
- Error: `ERR_PNPM_OUTDATED_LOCKFILE`
- El lockfile no estaba sincronizado con el `package.json` del root

## ✅ Ventajas de pnpm

- ⚡ **Más rápido** que npm
- 💾 **Más eficiente** con espacio (hard links)
- 🔒 **Mejor manejo de dependencias** (evita duplicados)
- 📦 **Mejor para monorepos**

## 🚀 Cómo volver a pnpm

### Paso 1: Instalar pnpm (si no lo tienes)
```bash
npm install -g pnpm
```

### Paso 2: Eliminar node_modules y lockfiles de npm
```bash
# En la raíz
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json
```

### Paso 3: Instalar con pnpm
```bash
# En la raíz (si tienes workspace)
pnpm install

# O en cada carpeta
cd frontend && pnpm install
cd ../backend && pnpm install
```

### Paso 4: Configurar Vercel para pnpm

**Opción A: Automático (Recomendado)**
- Vercel detecta automáticamente `pnpm-lock.yaml`
- Solo asegúrate de que el lockfile esté actualizado

**Opción B: Manual en Vercel Dashboard**
1. Ve a Settings > General
2. En "Package Manager", selecciona `pnpm`
3. O agrega en `vercel.json`:
```json
{
  "installCommand": "pnpm install"
}
```

### Paso 5: Actualizar .gitignore
Asegúrate de que `.gitignore` incluya:
```
# pnpm
pnpm-lock.yaml  # NO ignorar - debe estar en el repo
.pnpm-store/
```

### Paso 6: Configurar package.json del root (opcional)
```json
{
  "packageManager": "pnpm@8.15.0"
}
```

## ⚠️ Importante

1. **Commit el `pnpm-lock.yaml`**: Debe estar en el repositorio
2. **Mantener sincronizado**: Siempre ejecuta `pnpm install` después de cambios en `package.json`
3. **En Vercel**: El lockfile debe estar actualizado antes de hacer push

## 🔧 Si tienes problemas

### Error: Lockfile desactualizado
```bash
# Regenerar lockfile
rm pnpm-lock.yaml
pnpm install
git add pnpm-lock.yaml
git commit -m "Actualizar pnpm-lock.yaml"
```

### Vercel no detecta pnpm
Agrega en `vercel.json`:
```json
{
  "installCommand": "pnpm install --frozen-lockfile"
}
```

## ✅ Verificación

Para verificar que todo funciona:
```bash
# Local
cd frontend
pnpm run build

# Si funciona localmente, debería funcionar en Vercel
```

