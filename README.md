# ORMAN Frontend

> Trabajo Final · Diplomado en Desarrollo Web y Aplicaciones Móviles · UAJMS 2026<br>
> Autor: `Xavier Ortega Mancilla` · Tutor: <Nombre del tutor>

## 1. Descripción

ORMAN es una plataforma para la gestión de alquileres. Este repositorio contiene la aplicación web Angular, que funciona como interfaz del **Propietario**. La aplicación móvil de otro repositorio funciona como interfaz del **Inquilino**. El Frontend web incluye una landing pública y un área privada conectada al Backend ORMAN Spring Boot.

**Sistema desplegado:** [https://orman-frontend.ortegaxavier75.workers.dev/](https://orman-frontend.ortegaxavier75.workers.dev/)

### Repositorios

| Aplicación       | Repositorio                                                    | Interfaz principal |
| ---------------- | -------------------------------------------------------------- | ------------------ |
| Frontend web     | [Orman_Frontend](https://github.com/Xavier2206/Orman_Frontend) | Propietario        |
| Backend          | [Orman_Backend](https://github.com/Xavier2206/Orman_Backend)   | API Spring Boot    |
| Aplicación móvil | [Orman_Mobile](https://github.com/Xavier2206/Orman_Mobile)     | Inquilino          |

## 2. Stack tecnológico

Las versiones resueltas corresponden a `package-lock.json`. Las restricciones declaradas en `package.json` son rangos, salvo `packageManager`, que declara una versión de npm.

| Componente                                            |               Restricción declarada | Versión resuelta | Función                                                      |
| ----------------------------------------------------- | ----------------------------------: | ---------------: | ------------------------------------------------------------ |
| Angular (core, common, router, Material, CLI y build) | `^22.0.0` / `^22.0.7` según paquete |           22.0.7 | Aplicación standalone, navegación, formularios y componentes |
| TypeScript                                            |                            `~6.0.2` |            6.0.3 | Lenguaje y tipado                                            |
| RxJS                                                  |                            `~7.8.0` |            7.8.2 | Operaciones asíncronas                                       |
| Tailwind CSS y PostCSS                                |                            `^4.3.3` |            4.3.3 | Estilos de interfaz                                          |
| ngx-sonner                                            |                            `^3.1.0` |            3.1.0 | Notificaciones visuales                                      |
| Leaflet                                               |                            `^1.9.4` |            1.9.4 | Mapas                                                        |
| jsPDF                                                 |                            `^4.2.1` |            4.2.1 | Generación de documentos PDF                                 |
| Vitest                                                |                            `^4.0.8` |           4.1.10 | Pruebas unitarias                                            |
| jsdom                                                 |                           `^28.0.0` |           28.1.0 | Entorno DOM para pruebas                                     |
| npm                                                   |       `packageManager: npm@11.16.0` |        No aplica | Gestor de paquetes declarado por el proyecto                 |

`package.json` no declara `engines` para Node.js y el repositorio no contiene `.nvmrc` ni `.node-version`. Angular 22.0.x admite Node.js `^22.22.3`, `^24.15.0` o `^26.0.0`, TypeScript `>=6.0.0 <6.1.0` y RxJS `^6.5.3` o `^7.4.0`, según la [tabla oficial de compatibilidad de Angular](https://angular.dev/reference/versions). El `package-lock.json` resuelve TypeScript 6.0.3 y RxJS 7.8.2, que están dentro de esos rangos. En el entorno local usado para preparar esta documentación se informaron Node.js `v24.21.0` y npm `11.19.0`; son versiones locales y no pines del repositorio. `package.json` declara npm `11.16.0` mediante `packageManager`.

## 3. Requisitos previos

- Una versión de Node.js compatible con Angular 22.0.x; ver la tabla oficial enlazada arriba.
- npm, preferentemente la versión declarada en `package.json` (`11.16.0`).
- Git.
- Backend ORMAN disponible para las funciones que consumen la API.

## 4. Instalación local

```bash
git clone https://github.com/Xavier2206/Orman_Frontend.git
cd Orman_Frontend
npm ci
npm start
```

La aplicación se sirve en `http://localhost:4200`. `npm start` ejecuta `ng serve`, cuya configuración predeterminada es `development` en `angular.json`. `src/environments/environment.development.ts` define la base REST relativa `/api/v1` y el WebSocket `ws://localhost:9090/ws`.

El Backend local debe estar disponible en `http://localhost:9090`. `proxy.conf.json`, conectado al servidor de desarrollo desde `angular.json`, reenvía las solicitudes cuya ruta comienza con `/api` a ese Backend. Así, las solicitudes REST desde el navegador usan el mismo origen del Frontend; la conexión STOMP/WebSocket usa directamente la dirección local definida en el archivo de entorno.

## 5. Entornos, autenticación y notificaciones

### Direcciones por entorno

| Entorno                      | Archivo que lo controla                       | Base REST                                                                   | WebSocket STOMP                            |
| ---------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------ |
| Desarrollo (`npm start`)     | `src/environments/environment.development.ts` | `/api/v1` — el proxy de desarrollo reenvía `/api` a `http://localhost:9090` | `ws://localhost:9090/ws`                   |
| Producción (`npm run build`) | `src/environments/environment.ts`             | `https://orman-backend-e09w.onrender.com/api/v1`                            | `wss://orman-backend-e09w.onrender.com/ws` |

No se usan archivos `.env` para configurar Angular. `angular.json` reemplaza el archivo base por `environment.development.ts` en desarrollo. El build usa `production` por defecto y conserva `environment.ts`. El prefijo REST es `/api/v1`; la ruta WebSocket es `/ws`.

### Sesión y autorización

El inicio de sesión usa `POST /api/v1/auth/login`. Angular mantiene el token de acceso en memoria y envía las solicitudes de sesión con `withCredentials` para que el navegador gestione la cookie HttpOnly de renovación definida por el contrato de autenticación; JavaScript no lee esa cookie. La protección CSRF usa el endpoint `GET /api/v1/auth/csrf`, la cookie `XSRF-TOKEN` y el encabezado `X-XSRF-TOKEN`. La aplicación no guarda los tokens en `localStorage`; allí puede conservar preferencias de interfaz y un identificador auxiliar del dispositivo.

El contexto de autenticación recibido del Backend alimenta la navegación y las protecciones de rutas del Frontend. Esos controles determinan lo que la interfaz presenta, pero no sustituyen la autorización que debe aplicar el Backend en cada operación.

### Notificaciones en tiempo real

El cliente se conecta por STOMP al WebSocket del entorno y envía el token de acceso como `Bearer` en el encabezado de conexión. Se suscribe a `/user/queue/notificaciones`. El cliente tiene reconexión exponencial, con espera inicial de un segundo y máximo de diez segundos. REST se usa para consultar el resumen y el listado de notificaciones; los eventos WebSocket actualizan la interfaz en tiempo real.

### Requisitos del Backend para el acceso web en producción

El código del Frontend confirma que las solicitudes de autenticación y CSRF usan credenciales y que la aplicación web de producción se sirve desde el origen `https://orman-frontend.ortegaxavier75.workers.dev`. La configuración efectiva de CORS, las cookies emitidas por el Backend y el permiso de origen del handshake WebSocket no se verifican desde este repositorio. Antes de evaluar el flujo en producción, el responsable del Backend debe confirmar que:

- CORS autoriza exactamente el origen web publicado y admite solicitudes con credenciales.
- La cookie de renovación y la cookie XSRF tienen atributos compatibles con el uso entre orígenes HTTPS, y el Backend permite el encabezado XSRF requerido.
- El endpoint WebSocket acepta conexiones desde el origen web publicado y el mecanismo de autenticación STOMP configurado.

Este README documenta las direcciones configuradas en el Frontend; no afirma que la disponibilidad pública ni estos ajustes del Backend hayan sido comprobados.

## 6. Estructura del repositorio

```text
.
├── public/
│   ├── favicon.ico
│   └── images/brand/orman-logo.svg
├── src/
│   ├── app/
│   │   ├── core/       # API, autenticación, temas y servicios globales
│   │   ├── features/   # Funcionalidades organizadas por dominio
│   │   ├── layouts/    # Composición pública y privada
│   │   └── shared/     # Elementos reutilizables
│   ├── environments/   # Direcciones específicas de cada entorno Angular
│   ├── styles.css
│   ├── index.html
│   └── main.ts
├── angular.json
├── package.json
├── package-lock.json
├── proxy.conf.json
├── wrangler.jsonc
└── README.md
```

Las funcionalidades incluyen gestión de personas, roles, menús, asignaciones, procesos, propiedades, unidades, contratos, cuotas y pagos; consulta de comprobantes y documentos PDF; mapas y fotografías; reportes financieros y notificaciones.

## 7. Roles y cuentas de evaluación

La aplicación web es la interfaz del Propietario y la aplicación móvil es la interfaz del Inquilino. Las cuentas de prueba para la evaluación académica se proporcionan en el apartado A4.4 del documento entregado al tribunal.

El área privada incluye funciones de administración de roles y menús, asignación de roles, asignación de menús y asignación de procesos. La navegación se construye con la información recibida del Backend; la autorización efectiva corresponde al Backend.

## 8. Pruebas

El proyecto utiliza Vitest para pruebas de componentes, servicios, autenticación, interceptores, renovación de sesión, contexto, guards, WebSocket, notificaciones y módulos funcionales. Los tests están junto al código correspondiente en archivos `*.spec.ts`.

```bash
npm test -- --watch=false
```

## 9. Despliegue en Cloudflare Workers

**Frontend público:** [https://orman-frontend.ortegaxavier75.workers.dev/](https://orman-frontend.ortegaxavier75.workers.dev/)

El proyecto se publica como activos estáticos en Cloudflare Workers. `angular.json` establece `production` como configuración predeterminada de build. `wrangler.jsonc` publica la carpeta `./dist/orman-frontend/browser`, que genera Angular con el builder de aplicación. Para preparar una publicación:

```bash
npm ci
npm run build
npx wrangler login
npx wrangler deploy
```

`npx wrangler login` autoriza Wrangler con una cuenta Cloudflare mediante el flujo OAuth del navegador, según la [documentación oficial del comando](https://developers.cloudflare.com/workers/wrangler/commands/general/). `npx wrangler deploy` lee `wrangler.jsonc` y publica los archivos de la carpeta configurada. En automatización se puede usar un token de API de Cloudflare guardado como secreto del entorno; no se debe añadir al repositorio.

La configuración `assets.not_found_handling: "single-page-application"` de `wrangler.jsonc` hace que las rutas de navegación que no correspondan a un archivo estático reciban `index.html`, permitiendo que Angular Router resuelva accesos directos a sus rutas. La carpeta de salida y el fallback SPA se documentan también en la [guía oficial de activos estáticos de Cloudflare](https://developers.cloudflare.com/workers/static-assets/).

**Versión de Wrangler:** no está declarada en `package.json` ni resuelta en `package-lock.json`; por tanto, el repositorio no fija una versión. Si Wrangler no está instalado localmente, `npx wrangler` puede descargar la versión más reciente. Para registrar y reutilizar la versión concreta empleada, consulta `npx wrangler --version` y, en una actualización de dependencias, añádela como dependencia de desarrollo usando exactamente ese número, sin `latest`:

```bash
npm install --save-dev wrangler@X.Y.Z
```

En ese comando, sustituye `X.Y.Z` por el número exacto mostrado por `npx wrangler --version`.

Al conservar `package.json` y `package-lock.json`, las siguientes instalaciones con `npm ci` reutilizarán esa versión local; se podrá invocar con `npm exec -- wrangler login` y `npm exec -- wrangler deploy`. Consulta la [documentación oficial de instalación y versionado de Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/).

## 10. Licencia

Uso académico. Todos los derechos reservados por el autor.
