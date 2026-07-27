# Fase 10 — Modal visual de inicio de sesión en dos pasos

## Objetivo

Incorporar a la landing pública un modal visual de acceso en dos pasos, integrado con los botones de inicio de sesión del header y sin implementar autenticación real, servicios, API ni navegación.

## Arquitectura

El modal pertenece a la funcionalidad de autenticación:

```text
src/app/features/auth/login-modal/
├── login-modal.component.ts
├── login-modal.component.html
├── login-modal.component.css
└── login-modal.component.spec.ts
```

`LoginModalComponent` es standalone e importa `ReactiveFormsModule`. `PublicHeaderComponent` lo renderiza condicionalmente y mantiene localmente el estado de apertura, sin utilizar un servicio global.

## Flujo de dos pasos

1. Los botones desktop y móvil del header abren el modal.
2. El primer paso muestra la confirmación “Acceso a ORMAN”.
3. “Conectar” cambia al formulario dentro del mismo diálogo.
4. El formulario permite escribir usuario o correo y contraseña.
5. El control de visibilidad alterna localmente el tipo del campo de contraseña.
6. Un envío válido muestra que el acceso estará disponible próximamente.
7. Cancelar, X, Escape o clic sobre el overlay cierran el diálogo.
8. Cada nueva apertura comienza nuevamente en el paso 1.

No se envían, almacenan ni verifican credenciales.

## Signals y formulario

El modal utiliza Signals para:

- Paso actual.
- Visibilidad de la contraseña.
- Mensaje informativo local.

El header usa Signals para:

- Estado del menú móvil.
- Visibilidad del modal.

Los campos se implementan con un `FormGroup` local y validadores `required`. No se exige formato de correo porque el primer campo también admite un nombre de usuario.

## Accesibilidad

- Diálogo con `role="dialog"` y `aria-modal="true"`.
- Título y descripción asociados mediante `aria-labelledby` y `aria-describedby`.
- Botón X con nombre accesible.
- Etiquetas visibles, `aria-invalid` y asociación de errores.
- Iconos decorativos ocultos a tecnologías asistivas.
- Foco inicial en el botón de cierre.
- Foco en el primer campo al pasar al segundo paso.
- Contención manual de Tab y Shift+Tab dentro del panel.
- Cierre mediante Escape.
- Retorno del foco al botón de apertura; en móvil se usa el botón del menú como alternativa porque el disparador desaparece al cerrar el menú.
- Controles con áreas táctiles de al menos 44–48 px.

El focus trap es deliberadamente local y cubre los botones e inputs actuales. Si el diálogo incorpora controles complejos en el futuro, deberá ampliarse o sustituirse por una abstracción accesible reutilizable.

## Bloqueo del desplazamiento

Al crearse el modal se conserva el valor previo de `document.body.style.overflow` y se aplica `hidden`. El valor anterior se restaura al destruirse el componente mediante `DestroyRef`, incluso si el cierre ocurre por una vía distinta de los botones.

## Adaptación a temas

Existe un solo componente para ORMAN, Noche y Día. La presentación reutiliza tokens existentes:

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

No se añadieron tokens, colores fijos en la plantilla ni variantes `dark:*`.

## Responsive y movimiento

- El panel es mobile first, deja margen lateral y limita su ancho a `max-w-lg`.
- La altura máxima considera `100dvh` y permite scroll interno.
- Los botones se apilan en móvil y se muestran en fila desde `sm`.
- Overlay y panel tienen una entrada breve de opacidad y desplazamiento.
- `prefers-reduced-motion: reduce` elimina ambas animaciones.

## Componentes implicados

- `LoginModalComponent`: interfaz, pasos, formulario, accesibilidad, scroll y cierre.
- `PublicHeaderComponent`: apertura desktop/móvil, cierre del menú móvil, render condicional y retorno del foco.

## Pruebas

Se verifican:

- Creación y paso inicial.
- Cambio al segundo paso.
- Cierre por Cancelar, X, Escape y overlay.
- Ausencia de cierre al pulsar dentro del panel.
- Mostrar y ocultar contraseña.
- Validaciones requeridas.
- Mensaje local sin autenticación real.
- Atributos accesibles y SVG oficial.
- Bloqueo y restauración del scroll.
- Apertura desde desktop y móvil.
- Cierre previo del menú móvil.
- Ocultación del modal y retorno de foco desktop.

Resultados:

- `npx ng build`: correcto, 256.70 kB iniciales brutos y 69.47 kB estimados.
- `npx ng test --watch=false`: 9 archivos y 45 pruebas aprobadas.

## Limitaciones

- No existe autenticación, API, backend, JWT, sesión ni persistencia de credenciales.
- No hay recuperación, registro, proveedores externos, roles ni rutas privadas.
- El formulario solo demuestra interacción y validación local.
- El focus trap está ajustado a la estructura actual del diálogo.

## Trabajo futuro

Una fase posterior, expresamente autorizada, podrá definir el contrato real de autenticación, tratamiento seguro de credenciales, estados de carga y error, recuperación de acceso y navegación protegida.
