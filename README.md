# ORMAN Frontend

Frontend público de ORMAN, una plataforma familiar para presentar propiedades y unidades disponibles en alquiler. El proyecto se desarrolla de forma incremental y, en su estado actual, contiene únicamente la base técnica generada con Angular.

## Estado actual

- Fase 00 — Planificación e inspección: completada.
- Fase 01 — Creación del proyecto Angular: completada.
- Próximo paso recomendado: Fase 02 — Estructura base del frontend, pendiente de autorización.

La landing page, Tailwind CSS, los temas y los componentes funcionales todavía no se han implementado.

## Tecnologías instaladas

- Angular 22.0.7.
- Angular CLI 22.0.7.
- TypeScript 6.0.3 con configuración estricta.
- Angular Router 22.0.7.
- Componentes standalone.
- Ejecución zoneless.
- CSS global y CSS por componente.
- Vitest 4.1.10 para pruebas unitarias.
- npm 11.16.0.

## Requisitos

- Node.js compatible con Angular 22. El entorno de creación utilizó Node.js 24.18.0.
- npm 11 o una versión compatible.
- Git.

## Instalación

Desde la carpeta `orman-frontend`:

```bash
npm install
```

## Ejecución local

```bash
npm start
```

Angular mostrará la dirección local del servidor de desarrollo en la terminal.

## Comandos disponibles

```bash
npm start
npm run build
npm test -- --watch=false
npm run watch
```

## Estructura actual

```text
orman-frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── app.component.css
│   │   ├── app.component.html
│   │   ├── app.component.spec.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── docs/
│   ├── fases/
│   ├── theory/
│   ├── README.md
│   └── CHANGELOG.md
├── angular.json
├── package.json
└── tsconfig.json
```

Las carpetas de arquitectura `core`, `shared`, `layouts` y `features` se incorporarán únicamente cuando sean necesarias.

## Temas

ORMAN tendrá posteriormente tres temas basados en variables CSS semánticas: ORMAN, noche y día. El sistema de temas todavía no existe y corresponde a una fase futura.

## Documentación

El índice y estado documental se encuentran en [docs/README.md](docs/README.md). Los cambios efectivamente realizados se registran en [docs/CHANGELOG.md](docs/CHANGELOG.md).

## Alcance

Este repositorio contiene exclusivamente el frontend. No incluye backend, autenticación, administración, persistencia ni integración con una API.
