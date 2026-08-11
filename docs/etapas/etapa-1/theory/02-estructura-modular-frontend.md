# Estructura modular del frontend

## Organización por funcionalidades

Organizar un frontend por funcionalidades significa agrupar cerca todo lo que pertenece a una capacidad del producto. En lugar de almacenar todos los componentes de la aplicación en una sola carpeta, cada área contiene sus vistas, estilos y pruebas. En ORMAN, la experiencia pública comienza en `features/public`, y la landing vive en `features/public/landing`.

Esta organización hace visible la relación entre el código y el producto. También permite modificar, probar o retirar una funcionalidad con menos riesgo de afectar áreas no relacionadas.

## Responsabilidad de cada área

### `core`

Contendrá piezas globales que deben existir una sola vez en la aplicación, por ejemplo configuración transversal, interceptores o servicios globales. No es una carpeta para colocar cualquier utilidad. En esta fase no existe porque ORMAN todavía no necesita archivos con esa responsabilidad.

### `shared`

Reunirá elementos reutilizables y sin dependencia de una funcionalidad concreta, como componentes presentacionales, directivas o utilidades compartidas. Un elemento debe llegar a `shared` por reutilización demostrada, no por anticipación. En esta fase tampoco se crea.

### `layouts`

Contendrá estructuras visuales que envuelvan páginas y se reutilicen entre rutas, por ejemplo un layout público con navegación y pie de página. La vista temporal actual no necesita envoltorio, por lo que crear `public-layout` ahora produciría una abstracción sin uso real.

### `features`

Agrupa capacidades del producto y sus piezas relacionadas. La primera funcionalidad de ORMAN es el acceso público, y dentro de ella la landing temporal permite comprobar la ruta raíz. A medida que el producto crezca, otras capacidades podrán añadirse como áreas hermanas sin mezclar sus detalles.

## Por qué no conviene crear carpetas vacías

Una carpeta vacía no documenta una implementación real ni aporta separación efectiva. Puede sugerir que una arquitectura ya existe cuando todavía no hay responsabilidades que ubicar. Además, Git no conserva directorios vacíos por sí solos, lo que suele llevar a crear archivos artificiales únicamente para mantenerlos.

ORMAN incorpora cada carpeta cuando aparece su primer caso de uso concreto. Así, el árbol describe el estado real del software y evita decisiones prematuras.

## Función de Angular Router

Angular Router relaciona una URL con la vista que debe mostrarse. El proveedor se registra en `app.config.ts`, las definiciones viven en `app.routes.ts` y `router-outlet` marca el lugar donde se renderiza el componente activo.

En esta fase, el segmento vacío `path: ''` representa la ruta `/`. Su propiedad `loadComponent` importa `LandingComponent` cuando la ruta es necesaria. Esta carga diferida mantiene separada la funcionalidad pública y permite que futuras rutas crezcan sin convertir el componente raíz en un selector manual de vistas.

## Por qué el componente raíz debe ser pequeño

El componente raíz es el punto de entrada visual de toda la aplicación. Si acumula contenido, reglas del negocio o diseño de una página específica, todas las rutas quedan acopladas a esas decisiones.

En ORMAN, `App` solo importa `RouterOutlet` y su plantilla solo contiene `<router-outlet />`. Cada ruta es responsable de su propia vista. Esto facilita probar el enrutamiento, añadir layouts cuando sean necesarios y mantener separadas las funcionalidades.

## Crecimiento previsto de ORMAN

La landing definitiva podrá evolucionar dentro de `features/public/landing`. Otras capacidades públicas podrán crearse bajo `features/public` y áreas de producto diferentes podrán añadirse bajo `features`. Cuando varias funcionalidades compartan una pieza verdaderamente genérica, podrá extraerse a `shared`; cuando aparezca infraestructura global, se incorporará `core`; y cuando varias páginas necesiten el mismo marco visual, se añadirá un layout integrado mediante rutas.

Este crecimiento progresivo evita una carpeta global de componentes sin contexto y mantiene juntas las plantillas, pruebas y estilos de cada capacidad.
