# 📍 Cómo Configurar Root Directory en Railway

## ⚠️ Importante: Root Directory está en el SERVICIO, no en el PROYECTO

### Paso 1: Ir al Servicio (No al Proyecto)

1. En Railway Dashboard, verás tu **Proyecto** (ej: "sistema-clinica")
2. **Haz clic en el servicio** dentro del proyecto (debería tener un nombre como "backend" o el nombre de tu repo)
3. **NO** hagas clic en "Settings" del proyecto, haz clic en el **servicio específico**

### Paso 2: Configurar Root Directory

Una vez dentro del servicio:

1. Haz clic en la pestaña **"Settings"** (del servicio, no del proyecto)
2. Busca la sección **"Source"** o **"Deploy"**
3. Busca **"Root Directory"** o **"Working Directory"**
4. Escribe: `backend`
5. Guarda los cambios

### Paso 3: Si No Encuentras Root Directory

Si no ves la opción "Root Directory", puedes configurarlo de estas formas:

#### Opción A: Configurar en Settings → Deploy

1. Ve a **Settings** → **Deploy**
2. Busca **"Build Command"** y escribe:
   ```bash
   cd backend && pnpm install && pnpm run build && pnpm prisma generate
   ```
3. Busca **"Start Command"** y escribe:
   ```bash
   cd backend && node dist/index.js
   ```

#### Opción B: Eliminar y Recrear el Servicio

1. Elimina el servicio actual
2. Crea un nuevo servicio desde GitHub
3. Cuando Railway te pregunte por el repositorio, después de seleccionarlo:
   - Busca la opción **"Configure"** o **"Advanced"**
   - Ahí deberías ver **"Root Directory"**
   - Escribe: `backend`

#### Opción C: Usar Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Iniciar sesión
railway login

# Conectar al proyecto
railway link

# Configurar root directory
railway variables set RAILWAY_ROOT_DIRECTORY=backend
```

## 🔍 Dónde Buscar en Railway Dashboard

### Estructura de Railway:

```
Proyecto (sistema-clinica)
  └── Servicio (backend o nombre del repo)
       └── Settings ← AQUÍ está Root Directory
            ├── Source
            ├── Deploy
            └── Variables
```

### Navegación Correcta:

1. **Dashboard Principal** → Verás tu proyecto
2. **Haz clic en el proyecto** → Verás los servicios
3. **Haz clic en el servicio** (el que tiene el código)
4. **Settings** (del servicio, no del proyecto)
5. Busca **"Source"** o **"Deploy"**

## ✅ Alternativa Rápida: Configurar Comandos Manualmente

Si no encuentras Root Directory, configura estos comandos en **Settings → Deploy**:

**Build Command:**
```bash
cd backend && pnpm install && pnpm run build && pnpm prisma generate
```

**Start Command:**
```bash
cd backend && node dist/index.js
```

Esto le dice a Railway que ejecute todo desde la carpeta `backend/`.

## 🆘 Si Nada Funciona

Puedes crear un servicio nuevo específicamente para el backend:

1. En tu proyecto, haz clic en **"New"**
2. Selecciona **"GitHub Repo"**
3. Selecciona tu repositorio
4. En la configuración, busca **"Root Directory"** o **"Configure"**
5. Escribe: `backend`
6. Railway creará un nuevo servicio apuntando directamente a `backend/`

