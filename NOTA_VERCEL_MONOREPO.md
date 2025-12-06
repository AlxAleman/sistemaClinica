# 📝 Nota: Vercel con Monorepo

## ⚠️ Problema Actual

Vercel tiene dificultades con monorepos cuando se usa la configuración `builds` en `vercel.json`. Cada build se ejecuta desde su propio contexto, lo que puede causar problemas con rutas relativas.

## ✅ Solución Recomendada

**Separar Frontend y Backend en proyectos diferentes de Vercel:**

### Opción 1: Dos Proyectos Separados (RECOMENDADO)

1. **Frontend en Vercel:**
   - Crea un proyecto nuevo en Vercel
   - Root Directory: `frontend`
   - Framework: Next.js (detectado automáticamente)
   - Variables: Solo `NEXT_PUBLIC_API_URL`

2. **Backend en Railway/Render:**
   - Despliega el backend en Railway o Render
   - Root Directory: `backend`
   - Variables: Todas las de backend

### Opción 2: Ajustar Configuración Actual

Si quieres mantener todo en un proyecto de Vercel, necesitas:

1. **Eliminar `builds` de vercel.json** y dejar que Vercel detecte automáticamente
2. **O** usar una estructura diferente donde todo esté en la raíz

## 🔧 Configuración Actual

El `vercel.json` actual está simplificado para que Vercel maneje los directorios automáticamente. Si sigue fallando, considera la Opción 1.

