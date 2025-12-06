# ✅ Solución Simple: Usar Solo Una URL de Neon

## 🎯 Si Solo Tienes Una URL

**No te preocupes**, puedes usar la misma URL para ambas variables. Funciona perfectamente.

## 📝 Configuración en Vercel

Simplemente agrega la misma URL en ambas variables:

```
DATABASE_URL=postgresql://neondb_owner:password@ep-round-morning-ahcgwhzk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:password@ep-round-morning-ahcgwhzk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Nota:** Son la misma URL. Esto funciona bien, aunque no es la configuración "óptima". Para la mayoría de casos, es suficiente.

## 🔄 Alternativa: Crear la URL Directa Manualmente

Si quieres optimizar, puedes crear la URL directa quitando `-pooler`:

### Tu URL Actual (con pooling):
```
postgresql://neondb_owner:password@ep-round-morning-ahcgwhzk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### URL Directa (sin pooling):
```
postgresql://neondb_owner:password@ep-round-morning-ahcgwhzk.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Cambio:** Quita `-pooler` del hostname:
- `ep-round-morning-ahcgwhzk-pooler` → `ep-round-morning-ahcgwhzk`

## ✅ Recomendación

**Para empezar:** Usa la misma URL en ambas variables. Es más simple y funciona.

**Para optimizar después:** Cuando tengas tiempo, crea la URL directa quitando `-pooler`.

## 🚀 Siguiente Paso

Una vez que tengas las URLs configuradas en Vercel, continúa con el deployment normal.

