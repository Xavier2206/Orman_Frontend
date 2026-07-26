# Fase 06.1 — Mejora del header y selector de temas

Fecha de ejecución: 2026-07-26.

## 1. Objetivo

Mejorar el encabezado público y el selector de temas, manteniendo sus funciones y los tres temas existentes.

## 2. Cambios realizados

- Selector segmentado compacto en el orden ORMAN, día y noche, con iconos accesibles, estados `aria-pressed`, foco visible y movimiento reducido.
- El botón ORMAN usa el SVG oficial dentro de un contenedor cuadrado de 24 px con `overflow-hidden` y `object-contain`; el recurso solo contiene el símbolo, no texto, y no fue modificado.
- Header `sticky`, semitransparente, con desenfoque discreto, borde tenue y distribución refinada para escritorio y móvil.
- El contenedor host `app-public-header` es el elemento `sticky` directo del layout, con `z-[100]`; no existen padres con `overflow`, `transform`, `contain`, altura fija ni scroll interno.
- El botón ORMAN activo conserva fondo de superficie oscuro y símbolo dorado; su estado se comunica con borde y aro dorados, sombra discreta y `aria-pressed`.
- Navegación, botón visual de inicio de sesión y menú móvil conservados y mejorados sin añadir funcionalidad.

## 3. Archivos creados

- `docs/fases/06-1-mejora-header-selector-temas.md`.

## 4. Archivos modificados

- `src/app/shared/components/theme-selector/theme-selector.component.ts`.
- `src/app/shared/components/theme-selector/theme-selector.component.html`.
- `src/app/shared/components/theme-selector/theme-selector.component.spec.ts`.
- `src/app/features/public/landing/components/public-header/public-header.component.html`.
- `src/app/features/public/landing/components/public-header/public-header.component.spec.ts`.
- `src/app/layouts/public-layout/public-layout.component.html`.
- `docs/README.md`.
- `docs/CHANGELOG.md`.
- `README.md`.

## 5. Comandos técnicos ejecutados por el agente

```powershell
npx ng build
npx ng test --watch=false
```

## 6. Resultado de compilación

Correcto. La validación posterior a la corrección visual con `npx ng build` terminó con código 0 y generó `dist/orman-frontend`.

- Total inicial: 227.78 kB brutos y 62.66 kB estimados.
- CSS global: 22.55 kB brutos y 4.50 kB estimados.

## 7. Resultado de pruebas

Correcto. La validación posterior a la corrección visual con `npx ng test --watch=false` terminó con código 0: 8 archivos y 31 pruebas aprobadas.

## 8. Errores y soluciones

- El sandbox no pudo leer todas las rutas fuente necesarias para Angular durante la primera ejecución de build y pruebas.
- Las dos validaciones se repitieron fuera del sandbox con autorización y finalizaron correctamente.

## 9. Estado final

Pendiente de aprobación visual. El header y selector se limitaron al alcance autorizado; no se modificó el hero, no se añadieron paquetes, no se alteró el SVG oficial y no se realizaron operaciones Git.

## 10. Próximo paso

Revisión manual del header en `http://localhost:4200` por parte del responsable del proyecto.
