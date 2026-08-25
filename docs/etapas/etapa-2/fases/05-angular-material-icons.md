# Fase 05 — Angular Material Icons en el área privada

## Estado

`COMPLETADA`

## Objetivo

Adoptar Angular Material Icons como sistema visual de iconos del área privada, conservando Tailwind, los componentes nativos y la arquitectura de contexto existente.

## Alcance

- Incorporar `@angular/material` compatible con la versión instalada de Angular.
- Configurar Material Symbols Rounded y `MatIcon` en componentes standalone privados.
- Representar `Menu.icono` directamente desde el contexto en el Sidebar.
- Sustituir los SVG inline y caracteres Unicode de iconos en Sidebar y Topbar privados cuando el cambio fuese local y visual.
- Añadir pruebas de icono directo, fallback y continuidad de comportamiento.

## Exclusiones

- Backend, PostgreSQL, migraciones, contrato `/api/v1/auth/context`, `AuthContext`, autenticación, roles, guards, rutas y `Proceso.enlace`.
- CRUD de Menús, selector/preview de iconos y cambios de ThemeSelector o del logotipo oficial.
- Conversión de botones, select, layout, formularios o componentes visuales a Angular Material.

## Dependencias

- Fase 04 completada: Sidebar derivado de `selectedMenus` y selector de rol real.
- Angular 22.0.7 instalado en el workspace.

## Archivos creados

- `docs/etapas/etapa-2/fases/05-angular-material-icons.md`.

## Archivos modificados

- `package.json` y `package-lock.json`.
- `src/index.html`.
- `src/app/layouts/private-layout/components/private-sidebar/private-sidebar.component.ts`, plantilla y prueba.
- `src/app/layouts/private-layout/components/private-topbar/private-topbar.component.ts`, plantilla y prueba.
- `docs/PlanGeneral.md` y `docs/CHANGELOG.md`.

## Decisiones

- Se instaló `@angular/material` 22.0.7, exactamente alineado con `@angular/core` 22.0.7. npm resolvió `@angular/cdk` 22.0.7 como peer requerido.
- Se eligió Material Symbols Rounded como catálogo único moderno. La fuente se carga una sola vez en `src/index.html` mediante la hoja oficial de Google Fonts; no se usa Material Icons clásico ni una segunda fuente.
- Los componentes standalone importan únicamente `MatIconModule`; no se crea ningún `NgModule` ni se incorpora un tema Material.
- `Menu.icono` se representa directamente en `<mat-icon>`. No existe mapper, alias ni diccionario Backend → Material.
- Solo para valor `null`, vacío o compuesto por espacios se usa el fallback genérico `apps`. No intenta corregir nombres incompatibles.
- Los iconos son decorativos y mantienen `aria-hidden`; los botones conservan sus nombres accesibles existentes.

## Implementación

- PrivateSidebar eliminó `menuIcon()` y los glifos Unicode. Los nombres Material como `group`, `settings`, `assessment`, `payments` o futuros valores oficiales se muestran sin cambiar Angular.
- La hamburguesa y el cierre móvil del Sidebar usan `menu` y `close`.
- PrivateTopbar sustituyó los SVG inline de notificaciones, perfil, cierre de popover y avatar fallback por `notifications`, `person` y `close`.
- ThemeSelector mantiene el logo oficial y sus SVG de sol/luna; el selector de rol sigue siendo un `<select>` nativo sin alteraciones.

## Pruebas

- `icono: 'group'` se conserva como contenido de `mat-icon` en Sidebar.
- `icono: null` y una cadena vacía muestran `apps`.
- Un rol sin menús continúa mostrando el estado vacío seguro.
- El cambio local del selector de rol conserva sus opciones reales y no solicita de nuevo el contexto.
- Topbar renderiza los iconos Material de notificaciones, perfil y cierre sin modificar el popover ni logout.

## Validaciones

- `npx tsc --noEmit -p tsconfig.app.json` correcto.
- `npm test -- --watch=false` correcto: 18 archivos y 108 pruebas aprobadas.
- `npm run build` correcto: 316.40 kB iniciales brutos y 81.81 kB de transferencia estimada.
- El sandbox bloqueó inicialmente la descarga de la fuente durante build; el mismo build con acceso de red autorizado terminó correctamente.
- La revisión visual manual de Sidebar expandido/colapsado, responsive y temas queda pendiente: no había navegador disponible en esta sesión.

## Riesgos y pendientes

- Los valores legacy observados en los fixtures históricos, `users` y `reports`, no son nombres a usar con el catálogo seleccionado. Deben actualizarse posteriormente en Backend/BD a nombres oficiales, por ejemplo `group` y `assessment`; no se implementó alias frontend.
- El futuro CRUD de Menús debe seleccionar y guardar directamente nombres oficiales de Material Symbols.
- Permanecen pendientes el CRUD de Menú, selector visual de iconos y la actualización de datos existentes de `Menu.icono`.

## Resultado final

`MatIcon` queda integrado solo para iconos privados. El flujo `AuthContext → rol seleccionado → selectedMenus → Sidebar` permanece sin cambios funcionales y `Menu.icono` se renderiza directamente. Backend y base de datos no fueron modificados.
