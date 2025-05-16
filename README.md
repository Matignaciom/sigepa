# SIGEPA V2 - Sistema de Gestión de Pagos

## Descripción

SIGEPA V2 es un Sistema de Gestión de Pagos diseñado para administrar parcelas, contratos, pagos y usuarios en un entorno de copropiedad. El sistema cuenta con dos roles principales: administrador y copropietario, cada uno con su propio panel de control y funcionalidades específicas.

## Características

### Panel de Administrador
- **Inicio**: Vista general del sistema
- **Mapa Geoespacial**: Visualización de parcelas en un mapa
- **Resumen**: Estadísticas y métricas del sistema
- **Contratos**: Gestión de contratos de parcelas
- **Alertas**: Sistema de notificaciones y alertas
- **Gestión de Usuarios**: Administración de usuarios
- **Crear Notificación**: Envío de notificaciones a usuarios
- **Mi Perfil**: Gestión del perfil de administrador

### Panel de Copropietario
- **Inicio**: Vista general para el copropietario
- **Mi Parcela**: Información sobre la parcela del usuario
- **Pagos**: Gestión de pagos
- **Historial**: Historial de transacciones
- **Estadísticas**: Estadísticas personales
- **Mi Perfil**: Gestión del perfil de usuario

## Tecnologías Utilizadas

- **Frontend**: React, React Router, CSS Modules
- **Backend**: Funciones Serverless en Netlify Functions
- **Base de Datos**: MySQL en Amazon RDS
- **Gestión de Estado**: Context API
- **Validación de Formularios**: React Hook Form, Zod
- **Autenticación**: JWT (simulado en esta versión)

## Estructura del Proyecto

```
src/
├── assets/           # Recursos estáticos
├── components/       # Componentes reutilizables
│   └── layout/       # Componentes de estructura (Header, Sidebar, Footer)
├── context/          # Contextos de React (AuthContext)
├── pages/            # Páginas de la aplicación
│   ├── admin/        # Páginas del panel de administrador
│   ├── auth/         # Páginas de autenticación
│   └── dashboard/    # Páginas del panel de copropietario
├── services/         # Servicios y API
└── styles/           # Estilos globales
netlify/
└── functions/        # Funciones serverless para la API
    ├── api.js        # API principal
    ├── db.js         # Módulo de conexión a la base de datos
    └── init-db.js    # Endpoint para inicializar la base de datos
database/
├── schema.sql        # Estructura de la base de datos
└── schema_datos_prueba.sql  # Datos de prueba
```

## Estructura de la Base de Datos

La base de datos utiliza MySQL y consta de las siguientes tablas principales:

- **Comunidad**: Entidad de nivel superior que agrupa a usuarios y parcelas
- **Usuario**: Información de los usuarios (administradores y copropietarios)
- **Parcela**: Información de las parcelas con datos geoespaciales
- **GastoComun**: Gastos comunes de la comunidad
- **GastoParcela**: Prorrateo de gastos entre parcelas
- **Pago**: Registro de pagos realizados
- **Contrato**: Documentos legales
- **Notificacion**: Notificaciones enviadas a usuarios
- **Aviso**: Avisos comunitarios
- **Actividad**: Registro de actividades

## Configuración de Base de Datos

El sistema utiliza MySQL en Amazon RDS. Para configurar la conexión:

1. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
DB_HOST=sigepa-db-id.cfy6uk6aipzc.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=tu_contraseña
DB_NAME=sigepa_db
DB_PORT=3306
```

2. Para inicializar la base de datos con los datos de prueba:

```bash
node --experimental-specifier-resolution=node netlify/functions/initDatabase.js
```

## Instalación y Ejecución

1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/sigepa-v2.git
cd sigepa-v2
```

2. Instalar dependencias

```bash
npm install
```

3. Configurar la base de datos como se explicó anteriormente

4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

5. Abrir el navegador en `http://localhost:5173`

## Credenciales de Prueba

### Administrador
- **Email**: admin@sigepa.com
- **Contraseña**: admin123

### Copropietario
- **Email**: usuario@sigepa.com
- **Contraseña**: user123

## API Endpoints

El sistema cuenta con los siguientes endpoints principales:

- `/.netlify/functions/api/auth/login`: Autenticación de usuarios
- `/.netlify/functions/api/usuarios/perfil`: Información de perfil
- `/.netlify/functions/api/parcelas/info`: Detalles de parcela
- `/.netlify/functions/api/pagos/pendientes`: Pagos pendientes
- `/.netlify/functions/api/pagos/historial`: Historial de pagos
- `/.netlify/functions/api/admin/usuarios`: Gestión de usuarios (solo admin)
- `/.netlify/functions/api/admin/parcelas`: Gestión de parcelas (solo admin)
- `/.netlify/functions/api/admin/avisos`: Gestión de avisos (solo admin)
- `/.netlify/functions/api/admin/gastos`: Gestión de gastos comunes (solo admin)

## Despliegue

Para construir la aplicación para producción:

```bash
npm run build
```

Los archivos generados estarán en la carpeta `dist/` listos para ser desplegados en Netlify u otro servicio.

## Autor

Desarrollado como parte del Proyecto de Título para la carrera de Ingeniería.
