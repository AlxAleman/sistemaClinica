# ✅ Configuración de Vercel para pnpm

## 📋 Valores a Configurar en Vercel Dashboard

### 1. **Framework Preset**
```
Next.js ✅ (ya está correcto)
```

### 2. **Root Directory**
```
frontend ✅ (ya está correcto)
```

### 3. **Build Command**
**Cambiar de:** `npm run build` o `next build`  
**A:**
```
pnpm run build
```

**O puedes dejarlo en:** `next build` (Next.js lo detecta automáticamente)

### 4. **Output Directory**
```
.next ✅ (Next.js default - correcto)
```

### 5. **Install Command** ⚠️ IMPORTANTE
**Cambiar de:** `npm install`  
**A:**
```
pnpm install --frozen-lockfile
```

**¿Por qué `--frozen-lockfile`?**
- Garantiza que use exactamente las versiones del `pnpm-lock.yaml`
- Evita actualizaciones inesperadas
- Más seguro para producción

### 6. **Environment Variables**

Por ahora, deja:
```
NEXT_PUBLIC_API_URL = http://localhost:5000/api
```

**Nota:** Esto es temporal. Cuando tengas el backend desplegado (Railway/Render), actualiza esta URL con la URL real del backend.

---

## 🎯 Resumen de Cambios Necesarios

| Campo | Valor Actual | Valor Correcto |
|-------|--------------|----------------|
| Framework Preset | Next.js ✅ | Next.js ✅ |
| Root Directory | frontend ✅ | frontend ✅ |
| Build Command | `npm run build` | `pnpm run build` |
| Output Directory | `.next` ✅ | `.next` ✅ |
| **Install Command** | `npm install` ⚠️ | `pnpm install --frozen-lockfile` |

---

## ✅ Después de Configurar

1. Haz clic en **"Deploy"**
2. Vercel detectará `pnpm-lock.yaml` automáticamente
3. Usará pnpm para instalar dependencias
4. El build debería funcionar correctamente

---

## 🔍 Verificación

Si todo está bien configurado, verás en los logs de Vercel:
```
Running "install" command: `pnpm install --frozen-lockfile`...
```

Y no:
```
Running "install" command: `npm install`...
```

