# Layouts y composición en Angular

## Qué es un layout

Un layout es la estructura visual compartida por un conjunto de páginas. Define regiones persistentes —por ejemplo header, navegación, área principal y footer— y deja un lugar variable para el contenido de cada ruta.

En ORMAN, `PublicLayoutComponent` representa la experiencia pública. Puede envolver la landing actual y futuras páginas públicas sin repetir su marco visual.

## Diferencia entre layout y página

Una página representa el contenido asociado a una ruta concreta y suele responder a una necesidad del usuario. Un layout organiza páginas y aporta elementos compartidos.

La landing contiene hero y secciones propias. El layout contiene el encabezado, el pie y el punto donde Angular inserta la página activa. Esta separación evita que la landing conozca detalles globales de navegación.

## Qué es `router-outlet`

`router-outlet` es una directiva de Angular Router que actúa como punto de inserción. Cuando una ruta coincide, Angular crea su componente y lo coloca después del outlet correspondiente.

La aplicación puede tener outlets anidados. El outlet de `App` recibe el layout público; el outlet del layout recibe la landing hija. Cada nivel responde a una parte de la configuración de rutas.

## Qué son rutas hijas

Las rutas hijas se declaran dentro de `children`. Su contenido se renderiza en el `router-outlet` del componente padre. Esto expresa una relación de composición también en la URL y en la arquitectura.

En ORMAN, la ruta padre vacía carga `PublicLayoutComponent` y su hija vacía carga `LandingComponent`. Ambas representan `/`, pero cumplen responsabilidades distintas.

## Qué es carga diferida

La carga diferida, o lazy loading, pospone la descarga y evaluación de un componente hasta que una navegación lo necesita. Con componentes standalone se configura mediante `loadComponent` y una importación dinámica.

Además de reducir el trabajo inicial cuando existen varias áreas, la carga diferida marca límites arquitectónicos claros. No conviene fragmentar cada elemento diminuto: se aplica principalmente en fronteras de rutas y funcionalidades.

## Por qué no duplicar header y footer

Copiar header y footer en cada página crea varias fuentes de verdad. Un cambio de enlace, accesibilidad o diseño tendría que repetirse y podría quedar inconsistente.

El layout centraliza esas regiones. Las páginas se enfocan en su contenido y todas reciben automáticamente la misma navegación y el mismo footer.

## Composición de componentes

Componer componentes significa construir una interfaz colocando componentes pequeños dentro de otros. Cada pieza tiene una responsabilidad reconocible y una API limitada.

`PublicLayoutComponent` compone header, outlet y footer. `LandingComponent` compone el hero y sus secciones. El header reutiliza `ThemeSelectorComponent`. No hay herencia visual ni duplicación del servicio de temas.

## Cuándo crear un componente

Crear un componente se justifica cuando una parte:

- tiene una responsabilidad clara;
- se reutiliza o probablemente se reutilizará;
- posee estado o interacción propios;
- necesita pruebas aisladas;
- hace que el componente padre sea más fácil de entender.

No toda etiqueta o bloque merece un componente. Las tres secciones temporales permanecen en la landing porque son breves, no tienen lógica y abstraerlas no reduciría duplicación significativa.

## Por qué evitar componentes demasiado grandes

Un componente grande mezcla responsabilidades, dificulta pruebas, aumenta el riesgo de efectos colaterales y hace más lenta la lectura. Dividir por límites funcionales permite razonar sobre estado, plantilla y accesibilidad de forma independiente.

La división tampoco debe ser extrema. Demasiados componentes triviales introducen navegación entre archivos sin aportar claridad. El objetivo es cohesión, no una cantidad máxima o mínima de líneas.

## Diseño mobile first

Mobile first significa definir primero la experiencia para pantallas pequeñas y añadir mejoras progresivas para anchos mayores. En Tailwind, las clases sin prefijo forman la base y prefijos como `sm:`, `md:` y `lg:` agregan variaciones.

Este enfoque obliga a priorizar contenido y superficies táctiles. En ORMAN, el header comienza con marca y hamburguesa; desde `lg` aparecen la navegación y los controles de escritorio.

## Landmarks semánticos

Los landmarks son regiones semánticas que ayudan a tecnologías de asistencia a comprender y recorrer la página. HTML ofrece `header`, `nav`, `main` y `footer`, entre otros.

Cuando hay varias navegaciones, cada una debe tener un nombre accesible distintivo. ORMAN diferencia navegación principal, móvil y del pie mediante `aria-label`.

## Enlace de salto al contenido

Un enlace de salto permite evitar bloques repetidos, como toda la navegación, y mover el foco al contenido principal. Es especialmente útil para personas que navegan con teclado.

Normalmente permanece fuera del área visible y aparece al recibir foco. Su destino debe existir, ser único y poder recibir foco cuando corresponda. En el layout apunta a `main#contenido-principal`.

## Qué es `aria-expanded`

`aria-expanded` comunica si el elemento controlado por un botón está abierto o cerrado. Sus valores son booleanos representados como `true` o `false` en el DOM.

Debe colocarse en el control que cambia el estado y actualizarse al mismo tiempo que la interfaz. `aria-controls` puede relacionar ese botón con el identificador del panel. Estos atributos complementan el comportamiento nativo, no reemplazan texto accesible ni manejo de teclado.

## Signals para estados locales simples

Un Signal almacena un valor reactivo. Angular registra sus lecturas en la plantilla y actualiza las partes dependientes cuando cambia. Para un menú booleano, ofrece una relación directa entre estado y vista:

```ts
readonly isMenuOpen = signal(false);

toggleMenu(): void {
  this.isMenuOpen.update((isOpen) => !isOpen);
}
```

Sus ventajas en estados locales simples son:

- lectura explícita con `isMenuOpen()`;
- actualización tipada y predecible;
- integración directa con el renderizado de Angular;
- ausencia de suscripciones manuales;
- pruebas sencillas a través del comportamiento del DOM.

Un Signal local no sustituye automáticamente a un servicio. Cuando el estado debe compartirse entre áreas independientes, persistirse o coordinar lógica de dominio, se evalúa una arquitectura de estado de mayor alcance.
