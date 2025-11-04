# Lipoout WhatsApp - Sistema de Gestión para Clínicas

## Migración desde GitHub Completada ✅

Este proyecto ha sido migrado desde el repositorio original en GitHub manteniendo **Appwrite como backend**.

## 🚀 Stack Tecnológico

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router** - Navegación
- **TanStack Query** - Gestión de estado del servidor
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI
- **date-fns** - Manejo de fechas
- **React Big Calendar** - Calendario de citas

### Backend
- **Appwrite** - Backend as a Service
  - Base de datos
  - Autenticación
  - Storage
  - Functions

### Integraciones
- **WAHA** - API de WhatsApp
- **Firebase** - Funciones adicionales (opcional)
- **Papa Parse** - Procesamiento de CSV
- **React PDF** - Generación de PDFs

## 📋 Configuración Inicial

### 1. Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

### 2. Configurar Variables de Entorno

Crea un archivo \`.env\` en la raíz del proyecto:

\`\`\`env
# Appwrite Configuration
VITE_APP_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APP_PROJECT_ID=tu_project_id_aqui
\`\`\`

**Obtén tus credenciales:**
1. Ve a tu proyecto en [Appwrite Cloud](https://cloud.appwrite.io)
2. Copia el Project ID desde el dashboard
3. El endpoint por defecto es \`https://cloud.appwrite.io/v1\`

### 3. Estructura de Base de Datos

Tu aplicación usa las siguientes colecciones en Appwrite:

#### Colecciones Principales
- \`clientes\` - Datos de clientes
- \`empleados\` - Personal de la clínica
- \`citas\` - Agenda y citas
- \`facturas\` - Facturación
- \`articulos\` - Servicios y productos
- \`familias\` - Categorías de artículos
- \`recursos\` - Salas y equipamiento
- \`aparatos\` - Equipamiento médico
- \`proveedores\` - Proveedores

#### Colecciones de Marketing
- \`campaigns\` - Campañas de WhatsApp
- \`templates\` - Plantillas de mensajes
- \`message_logs\` - Registro de mensajes enviados
- \`configuracion\` - Configuración WAHA

**IMPORTANTE**: Asegúrate de que estas colecciones existan en tu base de datos Appwrite con los campos correctos.

## 🏃‍♂️ Ejecutar en Desarrollo

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en \`http://localhost:8080\`

## 🏗️ Build para Producción

\`\`\`bash
npm run build
npm run preview
\`\`\`

## 📁 Estructura del Proyecto

\`\`\`
src/
├── components/          # Componentes React
│   ├── layout/         # Layout components (Header, AppLayout)
│   ├── forms/          # Formularios
│   └── ui/             # Componentes UI de shadcn
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Autenticación
│   ├── useDebounce.ts  # Utilidades
│   └── ...             # Hooks de datos (pendientes)
├── lib/                # Utilidades y configuración
│   ├── appwrite.ts     # Cliente y config de Appwrite
│   └── utils.ts        # Funciones auxiliares
├── pages/              # Páginas de la aplicación
│   ├── Dashboard.tsx   # Dashboard principal
│   └── NotFound.tsx    # Página 404
├── types/              # Definiciones TypeScript
│   ├── index.ts        # Exportaciones principales
│   ├── cliente.types.ts
│   ├── empleado.types.ts
│   ├── cita.types.ts
│   └── ...             # Otros tipos
└── App.tsx             # Componente raíz
\`\`\`

## 🔐 Autenticación

La aplicación usa **Appwrite Auth** con:
- Email/Password
- OAuth2 (Google)

Los usuarios deben estar registrados en tu proyecto de Appwrite.

## 📱 Módulos de la Aplicación

### ✅ Migrados
- **Dashboard** - Vista general con KPIs
- **Autenticación** - Login con Appwrite
- **Header** - Navegación principal

### ⏳ Pendientes de Migración
- **Agenda** - Gestión de citas con calendario
- **Clientes** - CRUD completo de clientes
- **Empleados** - Gestión de personal
- **Artículos** - Servicios y productos
- **TPV** - Punto de venta
- **Facturación** - Gestión de facturas y presupuestos
- **Marketing** - Campañas de WhatsApp con WAHA
- **Configuración** - Ajustes del sistema

## 🔧 Próximos Pasos

Para completar la migración completa, necesitas:

1. ✅ **Configurar variables de entorno** (.env)
2. ✅ **Verificar estructura de base de datos** en Appwrite
3. ⏳ **Migrar páginas restantes** (Agenda, Clientes, etc.)
4. ⏳ **Crear hooks de datos** (useAgenda, useClientes, etc.)
5. ⏳ **Migrar componentes de formularios**
6. ⏳ **Configurar WAHA** para WhatsApp

## 🐛 Resolución de Problemas

### Error: "Cannot find module './articulo.types'"
- **Solución**: Todos los tipos ya están creados. Asegúrate de ejecutar \`npm install\`

### Error de autenticación
- **Solución**: Verifica que tu \`.env\` tenga las credenciales correctas de Appwrite
- **Solución**: Asegúrate de tener usuarios creados en Appwrite Auth

### La aplicación no carga datos
- **Solución**: Verifica que las colecciones existan en Appwrite
- **Solución**: Revisa los permisos de las colecciones en Appwrite

## 📞 Soporte

Para continuar con la migración, indica qué módulo quieres migrar a continuación.

## 📄 Licencia

Este proyecto fue migrado desde el repositorio original manteniendo Appwrite como backend.
