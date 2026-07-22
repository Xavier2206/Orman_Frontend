# ORMAN Frontend

Frontend público de ORMAN, desarrollado por fases con Angular y una organización por funcionalidades.

## Estado actual

- Fases 00 a 04 completadas.
- Ruta pública `/` con carga diferida.
- Demostración temporal del sistema de temas ORMAN, Noche y Día.
- Selección persistente mediante `localStorage`.
- Próxima fase pendiente de autorización expresa.

La landing actual solo demuestra la infraestructura visual. No es la landing pública definitiva.

## Tecnologías

- Angular 22.0.7 y Angular Router.
- TypeScript 6.0.3 con configuración estricta.
- Componentes standalone, Signals y ejecución zoneless.
- Tailwind CSS 4.3.3 con `@tailwindcss/postcss` 4.3.3.
- Variables CSS semánticas y `data-theme`.
- CSS nativo, sin SCSS ni `tailwind.config.js`.
- Vitest 4.1.10.

## Temas disponibles

- `orman`: tema predeterminado con la paleta navy y dorada original.
- `dark`: modo Noche.
- `light`: modo Día.

`ThemeService` conserva el tema activo en un Signal de solo lectura, aplica `data-theme` sobre `document.documentElement` y guarda la elección válida con la clave `orman-theme`.

## Instalación y ejecución

Desde la carpeta `orman-frontend`:

```powershell
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200/`.

## Comandos disponibles

```powershell
npm start
npm run build
npm test -- --watch=false
npm run watch
```

## Estructura relevante

```text
src/app/
├── core/theme/
│   ├── theme.constants.ts
│   ├── theme.model.ts
│   ├── theme.service.spec.ts
│   └── theme.service.ts
├── features/public/landing/
└── shared/components/theme-selector/
    ├── theme-selector.component.html
    ├── theme-selector.component.spec.ts
    └── theme-selector.component.ts
```

Los tokens de las tres paletas viven en `src/styles/themes.css`. `src/styles.css` los expone a Tailwind CSS 4 mediante `@theme inline` para utilidades como `bg-page`, `text-content`, `text-muted`, `bg-accent` y `border-theme-border`.

## Documentación

El índice se encuentra en [docs/README.md](docs/README.md). La implementación de temas está documentada en [docs/fases/04-sistema-de-temas.md](docs/fases/04-sistema-de-temas.md).

## Alcance

El repositorio contiene exclusivamente el frontend. En la fase actual no se implementaron backend, autenticación, panel administrativo, API ni landing pública definitiva.
