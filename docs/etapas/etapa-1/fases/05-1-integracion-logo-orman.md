# Fase 05.1 — Integración del logotipo oficial de ORMAN

Fecha de ejecución: 2026-07-24.

## 1. Objetivo

Integrar el logotipo oficial de ORMAN en la landing pública como corrección pequeña posterior a la Fase 05, sin iniciar funcionalidades ni cambios correspondientes a la Fase 06.

## 2. Estado previo

La landing ya contaba con layout público, header responsive, menú móvil, hero estructural, footer, selector de temas y navegación interna. El encabezado mostraba una marca temporal compuesta por una “O”, el nombre ORMAN y el descriptor “Gestión de propiedades”. El hero repetía otra “O” como recurso visual temporal.

## 3. Ubicación del logotipo

El archivo oficial se encontraba en:

```text
public/images/brand/orman-logo.svg
```

La inspección confirmó que es XML válido y legible. Declara `width="457"`, `height="557"` y `viewBox="0 0 457 557"`. Contiene un trazado dorado fijo (`#d4af37`) y no contiene elementos de texto. El archivo no se renombró ni se modificó.

## 4. Forma de servir recursos desde `public`

Angular copia el contenido de `public` a la raíz de la compilación porque `angular.json` declara esa carpeta como recurso público. Por ello, el logotipo se usa directamente con:

```text
/images/brand/orman-logo.svg
```

No se utiliza una ruta relativa hacia `public` ni una importación desde TypeScript.

## 5. Componentes modificados

- `PublicHeaderComponent`: integra el logotipo oficial dentro del enlace a `#inicio`.
- `HeroSectionComponent`: elimina la “O” temporal que simulaba una marca adicional.

`PublicFooterComponent` fue revisado y conserva su marca textual discreta; no se añadió otra imagen para evitar repetición innecesaria.

## 6. Decisiones visuales

El logotipo conserva su proporción vertical mediante `h-12`, `lg:h-14`, `w-auto` y `object-contain`. La altura queda limitada para no agrandar excesivamente el header. Como el SVG no incluye texto, se mantienen el nombre ORMAN y “Gestión de propiedades” junto a la imagen.

No se rediseñaron el header, el hero ni el footer. Tampoco se aplicaron filtros CSS ni se creó una variante artificial del logotipo.

## 7. Accesibilidad

La imagen usa el texto alternativo “ORMAN - Gestión de propiedades”. El enlace conserva destino `#inicio`, área táctil mínima, borde redondeado para el foco global visible y el nombre accesible “Ir al inicio de ORMAN”. La información textual adyacente permite reconocer el sitio aunque la imagen no cargue.

## 8. Compatibilidad con temas

El SVG utiliza un dorado fijo y se muestra sin alteraciones en los temas ORMAN, Noche y Día. La relación calculada entre `#d4af37` y el fondo del header es 9.18:1 en ORMAN, 9.52:1 en Noche y 2.10:1 en Día.

La silueta es perceptible en Día, pero su contraste es considerablemente menor sobre blanco. Como el logotipo es una marca gráfica y está acompañado por nombre y descriptor con color semántico, se conservó el archivo oficial. Si la guía de marca lo permite, una variante oficial preparada para fondos claros sería una mejora posterior; no se creó una variante falsa ni se aplicaron `invert`, `brightness`, `hue-rotate` u otros filtros agresivos.

## 9. Pruebas

`PublicHeaderComponentSpec` verifica:

- presencia de la imagen;
- `src` exacto `/images/brand/orman-logo.svg`;
- texto alternativo descriptivo;
- enlace a `#inicio` y nombre accesible;
- renderizado del selector de temas;
- apertura, cierre y selección del menú móvil.

Las pruebas existentes se conservaron.

## 10. Compilación

La compilación de producción se ejecutó con:

```powershell
npx ng build
```

Terminó con código 0:

- total inicial: 225.79 kB brutos y 62.43 kB estimados;
- CSS global: 20.32 kB brutos y 4.15 kB estimados;
- chunk diferido del layout: 9.01 kB brutos y 2.31 kB estimados;
- chunk diferido de la landing: 4.58 kB brutos y 1.31 kB estimados;
- salida: `dist/orman-frontend`.

`npx ng test --watch=false` también terminó con código 0: 8 archivos y 30 pruebas aprobadas, sin fallos.

El archivo compilado existe en `dist/orman-frontend/browser/images/brand/orman-logo.svg`. Su tamaño de 63 510 bytes y SHA-256 coinciden exactamente con el original.

## 11. Validación HTTP del SVG

Se inició temporalmente el servidor de Angular en `127.0.0.1:4200`. Los resultados fueron:

- `/`: HTTP 200, `Content-Type: text/html`, 485 bytes;
- `/images/brand/orman-logo.svg`: HTTP 200, `Content-Type: image/svg+xml`, 63 510 bytes.

El contenido servido comienza con la declaración XML esperada. El servidor temporal propio fue detenido al finalizar y dejó de escuchar en el puerto. Un proceso Angular preexistente, ajeno a esta ejecución y con PID 26572, permaneció sin cambios.

## 12. Archivos creados

- `docs/etapas/etapa-1/fases/05-1-integracion-logo-orman.md`.

## 13. Archivos modificados

- `src/app/layouts/public-layout/components/public-header/public-header.component.html`.
- `src/app/layouts/public-layout/components/public-header/public-header.component.spec.ts`.
- `src/app/features/public/landing/components/hero-section/hero-section.component.html`.
- `docs/README.md`.
- `docs/CHANGELOG.md`.
- `README.md`.
- `docs/etapas/etapa-1/fases/05-estructura-landing-publica.md`.

## 14. Errores encontrados

1. Los primeros intentos de compilación y pruebas no pudieron leer rutas del proyecto dentro del sandbox.
2. Un proceso Angular preexistente ocupaba el puerto 4200 de forma intermitente sin responder por HTTP.
3. El navegador integrado no ofreció ningún backend disponible para inspección visual.
4. El dorado fijo tiene contraste menor sobre el fondo blanco del tema Día.

## 15. Soluciones aplicadas

1. Compilación y pruebas se repitieron con la autorización requerida fuera del sandbox.
2. Se inició un servidor propio ligado a `127.0.0.1:4200`, se registró su PID, se completó la validación y se detuvo únicamente ese proceso.
3. La estructura visual se verificó mediante inspección del SVG y plantillas, pruebas de renderizado y cálculo de contraste por tema; la falta de navegador se documentó.
4. El SVG oficial no se alteró. Se mantuvo texto adyacente con colores semánticos y se documentó la posible necesidad futura de una variante oficial para fondos claros.

## 16. Estado final

La Fase 05.1 está completada. El logotipo oficial aparece en el header de escritorio y móvil, mantiene su proporción, enlaza a `#inicio` y conserva un nombre accesible claro. La marca temporal del hero fue retirada y el footer no recibió una copia adicional.

No se creó SCSS ni `tailwind.config.js`, no se instalaron paquetes, no se modificó el SVG, no se eliminó ningún archivo, no se ejecutó Git y no se avanzó a la Fase 06.

## 17. Próximo paso

Esperar autorización expresa antes de iniciar una fase posterior. La Fase 06 no forma parte de esta corrección.
