# Fase 10 — Acceso visual en dos pasos

## Objetivo

Incorporar a la landing pública un flujo visual de acceso en dos pasos, sin autenticación real, servicios, API ni navegación privada.

## Arquitectura

Los dos patrones de interfaz se implementan como componentes standalone independientes:

```text
src/app/features/auth/
├── quick-menu/
│   ├── quick-menu.component.ts
│   ├── quick-menu.component.html
│   ├── quick-menu.component.css
│   └── quick-menu.component.spec.ts
└── login-modal/
    ├── login-modal.component.ts
    ├── login-modal.component.html
    ├── login-modal.component.css
    └── login-modal.component.spec.ts
```

- `QuickMenuComponent` representa exclusivamente la confirmación no modal.
- `LoginModalComponent` representa exclusivamente el diálogo modal de credenciales.
- `PublicHeaderComponent` coordina el flujo con Signals locales.

No existe `AuthUiService`, `AuthService` ni estado global para esta interfaz.

## Flujo

1. El botón desktop o móvil del header abre `QuickMenuComponent`.
2. En móvil, el menú de navegación se cierra antes de mostrar el QuickMenu.
3. “Cancelar”, X, Escape, clic exterior o un segundo clic en el disparador cierran el QuickMenu.
4. “Conectar” destruye el QuickMenu y abre `LoginModalComponent`.
5. El modal permite escribir usuario o correo y contraseña.
6. El control de visibilidad alterna localmente el tipo del campo de contraseña.
7. Un envío válido muestra que el acceso estará disponible próximamente.
8. Cancelar, X, Escape o clic sobre el overlay cierran el modal.
9. La siguiente apertura comienza nuevamente en el QuickMenu.

Los dos componentes nunca se renderizan simultáneamente.

## QuickMenuComponent

Responsabilidades:

- Mostrar “Acceso a ORMAN” y su descripción.
- Emitir `close` y `connect`.
- Gestionar Escape y clic exterior con listeners de Angular.
- Enfocar inicialmente el botón “Conectar”.
- Mantener semántica `role="dialog"` sin `aria-modal`.
- Aplicar su propia animación de entrada y alternativa de movimiento reducido.

En desktop se renderiza dentro de un contenedor `relative` junto al botón. El panel utiliza posicionamiento absoluto, alineación derecha y una punta decorativa orientada al disparador. No recibe un `HTMLElement`.

En móvil utiliza una variante fija, centrada bajo el header y con margen lateral.

No contiene overlay, desenfoque global, formulario, focus trap ni bloqueo del scroll.

## LoginModalComponent

Responsabilidades:

- Renderizar directamente el formulario de credenciales.
- Mostrar el SVG oficial de ORMAN.
- Gestionar validaciones locales requeridas.
- Mostrar u ocultar la contraseña.
- Mostrar el mensaje local de disponibilidad próxima.
- Gestionar overlay, backdrop blur, foco inicial y focus trap.
- Bloquear y restaurar el scroll del documento.
- Cerrar mediante Cancelar, X, Escape o clic sobre el overlay.
- Reiniciar formulario, visibilidad y mensaje al cerrar.

Usa `role="dialog"`, `aria-modal="true"`, `aria-labelledby` y `aria-describedby`.

## Coordinación desde el header

`PublicHeaderComponent` utiliza Signals separados:

- `isQuickMenuOpen`
- `isLoginModalOpen`
- `loginOrigin`
- `loginTrigger`

El elemento disparador se conserva únicamente para restaurar el foco; no se pasa al QuickMenu para posicionarlo. En desktop, el contenedor relativo resuelve el anclaje. En móvil, si el botón ya no existe porque se cerró el menú, el foco vuelve al botón que abre la navegación.

Los botones exponen `aria-expanded`, `aria-controls="orman-quick-menu"` y `aria-haspopup="dialog"`.

## Formulario y alcance funcional

`LoginModalComponent` importa `ReactiveFormsModule` y utiliza un `FormGroup` local:

- Usuario o correo requerido.
- Contraseña requerida.

No se exige formato de correo porque el primer campo también acepta un nombre de usuario.

No se envían, almacenan ni verifican credenciales. No existe HTTP, backend, API, JWT, cookies, sesión, OTP, persistencia ni simulación de autenticación.

## Temas

Ambos componentes reutilizan tokens semánticos existentes:

- `bg-overlay`
- `bg-card`
- `bg-surface`
- `text-content`
- `text-muted`
- `bg-accent`
- `bg-accent-hover`
- `text-accent-contrast`
- `border-theme-border`
- `text-danger`
- `outline-focus`
- `shadow-md` y `shadow-lg`

No se añadieron tokens, colores fijos en plantillas ni variantes `dark:*`. Un único diseño se adapta automáticamente a ORMAN, Noche y Día.

## Responsive y movimiento

- QuickMenu desktop: ancho máximo de 384 px y alineación derecha respecto al botón.
- QuickMenu móvil: posición superior fija, centrado horizontal y margen lateral.
- LoginModal: ancho máximo `max-w-lg`, límite basado en `100dvh` y scroll interno.
- Los botones se apilan cuando el ancho disponible es reducido.
- Cada componente tiene animaciones propias, breves y no repetitivas.
- `prefers-reduced-motion: reduce` desactiva las animaciones.

## Pruebas

### QuickMenuComponent

- Contenido, eventos `close` y `connect`.
- Cancelar, X, Escape y clic exterior.
- Ausencia de cierre al pulsar dentro.
- Semántica no modal y ausencia de overlay.
- Ausencia de bloqueo del scroll.
- Foco inicial en “Conectar”.
- Controles nativos de teclado y variante móvil.

### LoginModalComponent

- Apertura directa en el formulario, sin confirmación.
- Overlay, logo oficial y semántica modal.
- Cancelar, X, Escape y clic en overlay.
- Ausencia de cierre al pulsar dentro.
- Focus trap.
- Visibilidad de contraseña.
- Validaciones, mensaje local y reinicio.
- Bloqueo y restauración del scroll.

### PublicHeaderComponent

- Apertura exclusiva del QuickMenu desde desktop y móvil.
- Cierre previo del menú móvil.
- Sustitución del QuickMenu por LoginModal al conectar.
- Exclusión mutua de ambos componentes.
- Cierre independiente y retorno del foco.
- Segundo clic sobre el disparador desktop.

Resultados:

- `npx ng build`: correcto, 256.92 kB iniciales brutos y 69.52 kB estimados.
- `npx ng test --watch=false`: 10 archivos y 62 pruebas aprobadas.

## Limitaciones

- La interfaz no autentica usuarios.
- No existen estados de servidor, recuperación, registro, proveedores externos, roles ni rutas privadas.
- El focus trap manual está ajustado a los controles actuales del modal.

## Trabajo futuro

Una fase posterior, expresamente autorizada, podrá definir el contrato real de autenticación y sus requisitos de seguridad. Esta fase no inicia ese trabajo.
