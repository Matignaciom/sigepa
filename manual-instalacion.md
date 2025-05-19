# Manual de Instalación - Sistema Sigepa

## Requisitos Previos

* Node.js (versión 16 o superior)
* MySQL (versión 8.0 o superior)
* Git

## Pasos para la Instalación

### 1. Clonar el Repositorio

```
git clone https://github.com/usuario/Sistema-Sigepa.git
cd Sistema-Sigepa
```

### 2. Instalar Dependencias

```
npm install
```

### 3. Configuración de la Base de Datos

1. Crear una base de datos MySQL:

```sql
CREATE DATABASE sigepa_db;
```

2. Ejecutar el script de esquema:

```
mysql -u usuario -p sigepa_db < database/schema.sql
```

### 4. Configuración de Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto. Es **IMPORTANTE** reemplazar las credenciales predeterminadas por motivos de seguridad:

```
DB_HOST=sigepa-db-id.cfy6uk6aipzc.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=#SnKKerV!tH4gRf
DB_NAME=sigepa_db
DB_PORT=3306
JWT_SECRET=clave_secreta_personalizada_para_tokens
```

### 5. Ejecutar la Aplicación en Modo Desarrollo

```
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 6. Compilar para Producción

```
npm run build
```

### 7. Despliegue en Netlify

1. Crear una cuenta en Netlify (si aún no tienes una)
2. En el dashboard de Netlify:
   - Seleccionar "New site from Git"
   - Conectar con tu repositorio
   - Configurar variables de entorno en "Site settings > Build & deploy > Environment"
   - Asegurarse de configurar todas las variables de entorno, especialmente DB_HOST, DB_USER, DB_PASSWORD y JWT_SECRET
   - Las funciones de Netlify se desplegarán automáticamente desde la carpeta "netlify/functions"

## Configuración de la Base de Datos en Producción

Para entornos de producción:

1. Configurar una base de datos MySQL en un servicio como AWS RDS
2. Actualizar las variables de entorno en el panel de Netlify
3. Asegurarse de que la base de datos esté correctamente protegida con reglas de firewall
4. No utilizar las credenciales predeterminadas que vienen en el código fuente

## Estructura del Proyecto

- `src/`: Código fuente del frontend (React)
- `netlify/functions/`: Funciones serverless para el backend
- `database/`: Scripts SQL para la base de datos

## Seguridad y Buenas Prácticas

1. Cambiar las credenciales predeterminadas de la base de datos
2. Utilizar contraseñas seguras para la conexión a MySQL
3. No exponer el archivo `.env` en repositorios públicos
4. Configurar correctamente los permisos de usuario en la base de datos

## Solución de Problemas Comunes

1. **Error de conexión a la base de datos**: Verificar credenciales en el archivo .env
2. **Problemas con las funciones de Netlify**: Ejecutar `netlify dev` para probar funciones localmente
3. **Errores de CORS**: Verificar la configuración de cabeceras en funciones de Netlify

Para más información, consultar la documentación del proyecto. 