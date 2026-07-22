# Changelog

Este archivo registra únicamente cambios realizados en ORMAN Frontend.

## 2026-07-22 — Fase 03

### Añadido

- Tailwind CSS 4.3.3 como dependencia de desarrollo.
- `@tailwindcss/postcss` 4.3.3 y PostCSS 8.5.22.
- Configuración oficial de PostCSS en `.postcssrc.json`.
- Importación global de Tailwind CSS en `src/styles.css`.
- Documentación de ejecución y fundamentos de Tailwind CSS.

### Cambiado

- Landing temporal adaptada a utilidades Tailwind neutras.
- `LandingComponent` dejó de referenciar una hoja CSS propia innecesaria.
- README principal e índice documental actualizados al estado de la Fase 03.

### Eliminado

- `landing.component.css`, porque toda la prueba visual temporal se expresa con utilidades Tailwind y el archivo habría quedado vacío.

### Verificado

- Compilación de producción satisfactoria con un bundle global de estilos de 5.13 kB.
- Dos archivos de prueba y cinco pruebas satisfactorias.
- Respuesta HTTP 200 del servidor de desarrollo en `/`.
- Reglas generadas para utilidades como `min-h-screen`, `bg-slate-100`, `text-4xl` y `font-bold` en el CSS compilado.
- Ausencia de SCSS y de un archivo `tailwind.config.js` tradicional.

## 2026-07-21 — Fase 02

### Añadido

- Organización inicial por funcionalidades bajo `features/public`.
- Componente standalone mínimo `LandingComponent` con sus archivos de plantilla, estilos y pruebas.
- Ruta pública `/` con carga diferida de la landing.
- Prueba de integración del enrutamiento raíz.
- Documentación de ejecución y fundamentos de la estructura modular.

### Cambiado

- Componente raíz reducido a un contenedor de `router-outlet`.
- Pruebas del componente raíz adaptadas a su nueva responsabilidad.
- README principal e índice documental actualizados al estado de la Fase 02.

### Verificado

- Compilación de producción satisfactoria.
- Dos archivos de prueba y cinco pruebas satisfactorias.
- Respuesta HTTP 200 del servidor de desarrollo en `/`.
- Carga de la landing desde `/` comprobada mediante una prueba de integración.
- Ausencia de Tailwind CSS, SCSS y paquetes nuevos.

## 2026-07-21 — Fase 01

### Añadido

- Proyecto Angular 22 dentro de `orman-frontend`.
- Configuración standalone, zoneless y con tipado estricto.
- Angular Router con archivo inicial de rutas.
- Pruebas unitarias mediante Vitest.
- Configuración de estilos CSS sin SCSS.
- Repositorio Git local sin commits.
- Documentación inicial de metodología, fundamentos de Angular y ejecución de la fase.

### Cambiado

- README principal reemplazado por información específica y verificable de ORMAN Frontend.

### Verificado

- Compilación de producción satisfactoria.
- Dos pruebas unitarias satisfactorias.
