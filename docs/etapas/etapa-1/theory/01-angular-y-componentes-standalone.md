# Angular y componentes standalone

## ¿Qué es Angular?

Angular es un framework para crear aplicaciones web con TypeScript. Ofrece un sistema integrado de componentes, plantillas, rutas, formularios, inyección de dependencias, compilación y pruebas. En ORMAN proporcionará la estructura para construir progresivamente la interfaz pública.

## ¿Qué es Angular CLI?

Angular CLI es la herramienta de línea de comandos oficial de Angular. Permite crear proyectos, generar elementos, iniciar el servidor de desarrollo, compilar y ejecutar pruebas con una configuración coherente. El comando `ng new` produjo la base técnica de ORMAN.

## ¿Qué significa standalone?

Un componente standalone declara directamente las dependencias que utiliza y no necesita pertenecer a un `NgModule`. Esto reduce configuración ceremonial y facilita que cada componente tenga una responsabilidad y dependencias visibles.

La aplicación raíz de ORMAN es standalone. Las rutas y proveedores globales se configuran con APIs funcionales en `app.config.ts` y `app.routes.ts`.

## ¿Qué es zoneless?

Tradicionalmente Angular utilizaba `zone.js` para detectar actividad asíncrona y decidir cuándo actualizar la vista. Una aplicación zoneless no depende de ese mecanismo global. Angular recibe notificaciones mediante sus APIs modernas, por ejemplo Signals, eventos de plantillas y actualización de entradas.

Zoneless puede reducir trabajo global y hace más explícito el flujo de actualización. También exige usar patrones compatibles con la detección moderna; no significa que toda actualización sea automática sin comunicar cambios a Angular.

## ¿Qué significa tipado estricto?

El modo estricto activa comprobaciones más exigentes de TypeScript y de las plantillas Angular. Ayuda a detectar valores nulos inesperados, propiedades incompatibles, parámetros sin tipo seguro y errores de enlace antes de ejecutar la aplicación.

ORMAN conservará esta configuración y evitará `any`, favoreciendo modelos e interfaces explícitos.

## ¿Qué función cumple Angular Router?

Angular Router relaciona URLs con vistas o componentes. Gestiona navegación, parámetros, rutas hijas y carga diferida. Aunque en la etapa pública solo se desarrollará completamente `/`, disponer del router desde el inicio permite expresar esa navegación de forma estándar sin construir un sistema propio.

## ¿Qué es Vitest?

Vitest es un ejecutor de pruebas unitarias para proyectos TypeScript y JavaScript. Descubre archivos de prueba, ejecuta expectativas y presenta resultados. Angular CLI 22 lo configuró como runner predeterminado de este proyecto. La prueba inicial verifica la creación del componente raíz y su contenido esperado.

## Diferencia entre CSS y SCSS

CSS es el lenguaje que los navegadores interpretan directamente para aplicar estilos. SCSS es una sintaxis de Sass que añade características de preprocesamiento como variables propias, anidamiento y mixins; debe transformarse a CSS antes de llegar al navegador.

Las variables CSS, a diferencia de las variables de SCSS, existen durante la ejecución en el navegador. Por eso son apropiadas para cambiar dinámicamente los tres temas de ORMAN mediante `data-theme`.

## ¿Por qué ORMAN usará CSS y Tailwind posteriormente?

ORMAN utilizará CSS nativo para variables semánticas, temas y reglas globales. En una fase posterior, Tailwind aportará utilidades para composición, espaciado, tipografía, estados y diseño responsive. La combinación permite centralizar el significado visual en variables CSS y reutilizarlo mediante clases, sin introducir Sass ni fijar los componentes a una combinación exclusiva de modo claro y oscuro.

Tailwind todavía no está instalado; su versión y procedimiento se validarán en la fase correspondiente.
