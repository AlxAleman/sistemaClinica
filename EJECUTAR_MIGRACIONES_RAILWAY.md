# 🗄️ Ejecutar Migraciones de Prisma en Railway

## 📍 Dónde Ejecutar los Comandos

**En tu terminal local (PowerShell)** - La misma terminal que usas para `git`, `npm`, etc.

## 🚀 Pasos Detallados

### Paso 1: Abrir Terminal

1. Abre **PowerShell** o **Terminal** en tu computadora
2. Navega a tu proyecto:
   ```powershell
   cd G:\PROJECTS\Clinica-gestor
   ```

### Paso 2: Instalar Railway CLI

```powershell
npm install -g @railway/cli
```

**Nota:** Si tienes problemas de permisos, ejecuta PowerShell como Administrador.

### Paso 3: Iniciar Sesión en Railway

```powershell
railway login
```

Esto abrirá tu navegador para autenticarte con Railway.

### Paso 4: Conectar al Proyecto

```powershell
railway link
```

Railway te mostrará una lista de proyectos. Selecciona el proyecto que creaste (probablemente "sistema-clinica" o similar).

### Paso 5: Ejecutar Migraciones

```powershell
cd backend
railway run pnpm prisma migrate deploy
```

**O si no tienes pnpm instalado globalmente:**

```powershell
railway run npx prisma migrate deploy
```

## ✅ Verificación

Después de ejecutar las migraciones, deberías ver:

```
✅ Applied migration: 20250101000000_init
✅ Applied migration: 20250101000001_add_patients
...
```

## 🆘 Si Tienes Problemas

### Error: "railway: command not found"
- Verifica que Railway CLI se instaló correctamente
- Intenta: `npm install -g @railway/cli` de nuevo
- O usa: `npx @railway/cli` en lugar de `railway`

### Error: "Not logged in"
- Ejecuta: `railway login` de nuevo

### Error: "No project linked"
- Ejecuta: `railway link` y selecciona tu proyecto

### Error: "pnpm: command not found"
- Usa: `railway run npx prisma migrate deploy` en su lugar

## 📝 Comandos Completos (Copia y Pega)

```powershell
# 1. Ir al directorio del proyecto
cd G:\PROJECTS\Clinica-gestor

# 2. Instalar Railway CLI
npm install -g @railway/cli

# 3. Iniciar sesión
railway login

# 4. Conectar al proyecto
railway link

# 5. Ejecutar migraciones
cd backend
railway run pnpm prisma migrate deploy
```

---

¿Necesitas ayuda con algún paso específico?

