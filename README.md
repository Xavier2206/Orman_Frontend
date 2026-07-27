# ORMAN Frontend

Frontend público de ORMAN, una plataforma familiar para presentar propiedades y unidades disponibles en alquiler.

## Estado actual

- Fases 00 a 05, corrección 05.1 y Fases 06.1–06.2 completadas.
- Fase 10 de modal visual de inicio de sesión en dos pasos completada.
- Landing pública estructural disponible en `/`.
- Layout público reutilizable con encabezado, contenido mediante `router-outlet` y pie de página.
- Logotipo oficial visible en el encabezado desde `/images/brand/orman-logo.svg`.
- Hero con logotipo oficial, composición arquitectónica decorativa y movimiento reducido compatible; además de marcadores temporales para propiedades, funcionamiento y contacto.
- Navegación interna por anclas, header persistente y menú móvil controlado con Angular Signal.
- Selector compacto de temas ORMAN, Día y Noche integrado en el encabezado.
- Acceso visual responsive con QuickMenu no modal y LoginModal de credenciales independientes, coordinados desde el header.
- Estructura `public/images/` preparada, documentada y con el logotipo oficial integrado.
- Próxima fase pendiente de autorización expresa.

La landing todavía no incluye buscador, filtros, tarjetas reales, datos, autenticación real ni integración con backend. El modal de acceso es exclusivamente visual y no envía credenciales.

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
├── features/auth/
│   ├── quick-menu/
│   └── login-modal/
├── features/public/landing/
│   └── components/
│       ├── hero-section/
│       ├── public-footer/
│       └── public-header/
└── shared/components/theme-selector/
```

La ruta raíz carga de forma diferida `PublicLayoutComponent`; su ruta hija vacía carga `LandingComponent` dentro del outlet del layout. El componente raíz conserva su propio outlet como punto de entrada del router.

Los recursos colocados en `public/images/` se sirven desde la raíz pública. El logotipo oficial se referencia en Angular mediante `/images/brand/orman-logo.svg`, sin importarlo desde TypeScript. Las convenciones completas se encuentran en [public/images/README.md](public/images/README.md).

## Temas y accesibilidad

Los tokens de las tres paletas viven en `src/styles/themes.css` y se exponen a Tailwind mediante `@theme inline` en `src/styles.css`. La interfaz utiliza colores semánticos, foco visible, landmarks, un único `h1`, enlace de salto, áreas táctiles adecuadas y movimiento reducido cuando el sistema lo solicita. El panel del hero conserva una superficie azul marino para mantener el contraste del logotipo oficial incluso en el tema Día.

## Documentación

El índice se encuentra en [docs/README.md](docs/README.md). La estructura visual pública se documenta en [docs/fases/04-1-recursos-visuales-publicos.md](docs/fases/04-1-recursos-visuales-publicos.md), la landing en [docs/fases/05-estructura-landing-publica.md](docs/fases/05-estructura-landing-publica.md), la integración del logotipo en [docs/fases/05-1-integracion-logo-orman.md](docs/fases/05-1-integracion-logo-orman.md), las mejoras del header en [docs/fases/06-1-mejora-header-selector-temas.md](docs/fases/06-1-mejora-header-selector-temas.md), el hero con logotipo animado en [docs/fases/06-2-mejora-hero-logo-animado.md](docs/fases/06-2-mejora-hero-logo-animado.md) y el modal visual en [docs/fases/10-modal-inicio-sesion.md](docs/fases/10-modal-inicio-sesion.md).

## Alcance

El repositorio contiene exclusivamente el frontend. No se han implementado backend, autenticación, panel administrativo, API, datos de propiedades ni funcionalidades propias de fases posteriores.
