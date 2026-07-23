# ORMAN Frontend

Frontend público de ORMAN, una plataforma familiar para presentar propiedades y unidades disponibles en alquiler.

## Estado actual

- Fases 00 a 05 completadas.
- Landing pública estructural disponible en `/`.
- Layout público reutilizable con encabezado, contenido mediante `router-outlet` y pie de página.
- Hero inicial y marcadores temporales para propiedades, funcionamiento y contacto.
- Navegación interna por anclas y menú móvil controlado con Angular Signal.
- Selector de temas ORMAN, Noche y Día integrado en el encabezado.
- Estructura `public/images/` preparada y documentada para futuros recursos visuales.
- Próxima fase pendiente de autorización expresa.

La landing todavía no incluye buscador, filtros, tarjetas reales, datos, formularios, login ni integración con backend.

## Tecnologías

- Angular 22.0.7 y Angular Router.
- TypeScript 6.0.3 con configuración estricta.
- Componentes standalone, Signals y ejecución zoneless.
- Tailwind CSS 4.3.3 con `@tailwindcss/postcss`.
- Variables CSS semánticas y tres temas mediante `data-theme`.
- CSS nativo, sin SCSS ni `tailwind.config.js`.
- Vitest 4.1.10.

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

## Estructura pública relevante

```text
public/images/
├── brand/
├── hero/
├── properties/
└── placeholders/

src/app/
├── layouts/public-layout/
├── features/public/landing/
│   └── components/
│       ├── hero-section/
│       ├── public-footer/
│       └── public-header/
└── shared/components/theme-selector/
```

La ruta raíz carga de forma diferida `PublicLayoutComponent`; su ruta hija vacía carga `LandingComponent` dentro del outlet del layout. El componente raíz conserva su propio outlet como punto de entrada del router.

Los futuros recursos colocados en `public/images/` se referenciarán desde Angular con rutas absolutas como `/images/brand/orman-logo.svg`. Las convenciones completas se encuentran en [public/images/README.md](public/images/README.md).

## Temas y accesibilidad

Los tokens de las tres paletas viven en `src/styles/themes.css` y se exponen a Tailwind mediante `@theme inline` en `src/styles.css`. La interfaz utiliza colores semánticos, foco visible, landmarks, un único `h1`, enlace de salto, áreas táctiles adecuadas y movimiento reducido cuando el sistema lo solicita.

## Documentación

El índice se encuentra en [docs/README.md](docs/README.md). La estructura visual pública se documenta en [docs/fases/04-1-recursos-visuales-publicos.md](docs/fases/04-1-recursos-visuales-publicos.md) y la landing actual en [docs/fases/05-estructura-landing-publica.md](docs/fases/05-estructura-landing-publica.md).

## Alcance

El repositorio contiene exclusivamente el frontend. No se han implementado backend, autenticación, panel administrativo, API, datos de propiedades ni funcionalidades propias de fases posteriores.
