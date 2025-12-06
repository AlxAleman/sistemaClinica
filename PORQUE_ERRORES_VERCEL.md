# ¿Por qué aparecen errores en Vercel pero no en local?

## 🔍 Razones Principales

### 1. **Modo Desarrollo vs Producción**
- **Local (`npm run dev`)**: Next.js en modo desarrollo es más permisivo
  - No ejecuta verificación completa de tipos
  - Permite algunos errores de TypeScript para que el servidor funcione más rápido
  - Solo muestra warnings en consola, no bloquea

- **Vercel (`npm run build`)**: Build de producción es estricto
  - Ejecuta verificación completa de tipos de TypeScript
  - **Falla el build si hay errores de tipos**
  - Más estricto con `undefined`, `null`, y tipos opcionales

### 2. **TypeScript Strict Mode**
Tu `tsconfig.json` tiene `"strict": true`, lo cual es bueno, pero significa:
- Detecta todos los posibles `undefined`
- No permite asignaciones de tipos incompatibles
- En desarrollo puede "perdonar" algunos errores, en producción NO

### 3. **Diferentes Contextos de Ejecución**
- **Local**: Puede tener caché, tipos inferidos más flexibles
- **Vercel**: Ambiente limpio, sin caché, verificación desde cero

## ✅ Solución: Detectar Errores Antes de Push

### Opción 1: Ejecutar Build Localmente (RECOMENDADO)
```bash
cd frontend
npm run build
```

Esto ejecutará la misma verificación que Vercel y detectará los errores antes de hacer push.

### Opción 2: Agregar Script de Pre-commit
Puedes agregar un script que verifique tipos antes de hacer commit.

### Opción 3: Type-Check en CI/CD
Agregar verificación de tipos en GitHub Actions (si usas CI/CD).

## 🎯 Los Errores que Corregimos

Todos los errores eran del mismo tipo:
- **Valores `undefined`** que TypeScript detecta en modo estricto
- **Tipos incompatibles** (`string | undefined` vs `string`)

Estos errores **existen en tu código**, pero en desarrollo Next.js los "perdona" para que puedas seguir trabajando. En producción, TypeScript es estricto y los detecta.

## 💡 Recomendación

**Siempre ejecuta `npm run build` localmente antes de hacer push a producción.**

Esto te ahorrará tiempo y detectará estos errores antes de que Vercel los encuentre.

