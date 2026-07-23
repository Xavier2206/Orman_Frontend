# Fase 05 — Estructura base de la landing pública de ORMAN

Fecha de ejecución: 2026-07-22.

## 1. Objetivo

Crear la estructura visual y arquitectónica inicial de la landing pública de ORMAN con Angular 22, Tailwind CSS 4 y el sistema existente de temas ORMAN, Noche y Día.

## 2. Alcance

La fase incluye un layout público reutilizable, header responsive, navegación por anclas, menú móvil, integración del selector de temas, hero estructural, tres secciones temporales, footer, accesibilidad, rutas, pruebas y documentación.

No incluye buscador, filtros, tarjetas de propiedades, modelos, datos simulados, servicios, formularios, mapas, WhatsApp, login funcional, autenticación, backend, API, rutas nuevas ni imágenes remotas.

## 3. Estado previo

- Angular 22.0.7, TypeScript 6.0.3 y componentes standalone.
- Aplicación zoneless con Angular Router y Vitest.
- Tailwind CSS 4.3.3 mediante PostCSS.
- Tres temas semánticos y `ThemeService` implementados.
- Selector de temas existente bajo `shared/components`.
- Ruta `/` diferida hacia una landing temporal que demostraba el sistema de temas.
- Sin SCSS ni `tailwind.config.js`.

## 4. Estructura del layout

`PublicLayoutComponent` compone las zonas persistentes de la experiencia pública:

```text
PublicLayoutComponent
├── enlace de salto
├── PublicHeaderComponent
├── main#contenido-principal
│   └── router-outlet
└── PublicFooterComponent
```

El contenedor usa `min-h-screen`, fondo `bg-page`, texto `text-content` y transiciones de color eliminadas mediante `motion-reduce:transition-none` cuando se solicita movimiento reducido. No contiene lógica de negocio.

## 5. Estructura de componentes

```text
features/public/landing/
├── components/
│   ├── hero-section/
│   ├── public-footer/
│   └── public-header/
├── landing.component.html
├── landing.component.spec.ts
└── landing.component.ts
```

Todos los componentes son standalone, no usan hojas CSS propias y no se añadieron módulos, servicios, modelos, mocks ni barrel files.

## 6. Configuración de rutas

La configuración final contiene una única rama pública:

```text
/
└── PublicLayoutComponent (carga diferida)
    └── ruta hija "" con pathMatch: "full"
        └── LandingComponent (carga diferida)
```

El outlet de `App` recibe el layout. El outlet interno del layout recibe la landing. No se crearon rutas adicionales.

## 7. Encabezado

El header presenta la marca ORMAN, el subtítulo “Gestión de propiedades”, navegación a Inicio, Propiedades, Cómo funciona y Contacto, el selector de temas existente y un botón visual “Iniciar sesión”. El botón tiene `type="button"`, no navega y comunica mediante `aria-label` que estará disponible próximamente.

En escritorio la navegación y controles se distribuyen horizontalmente. La convención del contenedor es `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

## 8. Menú móvil

`PublicHeaderComponent` mantiene `isMenuOpen` como un Signal booleano local. El botón hamburguesa:

- usa SVG inline decorativo con `aria-hidden="true"`;
- expone `aria-expanded` con el valor del Signal;
- referencia `mobile-navigation` mediante `aria-controls`;
- abre y cierra el panel sin librerías externas;
- conserva una superficie táctil mínima de 44 px.

Cada enlace móvil llama a `closeMenu()`, por lo que el panel se cierra al seleccionar una sección. El panel también contiene el selector de temas y el botón visual de login.

## 9. Hero

El hero contiene la etiqueta “Propiedades familiares en alquiler”, el único `h1` de la página, el texto descriptivo solicitado y enlaces a `#propiedades` y `#contacto`.

La zona visual derecha es una composición local con tokens semánticos. Muestra “Edificio ORMAN” y “Espacios disponibles”; no usa fotografías, recursos externos ni estadísticas inventadas.

## 10. Secciones temporales

Después del hero aparecen tres marcadores breves:

- `#propiedades`: “Espacios disponibles”.
- `#como-funciona`: “¿Cómo funciona ORMAN?”.
- `#contacto`: “Contacto”.

Los textos indican explícitamente el carácter posterior de los datos y del formulario. No existen buscador, filtros, tarjetas ni formulario.

## 11. Footer

El footer presenta ORMAN, “Gestión familiar de propiedades en alquiler”, los cuatro enlaces internos y “© 2026 ORMAN. Todos los derechos reservados.”. No incluye redes, datos de contacto falsos, políticas ni enlaces a rutas inexistentes.

## 12. Accesibilidad

- Un solo `h1`, ubicado en el hero.
- Jerarquía posterior con `h2`.
- Landmarks `header`, `nav`, `main` y `footer`.
- Navegaciones con nombres accesibles diferentes.
- Enlace “Saltar al contenido principal” visible al recibir foco.
- Foco global visible con el token del tema.
- Menú móvil con `aria-expanded`, `aria-controls` y etiqueta accesible.
- SVG decorativo con `aria-hidden`.
- Botones y enlaces principales con áreas táctiles mínimas.
- Colores semánticos compatibles con las tres paletas.
- Desplazamiento suave solo bajo `prefers-reduced-motion: no-preference`.
- Transiciones desactivadas con `motion-reduce` en las zonas temáticas.

## 13. Archivos creados

- `src/app/layouts/public-layout/public-layout.component.ts`.
- `src/app/layouts/public-layout/public-layout.component.html`.
- `src/app/layouts/public-layout/public-layout.component.spec.ts`.
- `src/app/features/public/landing/components/public-header/public-header.component.ts`.
- `src/app/features/public/landing/components/public-header/public-header.component.html`.
- `src/app/features/public/landing/components/public-header/public-header.component.spec.ts`.
- `src/app/features/public/landing/components/hero-section/hero-section.component.ts`.
- `src/app/features/public/landing/components/hero-section/hero-section.component.html`.
- `src/app/features/public/landing/components/hero-section/hero-section.component.spec.ts`.
- `src/app/features/public/landing/components/public-footer/public-footer.component.ts`.
- `src/app/features/public/landing/components/public-footer/public-footer.component.html`.
- `src/app/features/public/landing/components/public-footer/public-footer.component.spec.ts`.
- `docs/fases/05-estructura-landing-publica.md`.
- `docs/theory/05-layouts-y-composicion-angular.md`.

## 14. Archivos modificados

- `src/app/app.routes.ts`.
- `src/app/app.component.ts` (formato).
- `src/app/app.component.spec.ts`.
- `src/app/features/public/landing/landing.component.ts`.
- `src/app/features/public/landing/landing.component.html`.
- `src/app/features/public/landing/landing.component.spec.ts`.
- `src/styles.css`.
- `src/app/shared/components/theme-selector/theme-selector.component.spec.ts` (formato, sin cambiar su cobertura).
- `README.md`.
- `docs/README.md`.
- `docs/CHANGELOG.md`.
- `docs/fases/03-configuracion-tailwind.md` (formato).
- `docs/fases/04-sistema-de-temas.md` (formato).
- `docs/theory/03-tailwind-css.md` (formato).

No se eliminó ningún archivo. `ThemeService` y `ThemeSelectorComponent` conservaron su ubicación y responsabilidades.

## 15. Comandos ejecutados

Comandos principales de trabajo y validación:

```powershell
npx prettier --write "src/app/**/*.{ts,html}" "src/styles.css"
npx ng test --watch=false
npx ng build
Invoke-WebRequest -Uri 'http://127.0.0.1:4200/' -UseBasicParsing
rg --files -g '*.scss' -g '!node_modules' -g '!dist'
rg --files -g 'tailwind.config.js' -g '!node_modules' -g '!dist'
```

También se inició temporalmente `ng serve` sobre `127.0.0.1:4200`, se inspeccionó el puerto y se detuvo el proceso creado. No se ejecutó ningún comando Git ni se inspeccionó `.git`.

## 16. Pruebas

`npx ng test --watch=false` terminó con código 0:

- 8 archivos aprobados.
- 29 pruebas aprobadas.
- 0 fallos.

Las pruebas cubren creación y composición del layout, header, navegación, selector, `aria-expanded`, apertura/cierre del menú, cierre al seleccionar una opción, hero, acciones, footer, landing, ruta raíz y sistema de temas existente.

## 17. Compilación

`npx ng build` terminó con código 0:

- Total inicial: 224.32 kB brutos y 62.25 kB estimados.
- CSS global: 18.86 kB brutos y 3.96 kB estimados.
- Chunk diferido del layout: 9.00 kB brutos y 2.27 kB estimados.
- Chunk diferido de la landing: 4.72 kB brutos y 1.34 kB estimados.
- Salida: `dist/orman-frontend`.

## 18. Validación HTTP

El servidor de desarrollo respondió HTTP 200 en `http://127.0.0.1:4200/`. El HTML base tuvo 485 caracteres. El navegador integrado no ofreció ningún backend disponible, por lo que la presencia de ORMAN, el título del hero, “Espacios disponibles”, “¿Cómo funciona ORMAN?” y “Contacto” se validó mediante las pruebas de renderizado y la inspección directa de plantillas.

Al finalizar se detuvo el servidor temporal y se confirmó `PORT_4200_FREE=true`.

## 19. Errores

1. Las primeras ejecuciones de build y pruebas no pudieron leer rutas del proyecto dentro del sandbox.
2. `Start-Process` encontró claves duplicadas `Path`/`PATH` en el entorno al intentar iniciar el servidor oculto.
3. El navegador integrado no tenía backends disponibles.

## 20. Soluciones

1. Build y pruebas se repitieron con autorización fuera del sandbox y concluyeron correctamente.
2. El servidor se inició directamente mediante el ejecutable de Node y el CLI local de Angular; se identificó su PID y se detuvo de forma explícita.
3. Se aplicó la validación alternativa autorizada: HTTP, pruebas de renderizado e inspección de plantillas y CSS.

## 21. Estado final

La Fase 05 está completada. `/` carga el layout público y su landing hija de forma diferida. Header, menú móvil, selector de temas, hero, marcadores y footer comparten los tokens de tres temas y cumplen la estructura accesible definida.

No existe SCSS ni `tailwind.config.js`. No se añadieron dependencias, no se ejecutó Git y no se avanzó a la Fase 06.

## 22. Próximo paso

Esperar autorización expresa. La siguiente fase sugerida es la Fase 06 del plan del proyecto, sin iniciarla automáticamente.
