# ORMAN Frontend

Frontend web del sistema **ORMAN**, desarrollado con Angular para la gestión inmobiliaria y la administración de personas, usuarios, roles, propiedades, unidades y contratos.

La aplicación proporciona una interfaz pública de presentación y un área privada protegida que se comunica con el backend ORMAN mediante una API REST.

## Tecnologías

* Angular 22.0.7
* TypeScript 6.0.3
* Angular Router
* Angular HttpClient
* Angular Signals
* RxJS 7.8
* Angular Material
* Tailwind CSS 4.3.3
* ngx-sonner
* Leaflet
* jsPDF
* Vitest
* jsdom
* npm

La aplicación utiliza componentes standalone y carga diferida de funcionalidades mediante el router de Angular.

## Funcionalidades principales

Actualmente el frontend incluye:

* landing pública;
* navegación pública responsive;
* sistema de temas;
* autenticación de usuarios;
* área privada protegida;
* gestión de sesión;
* renovación de autenticación mediante refresh token;
* guards para protección de rutas;
* interceptor HTTP;
* gestión de personas;
* gestión de roles;
* asignación de roles;
* gestión de menús;
* asignación de menús y procesos;
* gestión de propiedades;
* gestión de unidades;
* gestión de contratos;
* visualización de detalles de contratos;
* manejo de documentos PDF asociados a contratos;
* notificaciones visuales;
* integración con mapas y geocodificación.

El módulo de pagos todavía no forma parte de las funcionalidades publicadas de la aplicación.

## Arquitectura

El código principal se encuentra en:

```text
src/app/
├── core/
├── features/
├── layouts/
└── shared/
```

### `core`

Contiene elementos utilizados de manera transversal por la aplicación, como:

* configuración de API;
* autenticación;
* guards;
* interceptores;
* servicios centrales.

### `features`

Contiene las funcionalidades organizadas por dominio, entre ellas:

* autenticación;
* personas;
* roles;
* menús;
* asignaciones;
* propiedades;
* unidades;
* contratos;
* funcionalidades públicas.

### `layouts`

Contiene las estructuras principales de presentación para las áreas pública y privada.

### `shared`

Contiene componentes y elementos reutilizables entre distintas funcionalidades.

## Requisitos

Para ejecutar el proyecto se requiere:

* Node.js compatible con Angular 22;
* npm;
* backend ORMAN disponible para las operaciones que requieren API.

El proyecto utiliza npm como gestor de dependencias y conserva `package-lock.json` para mantener instalaciones reproducibles.

## Instalación

Clona el repositorio y entra en la carpeta del frontend.

Instala las dependencias:

```powershell
npm install
```

## Ejecución en desarrollo

Inicia el servidor de desarrollo:

```powershell
npm start
```

La aplicación estará disponible normalmente en:

```text
http://localhost:4200
```

## Conexión con el backend

Las llamadas de negocio utilizan el prefijo:

```text
/api/v1
```

Durante el desarrollo local, `proxy.conf.json` redirige las solicitudes `/api` hacia:

```text
http://localhost:9090
```

Por lo tanto, el backend ORMAN debe estar disponible en el puerto `9090` para utilizar las funcionalidades que requieren comunicación con la API.

La aplicación evita incorporar una URL absoluta del backend directamente en los componentes y servicios de negocio.

## Autenticación

El frontend implementa autenticación integrada con el backend ORMAN.

La aplicación utiliza:

* token de acceso;
* refresh token mediante cookie HttpOnly;
* interceptor HTTP;
* protección de rutas mediante guard;
* renovación de sesión;
* contexto de usuario autenticado.

El token de acceso se mantiene en memoria y no se almacena en `localStorage`.

`localStorage` se utiliza únicamente para configuraciones locales de la interfaz, como preferencias de tema y datos auxiliares del dispositivo.

## Área pública

La aplicación dispone de una interfaz pública que incluye:

* encabezado responsive;
* landing principal;
* logotipo ORMAN;
* selector de tema;
* navegación;
* pie de página;
* acceso al sistema.

Los recursos públicos se encuentran principalmente en:

```text
public/
```

El logotipo principal se encuentra en:

```text
public/images/brand/orman-logo.svg
```

## Área privada

Después de autenticarse, el usuario puede acceder a las funcionalidades habilitadas de acuerdo con su contexto y permisos.

Las rutas privadas se cargan de manera diferida y están protegidas mediante el sistema de autenticación de la aplicación.

Entre las áreas actualmente disponibles se encuentran:

```text
Personas
Roles
Menús
Asignaciones
Propiedades
Unidades
Contratos
```

## Propiedades y unidades

El frontend permite trabajar con información relacionada con propiedades inmobiliarias y sus unidades.

La interfaz incluye operaciones de consulta, formularios, vistas de detalle y acciones asociadas al estado de los recursos.

También se integra funcionalidad de mapas y geocodificación mediante servicios públicos.

## Contratos

El módulo de contratos permite gestionar y consultar información contractual desde el frontend.

Incluye funcionalidades relacionadas con:

* listado de contratos;
* creación;
* visualización de detalles;
* información relacionada con personas y unidades;
* documentos asociados;
* visualización y tratamiento de archivos PDF.

## Assets

Los recursos estáticos públicos se almacenan en:

```text
public/
```

Entre ellos se incluyen:

```text
public/favicon.ico
public/images/brand/orman-logo.svg
```

Los archivos dentro de `public/` son copiados a la salida pública de Angular durante el proceso de construcción, por lo que esta carpeta debe contener únicamente recursos destinados a formar parte de la aplicación.

## Comandos disponibles

### Desarrollo

```powershell
npm start
```

### Build

```powershell
npm run build
```

### Pruebas

```powershell
npm test -- --watch=false
```

### Modo watch

```powershell
npm run watch
```

## Pruebas

El proyecto utiliza Vitest para las pruebas unitarias.

Para ejecutar las pruebas sin modo interactivo:

```powershell
npm test -- --watch=false
```

Los archivos de prueba se mantienen junto a las funcionalidades correspondientes mediante archivos `*.spec.ts`.

Los datos utilizados en pruebas deben ser ficticios y no deben contener información personal real.

## Build de producción

Para generar la aplicación:

```powershell
npm run build
```

Angular genera la salida de compilación dentro de:

```text
dist/
```

La carpeta `dist/` es generada automáticamente y no forma parte del repositorio.

## Archivos locales y generados

El repositorio no incluye archivos locales o generados como:

```text
node_modules/
dist/
.angular/
coverage/
.env
docs/
AGENTS.md
.vscode/
.idea/
.history/
```

Tampoco se incluyen documentación interna de desarrollo, archivos temporales, datos privados ni documentos utilizados únicamente durante el proceso de implementación.

## Estructura general

```text
Orman_Frontend/
├── public/
│   ├── favicon.ico
│   └── images/
│       └── brand/
│           └── orman-logo.svg
│
├── src/
│   ├── app/
│   │   ├── core/
│   │   ├── features/
│   │   ├── layouts/
│   │   └── shared/
│   ├── styles/
│   ├── index.html
│   └── main.ts
│
├── angular.json
├── package.json
├── package-lock.json
├── proxy.conf.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
└── README.md
```

## Backend

Este repositorio contiene únicamente el frontend web de ORMAN.

La lógica de negocio, persistencia, autenticación del servidor y API REST pertenecen al proyecto backend ORMAN.
