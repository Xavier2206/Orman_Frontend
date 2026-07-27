# Fase 06.2 — Mejora del hero con logotipo animado

## Objetivo

Reemplazar la ilustración abstracta del edificio en el hero público por una composición visual centrada en el logotipo oficial de ORMAN, sin ampliar el alcance de la landing.

## Implementación

- Se conserva sin cambios el contenido textual, el `h1` y los dos CTA del hero.
- El panel derecho usa el recurso oficial `/images/brand/orman-logo.svg` sin editarlo, filtrarlo ni reemplazarlo.
- El panel usa fondo azul marino en ORMAN, carbón en Noche y blanco puro en Día. En Día, el logotipo se muestra directamente sobre el panel blanco, sin filtros ni tarjeta interior oscura.
- La composición incorpora líneas arquitectónicas, marcos finos, formas geométricas y un resplandor dorado decorativo. Los elementos puramente visuales usan `aria-hidden="true"`.
- Bajo el logotipo se muestran “Gestión familiar de propiedades”, “Casas y edificios” y “Departamentos y tiendas”. No se añaden estadísticas, precios ni datos simulados.
- En escritorio, el hero adopta el mismo ancho máximo de `1800px` y padding responsive del header. En móvil, conserva el orden texto seguido de panel y reduce la decoración secundaria.

## Animación y accesibilidad

- La entrada única del contenido visual combina opacidad de 0 a 1 con `translateX(20px)` a `0`, durante 540 ms.
- Las líneas decorativas aparecen después mediante una entrada breve de opacidad de 420 ms. No existe flotación, pulso ni ninguna animación infinita.
- Con `prefers-reduced-motion: reduce` se eliminan todas esas animaciones y el logo se muestra directamente en su estado final.
- Se conserva un único `h1`, el logo cuenta con texto alternativo descriptivo, los enlaces mantienen destinos `#propiedades` y `#contacto`, y los controles conservan áreas táctiles de al menos 48 px.

## Alcance excluido

No se modifican el header, footer, rutas, buscador, propiedades, formularios, API, login, imágenes externas ni librerías.

## Verificación

- Pruebas del componente ampliadas para comprobar el único `h1`, los CTA y anclas, el SVG oficial, su `alt`, los textos nuevos y la ausencia de “Edificio ORMAN”.
- Corrección validada con `npx ng build`: 232.32 kB iniciales brutos y 63.21 kB estimados.
- Corrección validada con `npx ng test --watch=false`: 8 archivos y 32 pruebas aprobadas.
- No se inicia servidor ni se ejecuta Git.

## Corrección local del tema Día

- La variante clara se resuelve dentro de `hero-section.component.css` mediante `:host-context(html[data-theme='light'])`.
- El panel exterior, las etiquetas y la superficie inmediata del logotipo son blancos; el texto permanece azul marino y las líneas decorativas conservan un dorado suave.
- En Día, el borde exterior gris se sustituye localmente por dorado al 45 % y se añade un marco interior de 1 px al 20 %, sin afectar los temas ORMAN y Noche.
- Refinamiento posterior en Día: el borde exterior aumenta a 2 px con dorado al 55 %, el marco interior conserva 1 px y sube al 28 %, y el logotipo recibe una tarjeta blanca de 2 px con borde dorado al 50 % y sombra azul marino suave.
- La tarjeta oscura detrás del logotipo se elimina solo en Día. ORMAN y Noche no reciben sobrescrituras locales.
- No se modifican los tokens globales, el SVG oficial, el contenido ni la animación de entrada aprobada.
- La corrección local supera `npx ng build` con 232.32 kB iniciales brutos y 63.21 kB estimados, además de `npx ng test --watch=false` con 8 archivos y 32 pruebas aprobadas.
- El refinamiento de bordes dorados mantiene esos resultados: build correcto con 232.32 kB iniciales y 32 pruebas aprobadas.
- El marco dorado del logotipo y el refuerzo final de bordes mantienen el build correcto en 232.32 kB iniciales, con 8 archivos y 32 pruebas aprobadas.
