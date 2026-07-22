# Variables CSS y temas visuales

## Qué es un tema visual

Un tema visual es un conjunto coordinado de decisiones de presentación: fondos, superficies, texto, acentos, bordes y estados. La estructura y el comportamiento de la interfaz permanecen iguales; solo cambian los valores visuales asociados a cada función.

## Colores fijos y tokens semánticos

Un color fijo describe un valor, por ejemplo `#000F1F`. Un token semántico describe una responsabilidad, por ejemplo “fondo de página”. El token puede apuntar al navy en ORMAN, al negro en Noche y al blanco en Día sin cambiar el HTML del componente.

Este enfoque evita repartir colores concretos por las plantillas y permite modificar una paleta desde un único lugar.

## Variables CSS

Las variables CSS, también llamadas propiedades personalizadas, se declaran con nombres que comienzan por `--` y se consumen con `var()`:

```css
:root {
  --theme-page: #000f1f;
}

body {
  background-color: var(--theme-page);
}
```

Participan en la cascada de CSS. Cuando un selector más específico redefine `--theme-page`, todo elemento que la consume obtiene el nuevo valor sin regenerar la plantilla.

## `data-theme` y `documentElement`

`data-theme` es un atributo de datos colocado en el elemento `<html>`, disponible en JavaScript como `document.documentElement`. Los selectores CSS asocian cada valor con una paleta:

```css
:root[data-theme='dark'] {
  --theme-page: #080808;
}
```

Cambiar el atributo con `setAttribute('data-theme', 'dark')` activa inmediatamente las variables de Noche para todo el documento.

## Integración con Tailwind CSS 4

Tailwind 4 permite declarar tokens desde CSS. ORMAN mantiene las variables de paleta con el prefijo `--theme-*` y las registra como colores de Tailwind mediante `@theme inline`:

```css
@theme inline {
  --color-page: var(--theme-page);
  --color-content: var(--theme-text);
}
```

Así Tailwind genera utilidades como `bg-page` y `text-content`, cuyos valores se resuelven en tiempo de ejecución según el atributo activo.

La opción `inline` es apropiada cuando un token de Tailwind referencia otra variable CSS. Conserva la referencia en el lugar donde se usa y permite que la cascada determine el valor actual.

## Referencias circulares

Una declaración como `--color-page: var(--color-page)` se referencia a sí misma y no produce un valor utilizable. Separar los nombres evita esa recursión:

- Variables de paleta: `--theme-page`, `--theme-text`.
- Tokens de Tailwind: `--color-page`, `--color-content`.

## Angular Signals

Un Signal de Angular contiene un valor reactivo y notifica a las plantillas que lo leen cuando cambia. El tema activo es un estado pequeño, síncrono y global; por eso un Signal encaja sin introducir un flujo RxJS.

El servicio conserva internamente un Signal modificable y expone `asReadonly()`. Los componentes pueden leer el tema, pero solo el servicio puede modificarlo, aplicar el atributo y coordinar la persistencia.

## `localStorage`

`localStorage` guarda pares de texto asociados al origen del sitio y conserva los datos entre sesiones. ORMAN utiliza la clave `orman-theme`.

El almacenamiento puede contener datos antiguos, manipulados o inválidos, y algunos entornos pueden bloquear su acceso. Por ello el servicio:

1. captura errores de lectura y escritura;
2. valida el texto contra `orman`, `dark` y `light`;
3. vuelve a ORMAN si no encuentra un valor válido.

## Inicializador de aplicación

Un inicializador ejecuta una tarea durante el arranque. `provideAppInitializer` es la API moderna utilizada para pedir a `ThemeService` que lea la selección y aplique `data-theme` antes de que la aplicación termine de inicializarse.

El HTML también declara ORMAN como respaldo inicial y `:root` contiene la misma paleta predeterminada. Esto evita un primer fondo blanco cuando todavía no existe una preferencia guardada.

## Movimiento reducido

`prefers-reduced-motion` comunica que una persona prefiere menos animaciones. Las transiciones de tema se limitan a color, fondo y borde durante 200 ms; ante esta preferencia se eliminan mediante CSS y la variante `motion-reduce:transition-none` de Tailwind.

## Ventajas de centralizar los temas

- Mantiene consistencia entre componentes.
- Reduce duplicación y colores literales en plantillas.
- Permite cambiar una paleta sin alterar la estructura.
- Centraliza validación, persistencia y aplicación del atributo.
- Facilita pruebas unitarias y futuras mejoras de accesibilidad.
- Evita mantener tres aplicaciones o tres hojas de estilos independientes.
