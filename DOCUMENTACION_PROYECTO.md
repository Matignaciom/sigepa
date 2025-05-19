# Documentación del Proyecto: Sistema Sigepa

## 1. Introducción

Sigepa es un sistema de gestión de parcelas y comunidades, diseñado para facilitar la administración de copropietarios, gastos comunes, pagos, y comunicación dentro de una comunidad. El sistema cuenta con un frontend desarrollado en React y un backend basado en funciones serverless de Netlify, con una base de datos MySQL.

## 2. Arquitectura General

El sistema se compone de tres partes principales:

*   **Frontend**: Una aplicación de página única (SPA) construida con React y Vite. Se encarga de la interfaz de usuario y la interacción con el cliente.
*   **Backend**: Una API serverless desarrollada con funciones de Netlify (Node.js). Gestiona la lógica de negocio y la comunicación con la base de datos.
*   **Base de Datos**: MySQL, utilizada para persistir toda la información del sistema.

## 3. Frontend

*   **Tecnologías Principales**:
    *   React (v19+)
    *   Vite (como herramienta de construcción y servidor de desarrollo)
    *   TypeScript
    *   React Router DOM (para la navegación)
    *   Axios (para peticiones HTTP al backend)
    *   Zod (para validación de esquemas)
    *   Material-UI (para componentes de UI)
    *   Chart.js (para gráficos)
*   **Estructura de Carpetas (principales)**:
    *   `src/components`: Componentes reutilizables de la interfaz.
    *   `src/pages`: Componentes que representan las diferentes páginas/vistas de la aplicación.
        *   `src/pages/admin`: Vistas específicas para el rol de Administrador.
        *   `src/pages/auth`: Vistas para autenticación (Login, Registro, Olvidó Contraseña).
        *   `src/pages/dashboard`: Vistas para el panel de Copropietario.
    *   `src/context`: Context API de React (ej. `AuthContext` para gestión de autenticación).
    *   `src/services`: Lógica para interactuar con la API backend (ej. `api.ts`, `transbank.ts`).
    *   `src/styles`: Estilos globales y variables CSS.
*   **Scripts Importantes (`package.json`)**:
    *   `npm run dev`: Inicia el servidor de desarrollo de Vite.
    *   `npm run build`: Compila la aplicación para producción.
    *   `npm run lint`: Ejecuta el linter (ESLint).

## 4. Backend (Funciones Serverless de Netlify)

El backend está implementado como un conjunto de funciones serverless en la carpeta `netlify/functions/`. Estas funciones manejan las peticiones HTTP, la lógica de negocio y la interacción con la base de datos MySQL.

*   **Tecnologías Principales**:
    *   Node.js (especificado `18.x` en `package.json` y `18.19.0` en `netlify.toml`)
    *   `mysql2` (para la conexión con MySQL)
    *   `jsonwebtoken` (para la gestión de tokens JWT para autenticación y autorización)
    *   `dotenv` (para la gestión de variables de entorno)
*   **Principales Endpoints (basado en los nombres de archivo en `netlify/functions/`)**:
    *   Autenticación:
        *   `iniciar-sesion`: Login de usuarios.
        *   `registrar-usuario`: Registro de nuevos usuarios.
        *   `cambiar-contrasena`: Cambio de contraseña para usuarios.
        *   `cambiar-contrasena-admin`: Cambio de contraseña específico para administradores.
    *   Gestión de Perfil:
        *   `obtener-perfil-usuario`: Obtiene datos del perfil del copropietario.
        *   `editar-perfil-copropietario`: Edita datos del perfil del copropietario.
        *   `obtener-perfil-admin`: Obtiene datos del perfil del administrador.
        *   `editar-perfil-admin`: Edita datos del perfil del administrador.
    *   Comunidades:
        *   `obtener-comunidades`: Lista las comunidades (posiblemente para el registro).
        *   `obtener-comunidad-admin`: Obtiene detalles de la comunidad del administrador logueado.
        *   `editar-comunidad`: Permite al administrador editar la información de su comunidad.
        *   `obtener-informacion-comunidad`: Obtiene información detallada de una comunidad.
        *   `obtener-usuarios-comunidad`: Lista los usuarios de una comunidad.
    *   Parcelas:
        *   `obtener-parcelas-usuario`: Obtiene las parcelas asociadas a un copropietario.
        *   `obtener-parcelas-mapa`: Obtiene parcelas para mostrar en un mapa (admin).
        *   `buscar-parcela-mapa`: Busca parcelas para el mapa (admin).
        *   `actualizar-coordenadas-parcela`: Permite al admin actualizar la geolocalización de una parcela.
    *   Gastos Comunes:
        *   `crear-gasto-comun`: Crea un nuevo gasto común (admin).
        *   `editar-gasto-comun`: Edita un gasto común existente (admin).
        *   `obtener-gastos-admin`: Lista los gastos comunes para el administrador.
        *   `obtener-distribucion-gasto`: Obtiene cómo se distribuye un gasto entre parcelas.
        *   `obtener-resumen-gastos`: Obtiene un resumen de gastos (posiblemente para copropietario).
    *   Pagos:
        *   `obtener-pagos-pendientes`: Lista los pagos pendientes de un copropietario.
        *   `obtener-pagos-realizados`: Historial de pagos realizados por un copropietario.
        *   `procesar-pago-transbank`: Simula/integra el proceso de pago con Transbank.
        *   `registrar-pago-gasto`: Registra un pago manual de un gasto (admin).
        *   `obtener-pagos-historial`: Obtiene un historial general de pagos (admin).
    *   Dashboard y Estadísticas:
        *   `obtener-resumen-dashboard`: Resumen para el dashboard del copropietario.
        *   `obtener-resumen-dashboard-admin`: Resumen para el dashboard del administrador.
        *   `obtener-actividades-recientes`: Obtiene un feed de actividades recientes.
        *   `obtener-estadisticas-pagos`: Estadísticas detalladas sobre pagos.
        *   `obtener-estadisticas-parcelas`: Estadísticas relacionadas con las parcelas.
    *   (Otras funciones como gestión de contratos, alertas, notificaciones se infieren de la estructura del frontend y podrían tener sus endpoints correspondientes).
*   **Seguridad**:
    *   Uso de JWT para proteger los endpoints.
    *   Verificación de roles (Administrador, Copropietario) en las funciones para operaciones sensibles.

## 5. Base de Datos

*   **Sistema Gestor**: MySQL (versión 8.0 o superior).
*   **Esquema**: Definido en `database/schema.sql`.
*   **Principales Tablas**:
    *   `Comunidad`: Información de las comunidades.
    *   `Usuario`: Datos de los usuarios (administradores y copropietarios), incluyendo credenciales hasheadas (SHA2).
    *   `Parcela`: Detalles de las parcelas, incluyendo ubicación geoespacial (`GEOMETRY SRID 4326`).
    *   `Actividad`: Registro de acciones en el sistema.
    *   `Aviso`: Avisos y notificaciones generales para la comunidad.
    *   `Contrato`: Gestión de contratos asociados a parcelas/propietarios.
    *   `GastoComun`: Gastos comunes generados por la administración.
    *   `GastoParcela`: Distribución de los gastos comunes a cada parcela.
    *   `Pago`: Registros de pagos realizados.
    *   `Notificacion`: Notificaciones específicas para usuarios.
    *   `UsuarioAviso`: Relación entre usuarios y avisos (leído, respondido).
    *   `CodigoVerificacion`: Para procesos como recuperación de contraseña.
*   **Relaciones Importantes**:
    *   Un `Usuario` pertenece a una `Comunidad` y puede tener múltiples `Parcelas`.
    *   Una `Parcela` pertenece a un `Usuario` (propietario) y a una `Comunidad`.
    *   Un `GastoComun` se distribuye en varios `GastoParcela`.
    *   Un `Pago` se asocia a un `GastoParcela` y a un `Usuario`.
*   **Población Inicial**: El script `schema.sql` también incluye datos de prueba (`INSERT INTO ...`).

## 6. Despliegue

*   **Plataforma**: Netlify.
*   **Configuración**: Definida en `netlify.toml`.
    *   Comando de build: `npm run build`
    *   Directorio de publicación: `dist`
    *   Directorio de funciones: `netlify/functions`
    *   Variables de entorno (NODE_VERSION, etc.) configuradas para el build.
*   **Redirecciones**:
    *   SPA: Todas las rutas (`/*`) redirigen a `index.html` para que React Router maneje la navegación.
    *   API: Peticiones a `/api/*` redirigen a `/.netlify/functions/:splat`.

## 7. Configuración Adicional

Consultar `manual-instalacion.md` para detalles sobre:

*   Requisitos previos.
*   Pasos de instalación local.
*   Configuración de variables de entorno (`.env`).
*   Ejecución en modo desarrollo y producción.
*   Consideraciones de seguridad.

## 8. Próximos Pasos / Mejoras Potenciales

*   (Esta sección puede ser llenada con futuras funcionalidades o áreas de mejora identificadas para el proyecto).
*   Documentación más detallada de cada endpoint de la API (parámetros, respuestas esperadas, códigos de error).
*   Diagramas de flujo para procesos clave (ej. registro de usuario, proceso de pago).


