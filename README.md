# ORMAN Frontend

Frontend público de ORMAN, una plataforma familiar para presentar propiedades y unidades disponibles en alquiler. El proyecto se desarrolla por fases con Angular y una organización por funcionalidades.

## Estado actual

- Fase 00 — Planificación e inspección: completada.
- Fase 01 — Creación del proyecto Angular: completada.
- Fase 02 — Estructura base del frontend: completada.
- Fase 03 — Instalación y configuración de Tailwind CSS: completada.
- Próxima fase prevista: Fase 04, pendiente de autorización expresa.

La aplicación dispone de una landing temporal en `/` para comprobar el enrutamiento y el procesamiento de utilidades Tailwind. La landing definitiva y el sistema de tres temas todavía no se han implementado.

## Tecnologías

- Angular 22.0.7 y Angular Router.
- TypeScript 6.0.3 con configuración estricta.
- Componentes standalone y ejecución zoneless.
- Tailwind CSS 4.3.3.
- `@tailwindcss/postcss` 4.3.3 y PostCSS 8.5.22.
- CSS nativo, sin SCSS.
- Vitest 4.1.10 para pruebas unitarias y de integración.

## Configuración de Tailwind CSS

Se intentó primero el procedimiento automatizado recomendado por Angular, `ng add tailwindcss`, pero Angular CLI 22.0.7 detectó el paquete y no encontró schematics compatibles. Se aplicó entonces la alternativa manual de la misma guía oficial:

```powershell
npm install --save-dev tailwindcss @tailwindcss/postcss postcss
```

La integración utiliza `.postcssrc.json` con el plugin `@tailwindcss/postcss` y la importación global:

```css
@import "tailwindcss";
```

No existe un `tailwind.config.js` tradicional porque Tailwind CSS 4 no lo necesita para esta configuración inicial.

## Requisitos e instalación

- Node.js compatible con Angular 22.
- npm 11 o una versión compatible.

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

La organización es por funcionalidades. `core`, `shared` y `layouts` se crearán solo cuando contengan elementos con responsabilidades reales.

## Documentación

El índice documental se encuentra en [docs/README.md](docs/README.md). La integración está registrada en [docs/fases/03-configuracion-tailwind.md](docs/fases/03-configuracion-tailwind.md).

## Alcance

Este repositorio contiene exclusivamente el frontend. No incluye backend, autenticación, administración, persistencia ni integración con una API.
