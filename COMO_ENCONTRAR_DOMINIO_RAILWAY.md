# 🔍 Cómo Encontrar el Dominio en Railway

## ⚠️ Importante: El Dominio está en el SERVICIO, no en el PROYECTO

### Paso 1: Salir de "Project Settings"

1. Haz clic en la **X** para cerrar el modal de "Project Settings"
2. O haz clic fuera del modal

### Paso 2: Ir al Servicio

1. En Railway Dashboard, verás tu **Proyecto** (sistema-clinica)
2. **Haz clic en el servicio** dentro del proyecto (el cuadro/card que tiene el código del backend)
3. **NO** hagas clic en "Settings" del proyecto

### Paso 3: Buscar el Dominio

Una vez dentro del servicio, busca:

#### Opción A: Pestaña "Settings" del Servicio
1. Haz clic en la pestaña **"Settings"** (del servicio, no del proyecto)
2. Busca la sección **"Networking"** o **"Domains"**
3. Ahí deberías ver el dominio o un botón **"Generate Domain"**

#### Opción B: Pestaña "Deployments"
1. Haz clic en la pestaña **"Deployments"**
2. Haz clic en el deployment más reciente
3. En la parte superior, deberías ver la URL del servicio

#### Opción C: En la Vista Principal del Servicio
1. En la vista principal del servicio (antes de entrar a Settings)
2. Busca un enlace o texto que diga algo como:
   - `https://tu-backend.up.railway.app`
   - O un botón **"Generate Domain"**

### Paso 4: Si No Hay Dominio

Si no ves ningún dominio:

1. Ve a **Settings** del servicio
2. Busca **"Networking"** o **"Domains"**
3. Haz clic en **"Generate Domain"** o **"Add Domain"**
4. Railway generará una URL automáticamente

## 📍 Navegación Visual

```
Railway Dashboard
  └── 📁 Proyecto (sistema-clinica) ← Estás aquí en Settings
       └── 🔧 Servicio (backend) ← Necesitas ir AQUÍ
            └── Settings ← Dominio está AQUÍ
                 └── Networking / Domains
```

## 🆘 Si Aún No Lo Encuentras

1. **Verifica que el servicio esté desplegado** (debe tener un deployment exitoso)
2. **Busca en la parte superior del servicio** - a veces el dominio aparece ahí
3. **Revisa los logs** - a veces Railway muestra la URL en los logs

## ✅ Alternativa: Usar Railway CLI

Si prefieres usar la terminal:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Iniciar sesión
railway login

# Conectar al proyecto
railway link

# Ver información del servicio
railway status
```

Esto te mostrará la URL del servicio.

