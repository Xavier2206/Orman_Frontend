# Changelog

## 2026-08-09 - Microfase 5C de Footer refinado

### Aniadido

- Tokens locales por tema para fondo y borde de Footer.
- Estilos encapsulados de Footer mediante la convencion Angular `styleUrl`.

### Cambiado

- Footer raiz y separador de copyright dejan de depender de Surface y Border globales.

### Conservado

- Textos, Accent, enlaces internos, hover, foco global, radios, responsive, contenido y semantica sin cambios.
- No se agregaron gradientes, filtros, radios ni sombras.
- Landing, Hero, Header, ThemeSelector, QuickMenu, LoginModal, PublicLayout, Page y ThemeService sin cambios.
- No se crearon mappings Tailwind, no se ejecutaron comandos Git y no se realizo commit.

## 2026-08-09 - Microfase 6 de radios, sombras y consistencia visual

### Verificado

- Auditoría completa de radios Tailwind, radios locales, sombras Tailwind y sombras locales en los componentes refinados.
- No se detectaron inconsistencias importantes que requieran cambios de implementación.
- No se modificó la escala global de Tailwind, no se añadieron tokens y no se uniformaron artificialmente las sombras o radios.
- Hero queda pendiente para la Microfase 7.

### Conservado

- LoginModal, QuickMenu, Header, ThemeSelector, Landing y Footer mantienen la jerarquía visual aprobada.
- No se ejecutaron comandos Git y no se realizó commit.

## 2026-08-09 - Microfase 7 de Hero refinado e integración final

### Aniadido

- Tokens Hero de fondo, borde y hover para la CTA secundaria, por tema.
- Aislamiento local del eyebrow mediante los tokens Hero de tag existentes.

### Cambiado

- La CTA secundaria deja de depender de Card, Card Hover y Border globales.
- Los valores efectivos de Hero para Día se centralizan en `themes.css` y se retiran los overrides temáticos redundantes del CSS local.

### Conservado

- Panel Hero y superficie del logo con 24 px, `shadow-lg` y sombras locales existentes.
- CTA principal, contenido, estructura, responsive, focus, glow, decoración, logo oficial y animaciones existentes.
- Page, Header, ThemeSelector, Landing, Footer, QuickMenu, LoginModal, PublicLayout y ThemeService sin cambios.
- No se modificaron tokens globales, no se ejecutaron comandos Git y no se realizó commit.

## 2026-08-09 - Microfase 5B de Landing refinado

### Aniadido

- Tokens locales por tema para card, panel y borde de Landing.
- Estilos encapsulados de Landing mediante la convencion Angular `styleUrl`.

### Cambiado

- `#propiedades` es la unica card destacada: en ORMAN usa su gradiente, borde y sombra locales; en Noche y Dia conserva la sombra existente.
- `#contacto` usa la card refinada estandar y conserva `shadow-sm`.
- `#como-funciona` usa el panel refinado sin sombra nueva.

### Conservado

- Textos, Accent y `text-accent-text` de Dia, estructura, orden, espaciado, responsive y transiciones existentes.
- Hero, Footer, Header, ThemeSelector, QuickMenu, LoginModal, PublicLayout, Page y ThemeService sin cambios.
- No se crearon mappings Tailwind ni token de hover; los tokens globales Card, Card Hover, Surface y Border permanecen intactos.
- No se ejecutaron comandos Git ni se realizo commit.

## 2026-08-09 - Microfase 5A de Header y ThemeSelector refinados

### Aniadido

- Tokens locales de fondo y borde para Header, por tema.
- Tokens locales de base, borde, activo y hover para ThemeSelector, por tema.
- Estilos encapsulados para Header y ThemeSelector mediante la convencion Angular `styleUrl`.

### Cambiado

- Header y navegacion movil consumen sus superficies locales y conservan `backdrop-blur-sm` y `shadow-sm`.
- ThemeSelector deja de depender de Surface, Border, Card y Card Hover globales para sus superficies refinadas.

### Conservado

- Accent, ring, sombra, `aria-pressed`, focus-visible, responsive y logica de Header/ThemeSelector sin cambios.
- QuickMenu, LoginModal, PublicLayout, Page, Landing, Footer, Hero y ThemeService sin cambios.
- No se crearon mappings Tailwind para estos tokens, no se ejecutaron comandos Git y no se realizo commit.

### Verificado

- `npx ng build` correcto: 260.95 kB iniciales brutos y 70.06 kB estimados.
- `npx ng test --watch=false` correcto: 10 archivos y 65 pruebas aprobadas.
- La pestaña Browser existente en `localhost:4200` sirvió inicialmente una version anterior despues de recargar; ese bloqueo inicial quedó documentado y posteriormente se resolvió al recargar el workspace correcto.
- Validación visual posterior de la Microfase 5A completada en ORMAN, Noche y Día: **APROBADA VISUALMENTE**.

## 2026-08-09 - Microfase 4 de QuickMenu refinado

### Aniadido

- Tokens locales por tema para fondo, borde y superficie secundaria del QuickMenu.
- Panel y caret aislados de `--theme-card`; el caret usa el mismo fondo y borde del panel.
- Radio local de 16 px para el panel y de 14 px para las acciones principales.

### Conservado

- Padding actual, `shadow-lg`, icon container, Accent, focus-visible, posicionamiento, responsive, animaciones y logica del QuickMenu.
- LoginModal, PublicLayout, Page, Header, Landing, Footer, ThemeSelector, Hero y ThemeService sin cambios.
- No se crearon mappings Tailwind para los tokens QuickMenu, no se ejecutaron comandos Git y no se realizo commit.

### Verificado

- `npx ng build` correcto: 260.39 kB iniciales brutos y 69.99 kB estimados.
- `npx ng test --watch=false` correcto: 10 archivos y 65 pruebas aprobadas.
- Browser revisado en ORMAN, Noche y Dia a anchos aproximados de 375 px y 1440 px: panel, transparencia, caret, bordes, acciones, icon container, posicion y ausencia de overflow. ORMAN queda restaurado al finalizar.

## 2026-08-09 - Microfase 3 de LoginModal refinado

### Aniadido

- Tokens modales por tema: `--theme-modal-bg`, `--theme-modal-border`, `--theme-modal-shadow`, `--theme-field-label-bg`, `--theme-modal-secondary-bg` y `--theme-modal-secondary-border`.
- Consumo local de Field, Danger y Success refinados en los inputs del LoginModal.
- Foco de inputs con borde de acento y doble halo, manteniendo el focus-visible de cerrar, password toggle y botones.

### Conservado

- Alcance limitado a LoginModal; no se modificaron QuickMenu, PublicLayout, Page, Header, Landing, Footer, ThemeSelector, Hero ni ThemeService.
- Overlay, `backdrop-blur-sm`, dimensiones, estructura, spacing, logo, Escape y focus trap permanecen intactos.
- No se crearon mappings Tailwind para los tokens modales, no se ejecutaron comandos Git y no se realizo commit.

### Verificado

- `npx ng build` correcto: 259.79 kB iniciales brutos y 69.93 kB estimados.
- `npx ng test --watch=false` correcto: 10 archivos y 65 pruebas aprobadas.
- Browser revisado en ORMAN, Noche y Dia; se comprobaron foco, estados de validacion, labels flotantes, botones, Escape y ausencia de overflow en viewport de escritorio y el caso movil de Dia. ORMAN quedo restaurado al finalizar.

## 2026-08-09 - Microfase 2 de Page Background refinado

### Cambiado

- PublicLayout consume `--theme-page-bg` mediante `background-image` en su wrapper principal.
- `bg-page` permanece activo para conservar `background-color: var(--theme-page)` como fallback.
- ORMAN, Noche y Dia muestran sus gradientes de Page correspondientes.

### Conservado

- `themes.css`, `styles.css`, ThemeService y todos los componentes visuales permanecen sin cambios adicionales.
- Surface, Card, Border, Overlay, Field, Danger, Success, Hero, radios, sombras y focus permanecen en sus estados anteriores.

### Verificado

- Build correcto.
- 10 archivos de prueba y 65 pruebas aprobadas.
- Verificacion Browser realizada en anchos aproximados de 375 px y 1440 px sin overflow horizontal.

## 2026-08-09 - Microfase 1 de arquitectura de tokens refinados

### Aniadido

- Token separado `--theme-page-bg` para futuros fondos visuales sin convertir `--theme-page` en una imagen.
- Tokens `--theme-field` y `--theme-field-border`.
- Tokens semanticos `--theme-danger-text`, `--theme-danger-border` y `--theme-danger-bg`.
- Tokens semanticos `--theme-success-text`, `--theme-success-border` y `--theme-success-bg`.
- Mappings de color Tailwind 4 para Field, Danger y Success.

### Conservado

- `ThemeService`, Signals, `ThemeName`, `data-theme` y `localStorage` sin cambios.
- Valores actualmente consumidos de Page, Surface, Card, Border, Overlay, Danger, Success, Warning y Focus sin cambios.
- Warning conservado como `#D97706`.

### Fuera de alcance

- No se migraron componentes a los tokens nuevos.
- No se aplicaron gradientes visibles, radios, sombras, doble halo, overlay refinado ni Card radial.
- Hero, LoginModal, QuickMenu, Landing, Header, Footer, ThemeSelector y PublicLayout permanecen sin cambios.

Este archivo registra únicamente cambios realizados en ORMAN Frontend.

## 2026-07-26 — Fase 10

### Añadido

- Modal standalone de inicio de sesión visual en dos pasos dentro de `features/auth`.
- `QuickMenuComponent` standalone para la confirmación compacta no modal.
- Confirmación inicial y formulario reactivo con validación local de campos requeridos.
- Signals para paso actual, contraseña visible y mensaje informativo.
- Cierre por Cancelar, X, Escape y clic en el overlay.
- Contención manual del foco, foco inicial, retorno al disparador y alternativa para el menú móvil.
- Bloqueo y restauración segura del scroll del documento.
- Animaciones breves compatibles con movimiento reducido.
- Trece pruebas nuevas para el modal y la integración con el header.
- Documento práctico de la Fase 10.

### Cambiado

- Los botones desktop y móvil de inicio de sesión abren el mismo modal.
- El menú móvil se cierra antes de mostrar el diálogo.
- Las pruebas del header cubren apertura, cierre y retorno del foco.
- README principal e índice documental actualizados al estado de la fase.
- Corrección visual de la Fase 10: la confirmación inicial ahora es un popover compacto sin overlay, anclado al botón desktop mediante su posición real y centrado bajo el header en móvil.
- El overlay, el desenfoque, la contención del foco y el bloqueo del scroll se reservan exclusivamente para el modal de credenciales.
- La semántica accesible diferencia el popover no modal del diálogo modal del segundo paso.
- Refactorización estructural: QuickMenu y LoginModal son componentes independientes con HTML, CSS, pruebas y responsabilidades separadas.
- El header coordina ambos mediante Signals locales, los mantiene mutuamente excluyentes y posiciona el QuickMenu desktop con un contenedor relativo.
- `LoginModalComponent` abre directamente el formulario y concentra exclusivamente overlay, blur, focus trap y bloqueo del scroll.

### Verificado

- `npx ng build` correcto: 256.70 kB iniciales brutos y 69.47 kB estimados.
- `npx ng test --watch=false` correcto: 9 archivos y 45 pruebas aprobadas.
- Ausencia de servicios, API, rutas, dependencias o autenticación real.
- Corrección visual verificada: build correcto con 257.58 kB iniciales brutos y 69.61 kB estimados; 9 archivos y 47 pruebas aprobadas.
- Refactorización estructural verificada: build correcto con 256.92 kB iniciales brutos y 69.52 kB estimados; 10 archivos y 62 pruebas aprobadas.

## 2026-07-26 — Fase 06.2

### Añadido

- Panel visual del hero centrado en el SVG oficial de ORMAN, con descriptor y etiquetas de tipos de propiedades.
- Elementos arquitectónicos decorativos y resplandor dorado accesibles como contenido oculto a tecnologías asistivas.
- Animación de entrada discreta, flotación mínima y alternativa completa para movimiento reducido.
- Tokens semánticos del panel del hero para asegurar contraste en ORMAN, Noche y Día.
- Pruebas unitarias del logo, texto alternativo, etiquetas, CTA, anclas, `h1` único y retiro de la antigua etiqueta del edificio.
- Documento práctico de la Fase 06.2.

### Cambiado

- La ilustración abstracta del edificio fue reemplazada sin alterar el contenido izquierdo del hero.
- El ancho máximo del hero se alineó con el sistema de contenido del header en pantallas grandes.
- Corrección visual pendiente de aprobación: Día usa un panel claro con tarjeta interior azul marino para el logotipo; ORMAN y Noche conservan paneles oscuros propios.
- La animación continua del logo y del resplandor fue retirada y sustituida por una entrada única horizontal junto a la aparición breve de las líneas decorativas.
- Corrección local pendiente de revisión visual: el panel del hero es blanco puro en Día y el logotipo se muestra directamente sobre él, sin tarjeta oscura; ORMAN y Noche permanecen sin cambios.
- Refinamiento local pendiente de revisión visual: el panel blanco del hero en Día usa un borde exterior dorado suave y un marco interior dorado fino en lugar del borde gris.
- Segundo refinamiento local pendiente de revisión visual: se refuerzan ligeramente ambos bordes dorados y se incorpora un marco blanco con borde dorado alrededor del logotipo únicamente en Día.

### Verificado

- `npx ng build` correcto: 231.58 kB iniciales brutos y 63.11 kB estimados.
- `npx ng test --watch=false` correcto: 8 archivos y 32 pruebas aprobadas.
- Corrección local del panel blanco en Día: `npx ng build` correcto con 232.32 kB iniciales y `npx ng test --watch=false` correcto con 32 pruebas.
- Refinamiento de bordes dorados en Día: build correcto con 232.32 kB iniciales y 8 archivos con 32 pruebas aprobadas.
- Marco dorado del logotipo y refuerzo final de bordes: build correcto con 232.32 kB iniciales y 32 pruebas aprobadas.

## 2026-07-26 — Fase 06.1

### Añadido

- Selector de temas compacto con iconos para ORMAN, día y noche, nombres accesibles y estado `aria-pressed`.
- Pruebas de accesibilidad y cambio de los tres temas, además de presencia del selector en el menú móvil.
- Documento práctico de la Fase 06.1.

### Cambiado

- Header público persistente mediante `sticky`, con fondo semitransparente, desenfoque discreto, foco visible y ajustes responsive.
- Navegación, marca y botón visual de inicio de sesión refinados sin crear rutas ni autenticación.
- El botón ORMAN usa el SVG oficial sin alterarlo; el recurso contiene solo el símbolo y se ajusta con `object-contain` dentro de 24 px.
- Corrección visual: el tema ORMAN activo mantiene fondo oscuro y comunica su estado mediante borde y aro dorados; el elemento `header.public-header` es `sticky` directo con `z-[100]`.

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
