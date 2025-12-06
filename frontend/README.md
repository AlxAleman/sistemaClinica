# Frontend - Sistema de Gestión Clínica

## Setup Inicial

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
Crea un archivo `.env.local` en la raíz del frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

3. **Ejecutar en desarrollo:**
```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

## Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run build` - Compila la aplicación para producción
- `npm start` - Inicia el servidor en producción
- `npm run lint` - Ejecuta el linter

## Estructura del Proyecto

```
frontend/
├── app/
│   ├── layout.tsx          # Layout global
│   ├── page.tsx            # Home (redirige a login)
│   ├── globals.css         # Estilos globales
│   ├── login/
│   │   └── page.tsx        # Página de login
│   ├── register/
│   │   └── page.tsx        # Página de registro
│   └── dashboard/
│       ├── layout.tsx      # Layout protegido
│       └── page.tsx        # Dashboard principal
├── store/
│   └── authStore.ts        # Store Zustand para autenticación
├── services/
│   ├── api.ts              # Configuración Axios
│   └── authService.ts      # Servicios de autenticación
├── middleware.ts           # Middleware de protección de rutas
└── package.json
```

## Características Implementadas

### ✅ Autenticación
- Login y registro de usuarios
- Protección de rutas con middleware
- Store Zustand con persistencia
- Interceptores Axios para JWT
- Refresh token automático

### ✅ UI/UX
- Diseño con TailwindCSS
- Notificaciones con react-hot-toast
- Formularios responsivos
- Navegación protegida

## Próximos Pasos

- [ ] Gestión de pacientes
- [ ] Sistema de citas
- [ ] Calendario
- [ ] Reportes y dashboard

## Conectar con Backend

Asegúrate de que el backend esté corriendo en `http://localhost:5000` o actualiza `NEXT_PUBLIC_API_URL` en `.env.local`.

