# Changelog

Este archivo registra únicamente cambios realizados en ORMAN Frontend.

## 2026-07-26 — Fase 06.1

### Añadido

- Selector de temas compacto con iconos para ORMAN, día y noche, nombres accesibles y estado `aria-pressed`.
- Pruebas de accesibilidad y cambio de los tres temas, además de presencia del selector en el menú móvil.
- Documento práctico de la Fase 06.1.

### Cambiado

- Header público persistente mediante `sticky`, con fondo semitransparente, desenfoque discreto, foco visible y ajustes responsive.
- Navegación, marca y botón visual de inicio de sesión refinados sin crear rutas ni autenticación.
- El botón ORMAN usa el SVG oficial sin alterarlo; el recurso contiene solo el símbolo y se ajusta con `object-contain` dentro de 24 px.
- Corrección visual: el tema ORMAN activo mantiene fondo oscuro y comunica su estado mediante borde y aro dorados; el host del header es `sticky` directo con `z-[100]`.

### Verificado

- Validación posterior a la corrección visual: `npx ng build` correcto, 227.78 kB iniciales brutos y 62.66 kB estimados.
- Validación posterior a la corrección visual: `npx ng test --watch=false` correcto, 8 archivos y 31 pruebas aprobadas.

## 2026-07-24 — Fase 05.1

### Añadido

- Logotipo oficial de ORMAN en el enlace de inicio del encabezado público.
- Prueba unitaria del recurso, su ruta pública, texto alternativo y enlace.
- Documento de ejecución de la corrección 05.1.

### Cambiado

- Marca temporal del encabezado reemplazada por el logotipo oficial, conservando el nombre y descriptor textual.
- Símbolo temporal “O” retirado de la composición del hero para evitar simular o duplicar el logotipo.
- README principal, índice documental y documento histórico de la Fase 05 actualizados con una referencia posterior.

### Verificado

- SVG válido con dimensiones internas de 457 × 557 y `viewBox="0 0 457 557"`.
- Contraste fuerte en ORMAN y Noche, y contraste menor del dorado sobre el fondo blanco de Día documentado sin alterar la marca.
- Compilación satisfactoria, 30 pruebas aprobadas, copia idéntica del recurso a `dist` y respuestas HTTP 200 de la landing y del SVG.
- Ausencia de paquetes nuevos, SCSS, `tailwind.config.js`, operaciones Git y trabajo de la Fase 06.

## 2026-07-22 — Fase 04.1

### Añadido

- Estructura mínima `public/images/` para recursos de marca, hero, propiedades y reemplazos visuales.
- README general y README específico en cada carpeta para conservar y documentar la estructura vacía.
- Convenciones de nombres, formatos, uso desde Angular, accesibilidad, privacidad y optimización previa.
- Documento de ejecución de la fase intermedia.

### Cambiado

- README principal e índice documental actualizados con la estructura de recursos públicos.

### Verificado

- Existencia de las cuatro carpetas previstas y de sus archivos README.
- Ausencia de archivos de imagen artificiales, subcarpetas adicionales, paquetes nuevos, SCSS y operaciones Git.
- Compilación y pruebas registradas en el documento de fase.

## 2026-07-22 — Fase 05

### Añadido

- Layout público standalone con encabezado, `router-outlet`, contenido principal y footer.
- Encabezado responsive con marca, navegación interna, selector de temas y botón visual de login.
- Menú móvil accesible controlado mediante Angular Signal.
- Hero inicial con acciones internas y composición visual local sin fotografías ni estadísticas.
- Marcadores temporales para propiedades, funcionamiento y contacto.
- Footer público con navegación interna y copyright de 2026.
- Enlace de salto al contenido y desplazamiento suave condicionado por `prefers-reduced-motion`.
- Pruebas unitarias de layout, header, hero y footer.
- Documentación de implementación y fundamentos de layouts y composición.

### Cambiado

- Ruta `/` convertida en una ruta de layout con una landing hija, ambas con carga diferida.
- Landing temporal reemplazada por la estructura pública inicial y sus pruebas.
- Prueba de integración del componente raíz adaptada a la composición layout/landing.
- README principal e índice documental actualizados al estado real de la Fase 05.

### Verificado

- Compilación de producción satisfactoria con 224.32 kB iniciales.
- Ocho archivos de prueba y 29 pruebas satisfactorias, incluidas las pruebas de temas existentes.
- Respuesta HTTP 200 en `/` y liberación posterior del puerto 4200.
- Contenido esperado comprobado mediante pruebas e inspección de plantillas al no existir navegador integrado disponible.
- Ausencia de SCSS y de `tailwind.config.js`.

## 2026-07-22 — Fase 04

### Añadido

- Tres temas visuales: ORMAN, Noche y Día.
- Tokens CSS semánticos y exposición a utilidades de Tailwind CSS 4 con `@theme inline`.
- Modelo, constantes y servicio singleton de temas basado en Angular Signals.
- Inicialización temprana mediante `provideAppInitializer`.
- Persistencia validada con la clave `orman-theme` de `localStorage`.
- Selector accesible de tres botones y sus pruebas.
- Pruebas unitarias del servicio y ampliación de las pruebas de la landing.
- Documentación de implementación y fundamentos de variables CSS y temas.

### Cambiado

- Landing temporal convertida en una demostración mínima del sistema de temas.
- Elemento raíz configurado en español y con el tema ORMAN inicial.
- README principal e índice documental actualizados al estado real de la Fase 04.

### Verificado

- Compilación de producción satisfactoria con 216.63 kB iniciales y 11.17 kB de CSS global.
- Cuatro archivos de prueba y 16 pruebas satisfactorias.
- Respuesta HTTP 200 en `/`.
- Generación de utilidades semánticas y selectores para los tres valores de `data-theme`.
- Ausencia de SCSS y de `tailwind.config.js`.

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
