# ✅ Configuración de Vercel - Solo Frontend

## 📝 Configuración en Vercel Dashboard

Ya que eliminamos `vercel.json` (para simplificar), configura manualmente en Vercel:

### 1. Settings > General

- **Root Directory**: `frontend`
- **Framework Preset**: Next.js (Vercel lo detectará automáticamente)
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install` (automático)

### 2. Settings > Environment Variables

Agrega solo esta variable por ahora:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

*(Temporal - la actualizaremos cuando tengamos el backend en Railway)*

### 3. Deploy

Haz click en "Deploy" o "Redeploy"

---

## ✅ Qué Esperar

- ✅ El frontend se desplegará correctamente
- ✅ Verás la página de login
- ⚠️ Las peticiones al backend fallarán (porque aún no está desplegado)
- ✅ Esto es normal y esperado

---

## 🎯 Siguiente Paso

Una vez que el frontend esté desplegado, configuraremos Railway para el backend.

