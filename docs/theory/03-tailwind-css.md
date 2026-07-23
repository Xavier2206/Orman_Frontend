# Tailwind CSS

## ¿Qué es Tailwind CSS?

Tailwind CSS es un framework CSS orientado a utilidades. Proporciona clases pequeñas y combinables para aplicar reglas como espaciado, tamaño, color, alineación o tipografía directamente desde el marcado. Su compilador analiza los archivos del proyecto y genera únicamente el CSS necesario para las clases detectadas.

## ¿Qué significa _utility-first_?

_Utility-first_ significa construir una interfaz combinando clases con una responsabilidad concreta. Por ejemplo, `min-h-screen` establece una altura mínima de pantalla, `text-center` centra texto y `font-bold` aplica peso tipográfico negrita. La composición de varias utilidades describe el resultado visual sin necesitar una clase CSS personalizada para cada bloque.

Este enfoque no elimina CSS: cambia dónde se expresa la mayor parte de las decisiones repetitivas y permite conservar CSS propio para reglas globales, variables semánticas o casos que no conviene representar mediante utilidades.

## Tailwind frente a CSS tradicional

Con CSS tradicional suele asignarse una clase semántica a un elemento y escribir sus declaraciones en una hoja de estilos. Tailwind ofrece utilidades ya definidas para componer esas mismas declaraciones en la plantilla.

CSS tradicional puede producir plantillas más breves, pero exige navegar entre HTML y hojas de estilos y puede acumular selectores difíciles de reutilizar. Tailwind hace visibles las decisiones visuales en el componente y favorece una escala consistente, aunque una cantidad excesiva de clases puede volver el marcado difícil de leer. Ambos enfoques pueden convivir.

## Tailwind no es una biblioteca de componentes

Tailwind no entrega por sí mismo botones, modales, menús o tarjetas terminadas con comportamiento y diseño de producto. Es un conjunto de primitivas visuales. Una biblioteca de componentes ofrece piezas completas con una apariencia y, a veces, interacción predefinidas. ORMAN construirá sus propios componentes con utilidades Tailwind y reglas de diseño propias.

## ¿Qué es PostCSS?

PostCSS es una herramienta que transforma CSS mediante plugins. Recibe una hoja de estilos, permite que los plugins interpreten o generen reglas y entrega CSS que el proceso de Angular puede optimizar y empaquetar.

## Función de `@tailwindcss/postcss`

En Tailwind CSS 4, el plugin `@tailwindcss/postcss` conecta Tailwind con la cadena de PostCSS. Lee la importación de Tailwind, detecta las utilidades usadas en el código fuente y genera las reglas correspondientes durante la compilación.

ORMAN lo registra en `.postcssrc.json`:

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

## Función de `@import "tailwindcss";`

La instrucción global en `src/styles.css` incorpora Tailwind al punto de entrada de estilos de Angular:

```css
@import 'tailwindcss';
```

El plugin sustituye esa importación por las capas, variables y utilidades necesarias. No se usan las directivas separadas `@tailwind base`, `@tailwind components` y `@tailwind utilities` del flujo antiguo.

## Detección de clases en Angular

Tailwind examina archivos fuente como las plantillas HTML de los componentes. Cuando encuentra clases completas, por ejemplo `bg-slate-100` o `text-4xl`, incluye sus reglas en el CSS generado. Las clases construidas dinámicamente mediante fragmentos de cadenas pueden no ser detectables; por eso conviene mantener nombres completos y explícitos en las plantillas o mapear estados a cadenas completas.

## Por qué no se utilizó el procedimiento de Tailwind 3

El procedimiento antiguo creaba normalmente `tailwind.config.js`, añadía una configuración manual de contenido, instalaba Autoprefixer y usaba tres directivas `@tailwind`. ORMAN utiliza Tailwind CSS 4.3.3 y el plugin PostCSS oficial actual. Reproducir el flujo de la versión 3 añadiría configuración obsoleta y duplicaría responsabilidades resueltas por la integración moderna.

## Por qué no se necesita todavía `tailwind.config.js`

Tailwind CSS 4 favorece una configuración basada en CSS y detecta las fuentes automáticamente. La Fase 03 solo requiere comprobar utilidades estándar; no necesita plugins, rutas personalizadas ni un tema de colores definido en JavaScript. Crear un archivo tradicional únicamente para anticipar colores de ORMAN no aportaría valor real.

## Integración futura con los temas de ORMAN

En una fase posterior, ORMAN podrá definir variables CSS semánticas para los temas ORMAN, día y noche. Las utilidades y componentes podrán consumir esas variables sin duplicar estructuras ni fijar la lógica de tema a colores literales. Tailwind resolverá composición, espaciado, tipografía y estados; las variables CSS expresarán el significado visual que cambia entre temas.

La prueba actual usa colores neutros de Tailwind exclusivamente para validar la herramienta y no constituye la paleta definitiva.

## Ventajas

- Permite construir interfaces rápidamente con una escala consistente.
- Reduce la necesidad de inventar nombres para clases puramente visuales.
- Genera CSS a partir de las utilidades realmente detectadas.
- Mantiene próximas la estructura y sus decisiones visuales.
- Facilita estados responsive y variantes sin selectores CSS extensos.

## Límites

- Muchas utilidades pueden hacer que una plantilla resulte densa.
- La abstracción incorrecta puede producir cadenas duplicadas en numerosos componentes.
- Las clases creadas dinámicamente mediante concatenación pueden no ser detectadas.
- No sustituye la arquitectura de componentes, la accesibilidad ni un sistema de diseño.
- Los casos visuales especiales todavía pueden requerir CSS propio.

## Buenas prácticas

- Extraer un componente cuando un patrón visual y funcional se repita de verdad.
- Ordenar las utilidades de manera consistente por estructura, espaciado, tipografía, color y estados.
- Evitar concatenar fragmentos para formar nombres de clase.
- Mantener el contenido semántico y la accesibilidad del HTML.
- Usar variables CSS para valores con significado de producto o que cambian por tema.
- No convertir cada combinación breve de utilidades en una abstracción prematura.

## Referencias oficiales

- [Integrar Tailwind CSS con Angular](https://angular.dev/guide/tailwind)
- [Instalar Tailwind CSS con Angular](https://tailwindcss.com/docs/installation/framework-guides/angular)
- [Instalación de Tailwind CSS mediante PostCSS](https://tailwindcss.com/docs/installation/using-postcss)
