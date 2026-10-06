# ORMAN

> Trabajo Final · Diplomado en Desarrollo Web y Aplicaciones Móviles · UAJMS 2026<br>
> Autor: `Xavier Ortega Mancilla` · Tutor: <Nombre del tutor>

## 1. Descripción

ORMAN Frontend es la aplicación web desarrollada con Angular para administrar alquileres e interactuar con el Backend ORMAN. Incluye una landing pública y un área privada para gestionar personas, roles, menús, asignaciones, procesos, propiedades, unidades, contratos, cuotas y pagos. También ofrece comprobantes, documentos PDF, mapas, fotografías y notificaciones.

Este repositorio contiene únicamente el Frontend web. El Backend Spring Boot se mantiene en otro repositorio.

**Sistema desplegado:** pendiente.

## 2. Stack tecnológico

| Componente | Versión | Función |
|---|---:|---|
| Angular | 22.0.7 | Aplicación y componentes standalone |
| TypeScript | 6.0.3 | Lenguaje y tipado |
| Angular Router | 22.0.7 | Navegación y carga diferida de rutas |
| Angular HttpClient | 22.0.7 | Comunicación HTTP con la API |
| Angular Signals | 22.0.7 | Estado reactivo de la interfaz |
| RxJS | 7.8.2 | Composición de operaciones asíncronas |
| Angular Material | 22.0.7 | Iconos y componentes Material utilizados por la aplicación |
| Tailwind CSS | 4.3.3 | Estilos de interfaz |
| ngx-sonner | 3.1.0 | Notificaciones visuales |
| Leaflet | 1.9.4 | Mapas |
| jsPDF | 4.2.1 | Generación de documentos PDF |
| Vitest | 4.1.10 | Pruebas unitarias |
| jsdom | 28.1.0 | Entorno DOM para pruebas |
| npm | 11.16.0 | Gestor de paquetes declarado por el proyecto |

Las versiones de Angular, TypeScript y las dependencias corresponden a las resoluciones de `package-lock.json`; npm se declara mediante `packageManager` en `package.json`. Las funcionalidades se organizan en componentes standalone y rutas con carga diferida.

## 3. Requisitos previos

- Node.js compatible con Angular 22. El proyecto no define una versión mediante `engines`.
- npm 11.16.0, indicado en `package.json`.
- Git.
- Backend ORMAN disponible para las funciones que consumen la API.

## 4. Instalación local

```bash
git clone <URL del repositorio frontend>
cd Orman_Frontend
npm ci
npm start
```

La aplicación de desarrollo queda disponible en `http://localhost:4200`.

El Backend local se espera en `http://localhost:9090`. `npm start` ejecuta `ng serve` con la configuración `development`; Angular utiliza `/api/v1` y `proxy.conf.json` reenvía las solicitudes `/api` a `http://localhost:9090`. Así, el navegador llama al frontend en el mismo origen y no necesita conectarse directamente al backend.

### Autenticación y comunicación

El login web envía usuario y contraseña a `POST /api/v1/auth/login`. Tras recibir `AUTHENTICATED`, Angular conserva el JWT de acceso en memoria y consulta `GET /api/v1/auth/context` para cargar los datos de la cuenta y sus roles. Las rutas privadas están protegidas por un guard de autenticación.

La renovación de sesión utiliza la cookie de refresh `HttpOnly` mediante solicitudes con `withCredentials`; Angular no lee esa cookie. La protección XSRF utiliza la cookie `XSRF-TOKEN` y el encabezado `X-XSRF-TOKEN`. El access token y el refresh token no se guardan en `localStorage`; allí se conservan preferencias de tema y un identificador auxiliar del dispositivo.

### WebSocket y notificaciones

El cliente usa WebSocket/STOMP en `ws://localhost:9090/ws` y se suscribe al canal privado `/user/queue/notificaciones`. Los avisos en tiempo real actualizan la interfaz; REST continúa siendo la fuente de verdad. La campana muestra el resumen y el listado de notificaciones y permite marcarlas como leídas.

## 5. Entornos de Angular

El Frontend no requiere archivos `.env` ni variables de entorno para el desarrollo local. `angular.json` reemplaza `environment.ts` por `environment.development.ts` al ejecutar `ng serve` o compilar con `development`.

`ng build` usa `production` por defecto y conserva `environment.ts`: REST utiliza HTTPS y WebSocket utiliza WSS del backend desplegado. Wrangler sirve los estáticos de `dist/orman-frontend/browser`; no agrega endpoints locales al build de producción.

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
│   ├── styles.css
│   ├── index.html
│   └── main.ts
├── angular.json
├── package.json
├── package-lock.json
├── proxy.conf.json
└── README.md
```

Las rutas funcionales incluyen personas, roles, menús, asignaciones, procesos, propiedades, unidades, contratos y pagos. El área de pagos contiene la gestión de cuotas y pagos y la configuración de QR de cobro. Propiedades y unidades incluyen formularios, fotografías y vistas de detalle; contratos incluyen documentos PDF.

## 7. Roles y credenciales

Este repositorio no incluye credenciales de acceso. Solicita credenciales de prueba por el canal autorizado.

El área privada conserva las funciones de administración de roles y menús, asignación de roles, asignación de menús y asignación de procesos. El acceso y la navegación se construyen a partir del contexto recibido del Backend.

## 8. Pruebas

El proyecto utiliza Vitest para validar componentes, servicios, autenticación, interceptor, renovación de sesión, contexto, guardas, WebSocket, notificaciones y módulos funcionales.

```bash
npm test -- --watch=false
```

Los tests se encuentran junto al código correspondiente en archivos `*.spec.ts`.

## 9. Despliegue

**Frontend público:** pendiente.

Para generar los archivos estáticos de producción:

```bash
npm run build
```

Angular genera la salida en `dist/orman-frontend/`, dentro de `dist/`. Este proyecto todavía no declara una plataforma ni una URL pública de despliegue.

## 10. Licencia

Uso académico. Todos los derechos reservados por el autor.
