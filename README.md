# ORMAN Frontend

Frontend público de ORMAN, una plataforma familiar para presentar propiedades y unidades disponibles en alquiler. El proyecto se desarrolla por fases con Angular y una organización por funcionalidades.

## Estado actual

- Fase 00 — Planificación e inspección: completada.
- Fase 01 — Creación del proyecto Angular: completada.
- Fase 02 — Estructura base del frontend: completada.
- Próximo paso recomendado: Fase 03, únicamente después de recibir autorización expresa.

La aplicación dispone de una landing temporal en `/` para comprobar el enrutamiento. La landing definitiva, Tailwind CSS, los temas y los componentes funcionales todavía no se han implementado.

## Tecnologías

- Angular 22.
- Angular Router.
- TypeScript con configuración estricta.
- Componentes standalone y ejecución zoneless.
- CSS nativo, sin SCSS.
- Vitest para pruebas unitarias y de integración.

## Requisitos

- Node.js compatible con Angular 22.
- npm 11 o una versión compatible.

## Instalación

Desde la carpeta `orman-frontend`:

```powershell
npm install
```

## Ejecución local

```powershell
npm start
```

La vista pública estará disponible en `http://localhost:4200/`.

## Comandos disponibles

```powershell
npm start
npm run build
npm test -- --watch=false
npm run watch
```

## Estructura actual de la aplicación

```text
src/app/
├── features/
│   └── public/
│       └── landing/
│           ├── landing.component.css
│           ├── landing.component.html
│           ├── landing.component.spec.ts
│           └── landing.component.ts
├── app.component.css
├── app.component.html
├── app.component.spec.ts
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

La organización es por funcionalidades. `core`, `shared` y `layouts` se crearán solo cuando contengan elementos con responsabilidades reales; no existen como carpetas vacías.

## Enrutamiento

La ruta `/` carga de forma diferida `LandingComponent`, ubicado en `features/public/landing`. El componente raíz funciona únicamente como contenedor de `router-outlet`.

## Documentación

El índice documental se encuentra en [docs/README.md](docs/README.md). La ejecución de esta fase está registrada en [docs/fases/02-estructura-frontend.md](docs/fases/02-estructura-frontend.md).

## Alcance

Este repositorio contiene exclusivamente el frontend. No incluye backend, autenticación, administración, persistencia ni integración con una API.
