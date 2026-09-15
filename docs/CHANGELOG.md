# Changelog

## 2026-09-14 - Fase 15: Compactación y acciones de Unidades

### Cambiado

- Se compactó `UnidadCardComponent` reduciendo padding, márgenes y separaciones, y se ajustó el
  grid para limitar el ancho visual en escritorio sin modificar el ancho general del layout.
- Se eliminó únicamente el render de `descripcion`; `UnidadResponse`, el servicio y los datos del
  contrato permanecen intactos.
- Se añadió un footer accesible con las acciones visuales `Editar` y `Ver detalle`, mediante outputs
  preparados y sin `routerLink`, rutas falsas ni navegación rota.

### Verificado

- Pruebas focalizadas de Unidades: 3 archivos y 14 pruebas aprobadas.
- Suite completa: 57 archivos; 415 pruebas aprobadas de 419. Permanecen 4 fallos fuera del alcance
  en `PropiedadDetailPdfService`.
- Typecheck, build de producción y `git diff --check` correctos. El build conserva warnings
  históricos de presupuesto CSS y CommonJS.
- Browser autenticado: card compacta, ausencia de descripción, acciones visibles y activas sin
  navegación, además de ORMAN, DÍA y NOCHE. La API CUA disponible no permite fijar viewports exactos;
  por eso la validación por tamaños queda pendiente.
- No se modificaron Propiedades, Backend, modelos de contrato, selector, paginación ni
  `package-lock.json`; no se ejecutaron operaciones Git.

## 2026-09-14 - Fase 14: Listado de Unidades

### Añadido y cambiado

- Se añadió la ruta lazy privada `/app/unidades/listar`, con selector de Propiedad y listado de
  unidades paginado.
- El selector reutiliza `PropiedadApiService` y recorre todas las páginas de `GET /api/v1/propiedades`
  con tamaño 100; las unidades usan `GET /api/v1/propiedades/{codprop}/unidades` con página, tamaño
  20 y orden `nombre,asc`.
- Se añadió `UnidadResponse` con los campos confirmados por Backend y una card responsive que no
  muestra ocupación, disponibilidad, inquilinos, fotografías ni acciones no contratadas.
- Se incorporaron estados de selección inicial, carga con skeleton, vacío, error `ProblemDetail`,
  reintento y paginación, además de pruebas unitarias del servicio, card y page.

### Verificado

- Pruebas focalizadas de Unidades: 3 archivos y 13 pruebas aprobadas.
- Suite completa: 57 archivos; 415 pruebas aprobadas de 418. Permanecen los 3 fallos preexistentes
  de `OrmanNotificationService`.
- Typecheck, build de producción, Prettier y `git diff --check` ejecutados; el build termina
  correctamente y conserva únicamente advertencias históricas de presupuesto CSS y CommonJS.
- Browser autenticado: ruta, navegación desde Sidebar, estado inicial, datos reales, paginación/estado
  vacío y temas ORMAN, DÍA y NOCHE verificados en la sesión disponible. La comprobación en viewports
  exactos queda pendiente porque la API CUA disponible no expone control de viewport.
- No se modificó `package-lock.json`, Backend, Sidebar ni contratos; no se ejecutaron `git add`,
  `git commit` ni `git push`.

## 2026-09-13 - Consolidación documental del módulo Propiedades

### Cambiado

- Se consolidó el trabajo de Propiedades en la Fase 13 y en el documento canónico
  `docs/etapas/etapa-2/fases/13-propiedades.md`.
- El `PlanGeneral.md` ahora contiene una única entrada `13 — Propiedades`, con estado
  `COMPLETADA`.
- Se actualizaron los índices y referencias documentales; el historial de cambios relevantes se
  conserva en este changelog.

### Conservado

- No se modificaron código frontend, backend, configuración, dependencias ni pruebas.
- No se renumeraron fases ajenas ni se ejecutaron operaciones Git.

## 2026-09-13 - Fase 19: Retiro de la acción redundante del formulario de Propiedades

### Cambiado

- Se eliminó `Volver a propiedades` del encabezado reutilizado por Crear y Editar Propiedad porque duplicaba la acción `Cancelar`.
- Se retiraron únicamente los estilos sin uso de `form-back-button` y se añadió una aserción de template para evitar su regreso.

### Conservado

- `Cancelar` continúa usando `cancel()` y sigue siendo la salida del formulario junto a Guardar.
- Título, campos, validaciones, portada, preview, mapa, API, rutas, temas y Backend no cambiaron.
- No se ejecutaron `git add`, `git commit` ni `git push`.

## 2026-09-13 - Fase 18: Reparación de assets del marcador Leaflet

### Corregido

- Se diagnosticó el icono roto del marcador en Crear y Editar mediante Browser/DevTools: el `IMG` recibía `http://localhost:4200/leaflet/marker-icon.png` con dimensiones naturales `0×0` porque el servidor `ng serve` antiguo devolvía 404.
- Se reinició la sesión local de desarrollo para cargar la configuración de assets ya existente en `angular.json`; no se añadió una copia manual ni se cambió la lógica del mapa.

### Verificado

- `marker-icon.png` responde y se renderiza en `25×41`; `marker-shadow.png` en `41×41`; `marker-icon-2x.png` está incluido y se sirve en `50×82`.
- Crear y Editar conservan click, arrastre, coordenadas, zoom y marcador inicial; ORMAN, DÍA y NOCHE mantienen el marcador visible.
- Build de producción, typecheck, pruebas focalizadas, Prettier y `git diff --check` ejecutados; los resultados completos quedan en el documento de la Fase 18.
- No se modificaron Backend, API, rutas, formulario, portada, preview ni dependencias. No se ejecutaron `git add`, `git commit` ni `git push`.

## 2026-09-13 - Fase 17: Reacomodo financiero y limpieza de ubicación de Propiedades

### Cambiado

- `Datos financieros` e `Inversión inicial` ahora se muestran debajo de `Nombre` dentro de `Datos generales`, manteniendo el selector `CASA`/`EDIFICIO` en la columna derecha desde tablet y escritorio.
- Se eliminaron `Buscar ubicación`, `Usar mi ubicación`, los resultados de búsqueda, `navigator.geolocation` y toda la lógica/configuración/modelado de transporte exclusiva de esas acciones.
- El mapa conserva click, arrastre del marcador, coordenadas, reverse geocoding, zoom, atribución y tiles OSM; la reversa sigue completando solo dirección/ciudad vacías y no sobrescribe Referencia.
- Se corrigió la junta horizontal de tiles causada por una separación subpíxel en Chromium con DPR fraccional: los tiles reales se solapan aproximadamente `0.99 px`, sin overlay.
- No se modificaron API de Propiedades, rutas, portada, preview, listado, resumen, Backend ni contratos REST. `package-lock.json` y cambios locales previos fueron preservados.

### Verificado

- Pruebas focalizadas de Propiedades: 7 archivos y 70 pruebas aprobadas.
- Suite completa: 50 archivos; 381 pruebas aprobadas de 384. Permanecen 3 fallos preexistentes en `OrmanNotificationService`.
- Typecheck, Prettier, build de producción y `git diff --check` ejecutados. El build es correcto y conserva advertencias históricas de presupuesto CSS, incluida la hoja del formulario en `10.29 kB` frente al warning de `4 kB`.
- Browser autenticado: Crear y Editar comprobados en `320`, `360`, `390`, `430`, `768`, `1280`, `1366`, `1440`, `1600` y `1920 px` según la ruta; sin overflow horizontal. Mapa y selector validados en ORMAN, DÍA y NOCHE; ORMAN restaurado y consola sin errores.
- No se ejecutaron `git add`, `git commit` ni `git push`.

## 2026-09-13 - Fase 16: Selector y ubicación cartográfica de Propiedades

### Añadido y cambiado

- Se reemplazó el `<select>` de tipo por tarjetas radio accesibles con valores `CASA` y `EDIFICIO`.
- Se reorganizaron los campos existentes en Datos generales, Ubicación y Datos financieros sin
  duplicar `FormControl`.
- Se incorporó mapa Leaflet 1.9.4 directo con tiles OpenStreetMap, atribución visible, marcador
  arrastrable, click, búsqueda explícita Nominatim, reverse geocoding y GPS manual.
- La reversa solo completa dirección y ciudad vacías; no sobrescribe texto manual ni referencia.
- Las peticiones Nominatim omiten el Bearer mediante `HttpContext` y respetan un intervalo mínimo
  de un segundo. No se modificó Backend, portada, preview, rutas ni contratos.

### Verificado

- Pruebas focalizadas: 3 archivos y 41 pruebas aprobadas.
- Suite completa: 51 archivos y 388 pruebas aprobadas.
- Typecheck, Prettier, build de producción y `git diff --check` correctos. El build conserva
  advertencias de presupuesto CSS existentes; el formulario queda en 10.24 kB con umbral de error
  de 12 kB y Leaflet está declarado como CommonJS permitido.
- Browser: Crear y Editar verificados con mapa, búsqueda, click, arrastre, selector accesible,
  temas ORMAN/DÍA/NOCHE y sin overflow en 320, 360, 390, 430, 768, 1280, 1366, 1440, 1600 y
  1920 px. El listado y el tema ORMAN quedaron restaurados.
- Se añadieron `leaflet` y `@types/leaflet`; `package-lock.json` cambió por estas dependencias.
- No se ejecutaron `git add`, `git commit` ni `git push`.

## 2026-09-13 - Fase 15: Portada y layout de Propiedades

### Añadido y cambiado

- Se amplió la pantalla de Crear/Editar Propiedad con composición responsive de columna principal y sidebar, manteniendo una sola columna en tablet y móvil.
- Se añadió el selector visual de portada con preview local, validación JPG/PNG de hasta 5 MiB, placeholder, estados de carga/error y cambios pendientes.
- `PropiedadApiService` consume `GET`, `PUT` multipart con `foto` y `DELETE /api/v1/propiedades/{codprop}/portada` con tipos explícitos.
- Crear persiste primero la propiedad y después la portada opcional; Editar aplica el reemplazo o eliminación después del `PUT` de datos. Un fallo de portada no repite el guardado de la propiedad.
- Las cards consumen `tienePortada` y Blob autenticado, liberan sus Object URL y no usan la referencia legacy `portadaUrl` como imagen interna.
- La vista previa muestra únicamente nombre, tipo, ciudad, inversión y portada. No se añadieron campos de la referencia visual que no existen en el contrato.

### Verificado

- Pruebas focalizadas de Propiedades: 5 archivos y 61 pruebas aprobadas.
- Suite completa: 50 archivos y 379 pruebas aprobadas en la última ejecución.
- Typecheck, Prettier y build de producción correctos; el build genera el chunk lazy `propiedad-form-component`.
- El build conserva advertencias de presupuesto CSS del proyecto y registra `propiedad-form.component.css` (7.74 kB) y `propiedad-card.component.css` (4.33 kB) sobre el presupuesto de 4 kB.
- `package-lock.json` no cambió, no se modificó Backend y no se ejecutaron operaciones Git.
- Browser: shell público y restauración de ORMAN comprobados; la validación privada queda pendiente de una sesión Backend válida porque la sesión disponible expiró y las credenciales de prueba fueron rechazadas.

## 2026-09-13 - Fase 14: Crear y editar Propiedades

### Añadido y cambiado

- Se añadió una única página standalone reutilizable para crear en `/app/propiedades/nueva` y editar en `/app/propiedades/:codprop/editar`.
- El listado incorpora el botón `Añadir propiedad` al nivel del título y conecta `editRequested` de cada card con la ruta de edición correspondiente.
- `PropiedadApiService` consume los contratos confirmados de detalle, creación y actualización con tipos explícitos.
- El alta toma `codperPropietaria` desde `AuthService.codper()`, envía `estado: 1` y no solicita ni expone propietario, estado ni portada.
- La edición carga el detalle antes de renderizar el formulario y preserva `codperPropietaria`, `estado` y `portadaUrl` en el `PUT` completo.
- Se validan requeridos, longitudes, tipo permitido, inversión no negativa, rangos de coordenadas y la regla de latitud/longitud como pareja. Los `ProblemDetail.fieldErrors` se muestran junto a sus controles.
- No se implementaron activar/desactivar, detalle funcional, Unidades, fotografías, contratos, pagos ni cambios Backend.

### Verificado

- Pruebas focalizadas de Propiedades: 5 archivos y 47 pruebas aprobadas.
- Suite completa: 49 archivos, 357 pruebas aprobadas y 3 fallos preexistentes en `OrmanNotificationService`.
- Typecheck y Prettier correctos.
- Build de producción correcto y con chunk lazy `propiedad-form-component`; no introdujo una nueva advertencia de presupuesto CSS. Se mantienen advertencias históricas en otros componentes.
- Browser revisado antes y después: botón en el encabezado, navegación Crear/Editar, carga real de detalle, formulario vacío en Crear y campos técnicos no visibles. En 320, 360, 390, 430, 768, 1280, 1366, 1440, 1600 y 1920 px no hubo overflow; el formulario usa una columna en móvil y dos desde tablet. ORMAN, DÍA y NOCHE verificados y ORMAN restaurado.
- `package-lock.json` no cambió y no se ejecutaron operaciones Git.

## 2026-09-13 - Centrar iconos del resumen de Menús

### Cambiado

- Se corrigió la alineación vertical de los iconos circulares de las tarjetas resumen de Menús.
- La caja tipográfica de los iconos Material ahora utiliza centrado explícito con `grid`, `place-items: center` y `line-height: 1`.
- No se modificaron datos, lógica, API ni acciones.

### Verificado

- Pruebas focalizadas de Menús: 4 archivos y 30 pruebas aprobadas.
- Typecheck y Prettier correctos.
- Centrado verificado en navegador para anchos de 320, 360, 390, 430, 768, 1280, 1536 y 1856 px, y en los temas ORMAN, DÍA y NOCHE.
- Suite completa: 48 archivos y 343 de 346 pruebas aprobadas; las 3 fallas pertenecen al servicio histórico de notificaciones y no están relacionadas con este cambio.
- El build de producción quedó bloqueado por DNS al intentar obtener la fuente externa de Google Fonts (`fonts.googleapis.com`). El fallback sin optimización solo expuso límites de presupuesto existentes.
- `package-lock.json` no cambió y no se ejecutaron operaciones Git.

## 2026-09-13 - Corrección de alineación en las tarjetas de Propiedades

### Cambiado

- Las métricas inferiores reutilizan desde `lg` las mismas proporciones de columna (`1.2fr / 1fr`) y separación de la fila superior.
- Se eliminó en desktop el `border-top` aislado de `INVERSIÓN INICIAL`; el separador continúa disponible en móvil y tablet.
- No se modificaron contenido, datos, métricas, ocupación, modelo, API, servicios, iconos, botones ni lógica.

### Verificado

- Pruebas focalizadas de Propiedades: 4 archivos y 33 pruebas aprobadas.
- Suite completa: 48 archivos y 346 pruebas aprobadas.
- Typecheck y Prettier correctos; build de producción correcto con advertencias de presupuesto CSS existentes, incluida la hoja de la card.
- Browser validado en 320, 360, 390, 430, 768, 1280, 1366, 1440, 1536, 1600 y 1920 px: guías desktop coincidentes, apilado responsive y sin overflow.
- Temas ORMAN, DÍA y NOCHE revisados; ORMAN restaurado. `package-lock.json` sin cambios y sin commits realizados.

## 2026-09-13 - Reubicar inversión y métricas en las tarjetas de Propiedades

### Cambiado

- Se reordenaron únicamente los bloques visuales de `PropiedadCardComponent`: identidad a la izquierda e inversión a la derecha en la fila superior; Unidades y Ocupación en la fila inferior.
- En móvil y tablet se conserva un flujo vertical limpio para evitar columnas estrechas.
- Se conservaron contenido, métricas, iconos, botones, portada, placeholder, proporciones, tokens de tema y altura compacta; no se modificaron modelo, API, servicios ni lógica.

### Verificado

- Pruebas focalizadas de Propiedades: 4 archivos y 33 pruebas aprobadas.
- Suite completa: 48 archivos y 346 pruebas aprobadas.
- Typecheck y Prettier correctos; build de producción correcto con advertencias de presupuesto CSS existentes, incluida la hoja de la card.
- Revisión real en navegador en 320, 360, 390, 430, 768, 1280, 1366, 1440, 1536, 1600 y 1920 px; grid 1/2/3 y sin overflow horizontal.
- Temas ORMAN, DÍA y NOCHE revisados; ORMAN restaurado. La respuesta Backend disponible mostró `0%`; `87,5%` y `100%` permanecen cubiertos por las pruebas de la card.
- `package-lock.json` sin cambios y sin commits realizados.

## 2026-09-12 - Redistribuir métricas en las tarjetas de Propiedades

### Cambiado

- Se actualizó `Propiedad` para tipar `unidadesHabilitadas`, `unidadesOcupadas` y `ocupacion`, además de `cantidadUnidades`.
- `PropiedadCardComponent` usa una grilla interna desde `lg`: identidad e inversión a la izquierda, métricas de Unidades y Ocupación a la derecha, y acciones a todo el ancho inferior.
- Unidades muestra el total recibido por Backend con `meeting_room`, singular/plural y el auxiliar de unidades habilitadas.
- Ocupación muestra directamente `ocupacion`, el auxiliar `X de Y ocupada(s)` y una barra `progressbar` accesible, sin recalcular el valor en Angular.
- En móvil y tablet las métricas usan dos columnas compactas; no se modificaron HTTP, resumen superior, portada, placeholder, filtros, paginación, navegación ni gestión de Unidades.

### Verificado

- Pruebas focalizadas de Propiedades: 4 archivos y 33 pruebas aprobadas.
- Suite completa: 48 archivos; 343 pruebas aprobadas y 3 fallos preexistentes en `OrmanNotificationService`.
- Typecheck y Prettier correctos; build de producción correcto con advertencias de presupuesto CSS, incluida `propiedad-card.component.css` con 240 bytes sobre su presupuesto.
- Revisión real en navegador en 320, 360, 390, 430, 768, 1280, 1366, 1440, 1536, 1600 y 1920 px; temas ORMAN, DÍA y NOCHE revisados, sin overflow horizontal y ORMAN restaurado.
- `package-lock.json` sin cambios y sin commits realizados.

## 2026-09-12 - Mostrar cantidad de unidades en Propiedades

### Cambiado

- `Propiedad` incorpora el campo obligatorio `cantidadUnidades`, recibido directamente desde `GET /api/v1/propiedades`.
- `PropiedadCardComponent` muestra una línea secundaria compacta con `meeting_room` después de dirección/ciudad y antes de inversión inicial.
- La etiqueta conserva singular y plural: `0 Unidades`, `1 Unidad`, `2 Unidades` y `3 Unidades`.
- No se añadió endpoint, petición adicional, conteo Angular, navegación ni gestión del módulo de Unidades. No se modificaron `PropiedadesResumenComponent`, portada, placeholder, proporción, filtros ni paginación.

### Verificado

- Pruebas focalizadas de Propiedades: 4 archivos y 31 pruebas aprobadas.
- Suite completa: 48 archivos y 344 pruebas aprobadas.
- Typecheck, Prettier y build de producción correctos; las advertencias del build corresponden a presupuestos CSS preexistentes de otros features.
- Revisión real del navegador en 320, 360, 390, 430, 768, 1280, 1366, 1440, 1600 y 1920 px; temas ORMAN, DÍA y NOCHE revisados, sin overflow horizontal.
- `package-lock.json` sin cambios y sin commits realizados.

## 2026-09-12 - Corrección responsive de escritorio del listado de Propiedades

### Cambiado

- Se compactaron las tarjetas del resumen global en escritorio: de una altura mínima de `10.5rem` a `8.5rem`, con padding, gaps, iconos y tipografía ligeramente menores.
- `PropiedadCardComponent` conserva portada `16:9` en móvil y tablet, y usa proporción `2.2:1` desde `1024px` para reducir el peso visual de imagen y placeholder.
- La tarjeta redujo su espaciado interno en desktop y el listado incorpora tres columnas desde `2xl` (`1536px`), manteniendo una columna en móvil y dos desde `md`.
- No se modificaron API, modelos, cálculos, filtros, búsqueda, acciones, temas ni la lógica de paginación. El paginador sigue después del grid y se renderiza con la condición existente `totalPages > 0`.

### Verificado

- Revisión visual real en navegador en 320, 360, 390, 430, 768, 1280, 1366, 1440, 1600 y 1920 px.
- Temas ORMAN, DÍA y NOCHE revisados; ORMAN quedó restaurado y no se detectó overflow horizontal.
- Pruebas focalizadas de Propiedades: 4 archivos y 29 pruebas aprobadas.
- Suite completa: 48 archivos y 342 pruebas aprobadas.
- Typecheck, Prettier y build de producción correctos; las advertencias del build corresponden a presupuestos CSS preexistentes de otros features.
- `package-lock.json` sin cambios y sin commits realizados.

## 2026-09-12 - Corrección responsive del resumen de Propiedades

### Cambiado

- El resumen de Propiedades usa una cuadrícula 2×2 en móvil y conserva 2×2 en tablet y 4×1 en escritorio.
- En móvil se redujeron únicamente padding, gaps, iconos, tamaños tipográficos, altura mínima y grosor de la barra para evitar cuatro cards verticales demasiado altas.
- Los títulos y textos auxiliares mantienen su contenido y pueden envolver palabras sin truncarse; no se modificaron API, modelos, cálculos, estados, filtros ni paginación.

### Verificado

- Revisión visual real en navegador en 320, 360, 375, 390, 412, 430, tablet (768) y escritorio (1280) px.
- Se revisaron los temas ORMAN, DÍA y NOCHE; no se detectó overflow horizontal y la barra conserva su accesibilidad.
- Suite completa: 48 archivos y 342 pruebas aprobadas.
- Typecheck, Prettier y build de producción correctos; `package-lock.json` sin cambios.

## 2026-09-12 - Fase 13: Resumen de Propiedades

### Añadido

- Se añadió `PropiedadResumen` para tipar la respuesta real de `GET /api/v1/propiedades/resumen`.
- `PropiedadApiService.getResumen()` consume el resumen global sin enviar `codperPropietaria`.
- Se incorporó `PropiedadesResumenComponent` sobre el listado, con inversión, propiedades activas, unidades y ocupación global.
- El resumen mantiene loading y error independientes del listado; los filtros y la paginación no vuelven a solicitarlo.
- La ocupación usa el valor recibido por Backend en una barra `progressbar` accesible y el grid responde a móvil, tablet y escritorio.

### Verificado

- Pruebas del feature: 29 pruebas aprobadas en 4 archivos (las cinco del resumen quedaron verificadas dentro de la suite completa).
- Suite completa: 48 archivos; 339 pruebas aprobadas y 3 fallos preexistentes en `OrmanNotificationService`.
- Typecheck correcto y build de producción correcto.
- `package-lock.json` sin cambios.

## 2026-09-11 - Fase 13: Listado de Propiedades

### Añadido y cambiado

- Se implementó el listado lazy `/app/propiedades/listar` con tarjetas inmobiliarias responsive y estados de carga, error, vacío y sin coincidencias.
- Se actualizaron los modelos para reflejar únicamente el contrato real de `PropiedadResponse`.
- Se añadió búsqueda remota por `q` con debounce y cancelación mediante `switchMap`.
- Se añadieron los filtros de tipo `CASA`/`EDIFICIO` y estado numérico `1`/`0`, sin filtro independiente de ciudad.
- Se añadió paginación de servidor con `page` base cero, `size=20`, `sort=nombre,asc` y resumen `Mostrando X de Y propiedades`.
- Se creó `PropiedadCardComponent` con portada, placeholder temático, badges, inversión en bolivianos y outputs visuales preparados para acciones futuras.

### Corrección de iconos

- Se corrigió el recorte de iconos causado porque Propiedades no declaraba la familia Material Symbols Rounded ni sus ligaduras; la regla global de Angular Material `.mat-icon` (`24px` y `overflow: hidden`) terminaba mostrando y recortando el texto normal. La solución local del feature restaura la fuente, las ligaduras, las variaciones y `overflow: visible`, sin añadir dependencias.

### Verificado

- Pruebas focalizadas: 3 archivos y 17 pruebas aprobadas.
- Typecheck y Prettier correctos.
- Build de producción correcto, con chunk lazy de Propiedades y sin nuevas advertencias CSS en este feature.
- `git diff --check` correcto; permanecen avisos de conversión LF/CRLF.
- `package-lock.json` sin cambios.

### Fuera de alcance

- Crear, editar, detalle funcional, activar/desactivar, unidades, fotografías, contratos, pagos, notificaciones, KPIs, ocupación, rentabilidad, ingresos y nueva propiedad funcional quedan pendientes de fases posteriores autorizadas.

## 2026-09-09 - Corrección de contratos de Asignar Procesos

### Cambiado

- Se ajustó `Proceso` al contrato confirmado con `estado: 0 | 1`.
- Se incorporó `MeProResponse` para tipar la respuesta real de Menú–Proceso, incluyendo `nombreProceso`, `enlaceProceso` y `estadoProceso`.
- `ProcesoApiService` agrega todas las páginas del catálogo y filtra localmente los Procesos activos sin enviar `q` ni `estado`.
- `AsignarProcesosApiService` tipa la respuesta de asignación y mantiene POST sin body y DELETE sin body.
- La Page adapta las tarjetas asignadas/disponibles a los nombres reales de la respuesta y recarga el contexto de navegación después de asignar o retirar, preservando el Rol seleccionado.
- Se actualizaron las pruebas HTTP, de catálogo y de presentación.

### Verificado

- Typecheck correcto.
- Pruebas relacionadas: 5 archivos y 35 pruebas aprobadas.
- Build de producción correcto; se generó el chunk lazy de Asignar Procesos.
- `git diff --check` correcto; permanecen avisos de conversión LF/CRLF.
- `package-lock.json` sin cambios.

## 2026-09-09 - Fase 12: Asignar Procesos a Menú

### Añadido

- Pantalla privada lazy `/app/asignar-procesos/listar` con layout master-detail.
- Listado remoto de Menús activos con búsqueda, selección y paginación Backend.
- Catálogo paginado de Procesos mediante `ProcesoApiService`.
- Procesos asignados y disponibles con búsqueda local y paginación independiente.
- `AsignarProcesosApiService` para consultar, asignar y retirar Procesos por Menú.
- Cards responsive, Material Symbols Rounded, estados loading/error/vacío y accesibilidad equivalente a Asignar Menús.
- Pruebas HTTP y de presentación para la relación Menú–Proceso.

### APIs

- GET `/api/v1/menus?estado=1`
- GET `/api/v1/procesos?page=&size=&sort=`
- GET `/api/v1/menus/{codm}/procesos`
- POST `/api/v1/menus/{codm}/procesos/{codp}`
- DELETE `/api/v1/menus/{codm}/procesos/{codp}`

### Verificado

- Typecheck correcto.
- Prettier correcto en archivos del alcance.
- Pruebas específicas: 3 archivos y 12 pruebas aprobadas.
- Build de producción correcto; se generó el chunk lazy de Asignar Procesos.
- `git diff --check` correcto; permanecen avisos de conversión LF/CRLF.
- Suite completa: 43 archivos aprobados y 1 archivo con 3 fallos preexistentes de aislamiento en `OrmanNotificationService`; su prueba aislada pasa.
- `package-lock.json` sin cambios.

## 2026-09-09 - Fase 11: Asignar Menús a Rol

### Añadido

- Pantalla privada lazy /app/asignar-menus/listar con layout master-detail.
- Listado remoto de Roles activos con búsqueda debounced, cancelación y paginación Backend.
- Catálogo paginado de Menús activos mediante MenuApiService.
- Menús asignados y disponibles con búsqueda local y paginación independiente de cuatro cards.
- Servicio AsignarMenusApiService para consultar, asignar y retirar Menús por Rol.
- Cards responsive con Material Symbols Rounded y fallback visual menu.
- Estados loading, error, vacío, sin selección y sin coincidencias.
- Pruebas HTTP y de presentación para la nueva relación Rol–Menú.

### APIs

- GET /api/v1/roles?estado=1
- GET /api/v1/menus?estado=1
- GET /api/v1/roles/{codr}/menus
- POST /api/v1/roles/{codr}/menus/{codm}
- DELETE /api/v1/roles/{codr}/menus/{codm}

### Verificado

- Typecheck correcto.
- Pruebas específicas: 3 archivos y 12 pruebas aprobadas.
- Suite completa: 42 archivos y 293 pruebas aprobadas.
- Build de producción correcto; se generó el chunk lazy de Asignar Menús.
- git diff --check correcto.
- package-lock.json sin cambios.

## 2026-09-09 - Fase 10: estructura base de Asignar Menús y Asignar Procesos

### Añadido

- Se crearon las estructuras `features/asignar-menus/` y `features/asignar-procesos/` con sus carpetas `components`, `data`, `models` y `pages`.
- Se añadieron las Pages standalone mínimas `AsignarMenusListComponent` y `AsignarProcesosListComponent`.
- Se añadieron templates semánticos, hojas CSS vacías y una prueba de creación por cada Page.
- Se documentó la fase sin crear rutas ni integración funcional.

### Limitaciones

- No se añadieron servicios HTTP, modelos Rol–Menú o Menú–Proceso, DTOs, mocks, componentes hijos, modales, formularios, filtros, paginadores, permisos ni lógica de asignación o retiro.

### Verificado

- Typecheck: correcto.
- Pruebas específicas: 2 archivos y 2 pruebas aprobadas.
- Build de producción: correcto; permanecen advertencias de presupuesto CSS preexistentes en features existentes.
- `package-lock.json`: sin cambios.
- `git diff --check`: correcto.

## 2026-09-09 - Fase 09: buscador de Roles asignados

### Cambiado

- Se añadió un buscador accesible en la misma fila del encabezado de `Roles asignados`.
- El filtro local busca por nombre y código únicamente entre los Roles asignados al Usuario seleccionado.
- La consulta vacía restaura las tarjetas y la paginación se recalcula sobre el resultado filtrado.
- Se añadió el estado `No se encontraron roles asignados.` para búsquedas sin coincidencias.
- Se reutilizó el patrón responsive del buscador de Roles disponibles sin modificar servicios ni acciones.

### Verificado

- Typecheck: correcto.
- Pruebas específicas: correctas; 2 archivos y 31 pruebas aprobadas.
- Build de producción: correcto; permanece la advertencia de presupuesto CSS de Asignar Roles junto con las advertencias históricas de otros módulos.
- `package-lock.json`: sin cambios.
- `git diff --check`: correcto; se mantienen únicamente los avisos habituales de conversión de finales de línea.

## 2026-09-08 - Fase 09: buscador de Roles disponibles

### Cambiado

- Se añadió un buscador accesible en la misma fila del encabezado de `Roles disponibles para asignar`.
- El filtro local busca por nombre y código, actualiza las tarjetas en tiempo real y reinicia su paginación al cambiar la consulta.
- En móvil el encabezado puede envolver el buscador debajo del título sin alterar Roles asignados ni las acciones de asignar/quitar.
- Se añadió el estado `No se encontraron roles disponibles.` para búsquedas sin coincidencias.

### Verificado

- Typecheck: correcto.
- Pruebas específicas: correctas; 2 archivos y 25 pruebas aprobadas.
- Build de producción: correcto; permanece la advertencia de presupuesto CSS histórica de Asignar Roles.
- `package-lock.json`: sin cambios.
- `git diff --check`: correcto; se mantienen únicamente los avisos habituales de conversión de finales de línea.

## 2026-09-08 - Fase 09: corrección de paginación de Usuarios

### Cambiado

- El directorio de Usuarios solicita `size=5` y limita la consulta a cinco Usuarios por página.
- El paginador de Usuarios solo aparece cuando existen más de cinco Usuarios; conserva los botones accesibles Anterior y Siguiente.
- Se añadieron pruebas para 1, 5, 6, 10 y 11 Usuarios, incluyendo navegación y conservación de selección.

### Verificado

- Typecheck: correcto.
- Pruebas específicas: correctas; 2 archivos y 21 pruebas aprobadas.
- Build de producción: correcto; permanecen advertencias de presupuesto CSS históricas, incluida la hoja de Asignar Roles.
- `package-lock.json`: sin cambios.
- `git diff --check`: correcto; se mantienen únicamente los avisos habituales de conversión de finales de línea.

## 2026-09-08 — Fase 09: Iteración visual administrativa de Asignar Roles

### Cambiado

- La vista master-detail de Asignar Roles incorpora directorio de Usuarios con búsqueda local, selección resaltada, ficha administrativa, cards de Roles y estados responsive con tokens de ORMAN, DÍA y NOCHE.
- El catálogo paginado de Roles activos se centralizó en `RolApiService`; `AsignarRolesApiService` conserva Usuarios y asignaciones, sin duplicar la API de Roles.
- La ficha consulta Persona por el `codper` confirmado del Usuario y muestra nombre compuesto junto con Estado Usuario y Estado Persona; CI se omite de esta sección por decisión visual.
- La ficha de Usuario seleccionado ahora prioriza el login y presenta debajo el nombre completo de la Persona asociada; se eliminó el texto genérico de administración de Roles.
- Las tarjetas del directorio de Usuarios priorizan visualmente el login y mantienen el nombre de Persona como dato secundario; el placeholder ahora dice `Buscar por login o nombre...`, sin cambiar el filtro local existente.
- La ficha de Usuario seleccionado eliminó el bloque duplicado de Login y estados; después de su cabecera comienzan directamente las secciones de Roles.
- La zona de Roles ahora se organiza verticalmente: Roles asignados arriba y Roles disponibles para asignar abajo, con grid responsive de dos columnas desde tablet; se retiró la fecha de asignación no disponible.
- Ambas secciones de Roles ahora comparten un grid responsive de 1/2/3/4 columnas según el viewport y cards más compactas, sin modificar sus datos ni acciones.
- Ambas secciones incorporan paginación independiente cuando superan cuatro tarjetas, con cuatro elementos por página y controles accesibles Anterior/Siguiente.
- La fecha de asignación continúa explícitamente no disponible porque el contrato de Roles asignados no la expone.
- Las cards reservan una zona de altura fija para badges opcionales; así `Protegido` se mantiene visible sin aumentar la altura de `PROPIETARIO` ni desalinear los botones de acción.

### Pendiente de Backend

- Exponer fecha de asignación en la respuesta de Roles asignados si el dominio la requiere visualmente.

## 2026-09-08 — Fase 09: Asignar Roles a Usuario

### Añadido

- Pantalla privada lazy `/app/asignar-roles/listar` con layout master-detail responsive.
- Listado paginado de Usuarios, selección visual y estados loading, error y vacío.
- Consulta de Roles asignados y catálogo paginado de Roles activos.
- Asignación y retiro de Roles mediante los endpoints confirmados, con feedback de `OrmanNotificationService`.
- Modelo `Usuario` limitado a `login`, pruebas de servicio/página y documentación de la fase.

### Limitaciones

- `GET /api/v1/usuarios` no tiene en el frontend un contrato confirmado para nombre o estado; la pantalla muestra `login` y deja la ampliación como pendiente de confirmación Backend.
- No se añadieron búsqueda/filtros de Usuarios, modales avanzados, confirmaciones, Sidebar, permisos, dependencias ni cambios Backend.

### Verificado

- Typecheck: correcto.
- Pruebas específicas: correctas; 2 archivos y 8 pruebas aprobadas.
- Suite completa: 37 archivos; 245 pruebas aprobadas y 3 fallas preexistentes en `orman-notification.service.spec.ts`, relacionadas con mocks de `ngx-sonner`.
- Build de producción: correcto; el chunk lazy de Asignar Roles se generó sin advertencia propia. Persisten advertencias de presupuesto CSS preexistentes en Roles, Menús y Personas.
- `git diff --check`: correcto.
- `package-lock.json`: sin cambios.

## 2026-09-08 — Fase 08: acciones y modales de Gestionar Menús

### Añadido

- Botón Añadir Menú y formulario compartido para Crear y Editar.
- Validación de nombre, estado inicial en Crear, preview y selector visual local de iconos con búsqueda y categorías.
- Acciones responsive de Editar, Desactivar y Reactivar, con modal accesible de confirmación de estado.
- Requests HTTP tipados para POST, PUT y PATCH, toasts de éxito y recargas del listado/resumen según la operación.
- Pruebas de formularios, selector, acciones desktop/mobile, requests, errores, toasts y recargas.

### Excluido

- DELETE, detalle, asignación Rol–Menú, asignación Menú–Proceso, Sidebar, Roles y Backend.

### Verificado

- Typecheck: correcto.
- Pruebas específicas: correctas; 4 archivos y 30 pruebas aprobadas.
- Suite completa: correcta; 35 archivos y 239 pruebas aprobadas.
- Build de producción: correcto; persisten advertencias de presupuesto CSS en Menús y las advertencias históricas de Personas.
- `git diff --check`: correcto.
- `package-lock.json`: sin cambios.

## 2026-09-08 — Fase 08: listado funcional del módulo Menús

### Añadido

- Listado remoto paginado de Menús, resumen global, búsqueda con debounce, filtro remoto por estado y limpieza de filtros.
- Cards responsive con estado, código e icono real de `Menu.icono`, usando `menu` como fallback visual para valores nulos o vacíos.
- Estados de loading, vacío, error de listado y error independiente de resumen, con soporte de temas ORMAN.
- Ruta privada lazy `/app/menus/listar`.
- Pruebas de contratos HTTP, filtros, paginación, iconos, estados visuales, errores y concurrencia.

### Excluido

- Crear, Editar, Activar, Desactivar, asignaciones Rol–Menú, asignaciones Menú–Proceso, Sidebar, Menús/Procesos existentes y Backend.

### Verificado

- Typecheck: correcto.
- Pruebas específicas: 3 archivos y 15 pruebas aprobadas.
- Build de producción: correcto; persisten advertencias CSS preexistentes en Personas y una advertencia de presupuesto de 424 bytes en Menús.
- `git diff --check`: correcto.
- `package-lock.json`: sin cambios.

## 2026-09-08 — Fase 08: estructura inicial del módulo Menús

### Añadido

- Estructura inicial `features/menus` con página base, componentes standalone de formulario y confirmación de estado, servicio injectable sin HTTP y modelo `Menu`.
- `Menu.icono` se tipó como `string | null` y `Menu.estado` como `0 | 1`.
- Pruebas básicas de creación y render mínimo de los tres componentes.

### Excluido

- Listado funcional, resumen, filtros, paginación, cards, formularios, modales funcionales, CRUD, cambio de estado, rutas, Sidebar, Menús/Procesos existentes y Backend.

### Pendiente

- Listado funcional, resumen, filtros, CRUD, cambio de estado e integración HTTP.

## 2026-09-06 — Fase 07: acciones de Gestionar Roles

### Añadido

- Crear y editar Roles mediante `RolFormModalComponent` compartido, con validación de nombre, estado inicial en creación y errores de campo.
- Activar y desactivar Roles mediante `RolStatusConfirmModalComponent` compartido.
- Acciones desktop/mobile en cards, tooltips accesibles, protección UX de `PROPIETARIO` y toasts de éxito para las cuatro operaciones.
- Manejo de `ProblemDetail` visible en los modales, manteniéndolos abiertos ante error y limpiando feedback al iniciar/cerrar operaciones.
- Pruebas de contratos HTTP, recargas, notificaciones, errores, formularios, estados y protección de `PROPIETARIO`.

### Excluido

- DELETE, detalle de Rol, asignaciones Rol–Usuario, Menús, Procesos, Sidebar y cambios Backend.

### Verificado

- Typecheck: correcto.
- `npm test -- --watch=false`: correcto; 31 archivos y 209 pruebas aprobadas.
- `npm run build`: correcto; no hay advertencia de presupuesto CSS para Roles. Persisten dos advertencias preexistentes en componentes de Personas.
- `git diff --check`: correcto. `package-lock.json` no fue modificado.

## 2026-09-05 — Fase 07: resumen y filtros remotos de Gestionar Roles

### Añadido

- `GET /api/v1/roles/resumen` tipado para las métricas globales `totalRoles`, `activos` e `inactivos`.
- Búsqueda remota por nombre con debounce de 350 ms y filtro remoto por estado, preservando filtros al paginar y omitiendo parámetros vacíos.
- Tres tarjetas de resumen, filtros accesibles, estados vacíos diferenciados y skeletons compactos para la card de Rol.
- Cancelación de solicitudes de listado obsoletas con `switchMap`.

### Cambiado

- Las cards de Rol ahora muestran solo datos reales: nombre, código, estado y la etiqueta `Protegido` para `PROPIETARIO`; se retiraron iconos principales no representados por el contrato Backend.
- Se alinearon hover, bordes, sombras, responsive, paginación, temas y reduced motion con Gestionar Personas.

### Excluido

- Crear, Editar, Activar, Desactivar, modales, Sidebar, Menús, Procesos y cambios Backend.

### Verificado

- `npx tsc -p tsconfig.app.json --noEmit`: correcto.
- `npm test -- --watch=false`: 30 archivos y 198 pruebas aprobadas.
- `npm run build`: correcto; no hay advertencia de presupuesto CSS para Roles. Persisten dos advertencias preexistentes en componentes de Personas.
- `git diff --check`: correcto. `package-lock.json` no fue modificado.

## 2026-09-05 — Fase 07: primera parte funcional de Gestionar Roles

### Añadido

- Ruta privada `/app/roles/listar` con carga lazy de `RolesListComponent`.
- `RolApiService.list()` para `GET /api/v1/roles`, enviando únicamente `page`, `size` y `sort=nombre,asc`.
- Cards responsive de Roles con código, estado Activo/Inactivo e identificación visual discreta de `PROPIETARIO` como Protegido.
- Estados loading, error con `ProblemDetail.detail` o fallback, vacío y paginación Anterior/Siguiente.
- Pruebas de carga, parámetros HTTP, renderizado, estados, propietario y navegación de páginas.

### Excluido

- Crear, Editar, Activar, Desactivar, filtros, resumen, acciones de card, Sidebar, Menús, Procesos y cambios Backend.

### Verificado

- `npx tsc -p tsconfig.app.json --noEmit`: correcto.
- `npm test -- --watch=false`: 30 archivos y 191 pruebas aprobadas.
- `npm run build`: correcto; no hay warning de presupuesto CSS para Roles. Persisten warnings preexistentes en Personas.
- `git diff --check`: correcto. `package-lock.json` no fue modificado.

## 2026-09-05 — Fase 07 completada: estructura inicial de Gestionar Roles

### Añadido

- Estructura mínima `features/roles` con página base, componentes standalone para formulario y confirmación de estado, servicio `RolApiService` sin HTTP y modelo `Rol` limitado a `codr`, `nombre` y `estado`.
- Pruebas básicas de creación/renderizado de los tres componentes.

### Excluido

- No se añadieron rutas, Sidebar, Menús, Procesos, endpoints, contratos adicionales, filtros, paginación, cards, formularios, modales definitivos ni lógica de negocio.

### Verificado

- `npx tsc -p tsconfig.app.json --noEmit`: correcto.
- `npm test -- --watch=false`: 30 archivos y 186 pruebas aprobadas.
- `npm run build`: correcto; persisten únicamente advertencias de presupuesto CSS en archivos existentes de Personas.
- `git diff --check`: correcto. `package-lock.json` no fue modificado.

## 2026-09-04 — Fase 06 en desarrollo: mejora UX del modal de estado de Persona

### Cambiado

- `PersonaStatusConfirmModalComponent` conserva un único flujo compartido y ahora recibe el nombre completo mediante `personaName`.
- El icono, título, mensaje, tono semántico, acción y estado de carga se diferencian mediante `operation` sin mover la lógica HTTP.
- Se añadieron `person_off`/`restore`, mensajes administrativos aprobados, `Dar de baja`/`Reactivar persona` y `Desactivando...`/`Reactivando...`.
- Se reforzaron `aria-describedby`, `aria-busy`, foco visible y adaptación para poca altura y pantallas pequeñas usando tokens existentes.

### Verificado

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm test -- --watch=false`: 27 archivos y 177 pruebas aprobadas.
- `npm run build`: correcto; 353.48 kB iniciales brutos y Personas como chunk lazy de 93.92 kB. Persisten advertencias de presupuesto CSS en archivos previos, sin errores de compilación.
- `git diff --check`: correcto. No se modificó `package-lock.json`.

## 2026-09-04 — Fase 06 en desarrollo: ampliación institucional de la ficha impresa

### Cambiado

- El encabezado de `print-sheet` conserva el SVG oficial y muestra `ORMAN` junto al logo, con `FICHA DE PERSONA` debajo.
- La sección de información del sistema incorpora `persona.codper` y conserva Estado, Usuario y Fecha de registro.
- Se añadió el pie `ORMAN · Gestión de Personas` junto con la fecha dinámica en formato `dd/MM/yyyy`.
- No se modificaron el modal visual, las fotografías, los datos existentes, la lógica `window.print()` ni el backend.

### Verificado

- Typecheck correcto.
- Las pruebas del componente de detalle pasan; la suite global ejecutó 27 archivos y 172 de 175 pruebas. Las 3 fallas restantes pertenecen a pruebas preexistentes de `OrmanNotificationService`.
- Build de producción correcto; se mantienen advertencias de presupuesto CSS, sin errores de compilación.
- El SVG oficial continúa incluido en `dist/orman-frontend/browser/images/brand/orman-logo.svg`.
- `package-lock.json` no cambió y `git diff --check` es correcto.

## 2026-09-03 — Fase 06 en desarrollo: logo oficial en la ficha impresa

### Cambiado

- El encabezado de `print-sheet` utiliza el recurso oficial `/images/brand/orman-logo.svg` en lugar del texto institucional.
- El logo conserva el margen lateral y la alineación del título `FICHA DE PERSONA`, con dimensiones proporcionales para hoja carta.

## 2026-09-03 — Fase 06 en desarrollo: ajuste del encabezado de la ficha impresa

### Cambiado

- Se aumentó moderadamente el tamaño visual de `ORMAN` y se añadió margen interno al encabezado de `print-sheet`, manteniendo alineado el título `FICHA DE PERSONA`.
- No se modificaron el contenido de la ficha, el modal en pantalla ni la lógica de impresión.

## 2026-09-03 — Fase 06 en desarrollo: conservación del diseño aprobado del detalle

### Cambiado

- Se conservaron las tres tarjetas actuales de Información personal, Contacto e Información del sistema, retirando únicamente la redistribución completa en dos columnas.
- El modal mantiene la altura dinámica relativa al viewport, scroll interno cuando es necesario y la cabecera de perfil aprobada.

### Verificado

- Typecheck correcto; 27 archivos y 175 pruebas aprobadas.
- Build de producción correcto: 353.48 kB iniciales brutos y Personas como chunk lazy de 88.95 kB. Se mantienen advertencias de presupuesto CSS en el detalle y el listado, sin errores de compilación.
- El servidor Angular compiló correctamente en `127.0.0.1:4201`; la QA visual manual de impresión, responsive y zoom queda pendiente porque no hubo navegador integrado disponible.

## 2026-09-03 — Fase 06 en desarrollo: corrección de impresión y layout del detalle

### Corregido

- La impresión deja de ocultar el `print-sheet`: `PersonasListComponent` oculta solamente su sección de listado y conserva visible el componente de detalle.
- La ficha impresa usa una superficie clara y texto oscuro independientes del tema activo, sin `overflow: hidden` que pueda recortar contenido.

### Cambiado

- El detalle elimina etiquetas repetidas de nombre, tipo y estado; la cabecera concentra la identidad y el estado, mientras las secciones conservan los datos administrativos restantes.
- La información se distribuye en dos columnas desde 768 px y vuelve a una columna en pantallas menores; el modal crece hasta el límite del viewport y mantiene scroll solo cuando es necesario.

### Verificado

- Se mantienen fotografía autenticada mediante Blob/Object URL, Signals, focus trap, Escape, accesibilidad, modelos y API existentes.
- Typecheck correcto; 27 archivos y 174 pruebas aprobadas.
- Build de producción correcto: 353.48 kB iniciales brutos y Personas como chunk lazy de 89.28 kB. Se mantienen advertencias de presupuesto CSS en el detalle y el listado, sin errores de compilación.

## 2026-09-03 — Fase 06 en desarrollo: ficha administrativa de Persona

### Añadido

- Cabecera de perfil en el detalle con fotografía protegida, fallback de iniciales, nombre completo, tipo de Persona y estado visual.
- Secciones de Información personal, Información de contacto e Información del sistema, limitadas a los campos existentes de `Persona`.
- Vista de impresión separada con marca ORMAN, formato hoja carta y estilos `@media print` que ocultan el modal y cubren el contenido de la pantalla.
- Pruebas del fallback de iniciales, estructura de impresión y entrega de la Object URL al modal.

### Cambiado

- `PersonasListComponent` pasa al detalle la Object URL que ya obtiene mediante `PersonaApiService.getFoto()` y administra con su mapa de Signals; el modal no realiza llamadas HTTP.
- El detalle incorpora scroll interno, distribución móvil y Material Symbols Rounded para cierre, impresión y secciones, reutilizando tokens semánticos existentes.

### Verificado

- Typecheck, suite completa de 27 archivos y 173 pruebas, y build de producción ejecutados después del cambio. El build no presenta errores; conserva advertencias de presupuesto CSS en el detalle y en el listado.
- `package-lock.json` no fue modificado.

## 2026-08-28 — Fase 06 en desarrollo: notificaciones privadas globales

### Añadido

- `ngx-sonner` 3.1.0 (MIT, peers Angular >=19) encapsulado por `OrmanNotificationService` de `core`; los features no dependen directamente de la librería.
- Host único de notificaciones en `PrivateLayout`, con máximo de tres toast, cierre accesible, atajo nativo de Sonner, animación con respeto a `prefers-reduced-motion` y posición inferior derecha responsive.
- Tokens semánticos completos para advertencia e información, y mapeo de superficie, texto, bordes, sombra y foco de ORMAN hacia Sonner.

### Cambiado

- Crear y Editar Persona muestran confirmación de éxito solo al terminar el flujo confirmado por Backend. `fieldErrors`, errores generales y el caso Persona creada + fotografía fallida conservan su contexto inline y no generan toast duplicados.

### Verificado

- Typecheck correcto; 27 archivos y 167 pruebas aprobadas.
- Build de producción correcto: 353.48 kB iniciales brutos y Personas como chunk lazy de 79.57 kB. Permanece la advertencia preexistente de presupuesto CSS en `personas-list.component.css`.
- `ng serve --host 127.0.0.1 --port 4201` compiló correctamente. La QA visual Browser queda pendiente porque no había navegador disponible en esta sesión.

## 2026-08-27 — Fase 06 en desarrollo: ajuste de grilla, botones e iconos del modal Persona

### Cambiado

- Tipo de Persona se integró junto a Género, Apellidos ocupa su propia fila de dos controles y Contacto conserva dos columnas; móvil vuelve a una columna sin overflow.
- `Cancelar` ahora tiene apariencia y estados de botón secundario, manteniendo Guardar como acción primaria.
- Los `mat-icon` de cierre y fotografía aplican localmente Material Symbols Rounded, evitando que `close` o `photo_camera` se muestren como texto.
- Género y Tipo de Persona heredan el esquema de color activo y sus opciones usan tokens de tema cuando el navegador permite estilizar el popup nativo.
- En Añadir, Género y Tipo de Persona quedan inicialmente vacíos; Editar conserva la recuperación de sus valores existentes.

### Verificado

- TypeScript correcto; 26 archivos y 161 pruebas aprobadas.
- Build correcto; solo permanece la advertencia de presupuesto CSS ya existente en `personas-list.component.css`.

## 2026-08-27 — Fase 06 en desarrollo: validación y recuperación del formulario Persona

### Cambiado

- El único `PersonaFormModalComponent` compartido por Añadir/Editar ahora usa validación neutral, de error y de éxito con tokens semánticos, mensajes inline accesibles y foco en el primer control inválido.
- Se validan longitudes y obligatorios conocidos, nombre no blanco y la regla frontend de al menos un apellido; paterno y materno permanecen opcionales de forma individual.
- La fotografía muestra errores específicos de MIME/tamaño bajo el control. Tras crear una Persona, un fallo de foto conserva la Persona creada y evita repetir POST; eliminar foto sincroniza Persona seleccionada, listado y URL local sin recarga innecesaria.

### Verificado

- Typecheck correcto; 26 archivos y 161 pruebas aprobadas.
- Build de producción correcto: 341.12 kB iniciales brutos; Personas como chunk lazy de 77.72 kB. Permanece una advertencia preexistente de presupuesto CSS en `personas-list.component.css`, fuera de este cambio.

## 2026-08-20 — Fase 06 en desarrollo: auditoría técnica de Personas

### Corregido

- Las cards vuelven a ofrecer sus acciones en móvil mediante el menú previsto y los controles de solo icono tienen nombres accesibles.
- Los modales gestionan foco inicial, focus trap, Escape y restauración del foco; no se cierran durante una operación en progreso.
- Las fotografías Blob notifican su llegada mediante Signal en la aplicación zoneless y los filtros ya no recurren a `$any` en el template.

### Verificado

- Typecheck correcto; 26 archivos y 133 pruebas aprobadas.
- Build de producción correcto: 333.85 kB iniciales brutos; Personas emitido como chunk lazy de 51.80 kB.

## 2026-08-18 — Fase 06 en desarrollo: refactor estructural de modales Personas

### Cambiado

- Separados los modales de formulario Persona, fotografía, detalle, estado, creación de Usuario y contraseña; `PersonasListComponent` conserva coordinación y llamadas Backend.
- La fotografía temporal se encapsula y revoca sus object URLs; el listado mantiene su ciclo independiente de fotografías Blob.

### Verificado

- Typecheck correcto; 26 archivos y 131 pruebas aprobadas.
- Build de producción correcto: 334.06 kB iniciales brutos; Personas emitido como chunk lazy de 46.01 kB.

## 2026-08-18 — Fase 06 en desarrollo: rediseño visual del modal Persona

### Cambiado

- El modal reutilizable de Añadir/Editar Persona ahora tiene cabecera con subtítulo, avatar centrado, control de fotografía integrado, formulario responsive y footer separado.
- Inputs, selects, foco y errores visuales se alinearon a los tokens existentes de ORMAN, DÍA y NOCHE; no se modificaron APIs, campos ni operaciones.

### Verificado

- Typecheck correcto; 20 archivos y 123 pruebas aprobadas.
- Build de producción correcto: 336.47 kB iniciales brutos; Personas emitido como chunk lazy de 39.18 kB, sin advertencias de presupuesto CSS.

## 2026-08-18 — Fase 06 en desarrollo: resumen superior de Personas

### Añadido

- Modelo local `PersonaResumen` y consumo tipado de `GET /api/v1/personas/resumen` mediante el `HttpClient` existente.
- Cuatro cards compactas y responsive para Total Personas, Activas, Inactivas y Con Usuario, con Material Symbols reales, skeleton local y estado de error aislado.

### Cambiado

- El resumen carga en paralelo al listado y se actualiza únicamente después de crear Persona, cambiar su estado o crear Usuario vinculado. Filtros, búsqueda, paginación, edición, contraseña y fotografía no lo recargan.

### Verificado

- Typecheck correcto; 20 archivos y 122 pruebas aprobadas.
- Build de producción correcto: 334.31 kB iniciales brutos; Personas emitido como chunk lazy de 35.02 kB.

## 2026-08-17 — Fase 06 en desarrollo: Gestionar Personas

### Añadido

- Ruta lazy privada `/app/personas/listar`, alcanzable desde `Proceso.enlace` por Angular Router.
- Feature Personas con API tipada, listado remoto, filtros, paginación, cards, modales, baja/reactivación lógica, Usuario y fotografías Blob autenticadas.

### Verificado

- Typecheck correcto; 19 archivos y 113 pruebas aprobadas.
- Build de producción correcto: 333.94 kB iniciales brutos; feature Personas emitido en chunk lazy.
- La validación visual Browser sigue pendiente porque el runtime no ofreció navegador.

### Corregido

- El feature Personas ahora aplica correctamente Material Symbols Rounded a `mat-icon`; los nombres de ligadura ya no se presentan como texto.
- Cards, labels de filtros y paginación recibieron un pulido visual compacto sin cambios funcionales.

## 2026-08-14 — Corrección final de Sidebar privado responsive y estados vacíos

### Corregido

- En tablet y móvil el Sidebar cerrado queda completamente off-canvas; el Main vuelve a ocupar el ancho completo, sin rail residual ni margen lateral.
- El botón `menu` está separado del drawer y aparece solo cuando este está cerrado; al abrir, el control `close` se muestra exclusivamente dentro del drawer, que conserva backdrop y Escape.
- El drawer parte de la fila posterior a la altura real del Topbar, sin valores fijos de altura.
- Los usuarios sin roles y los roles sin menús no renderizan una columna lateral vacía; `/app/inicio` diferencia ambos estados con mensajes claros y el Topbar muestra un estado no interactivo “Sin rol asignado” cuando corresponde.

### Verificado

- Browser: 1440 × 900, 1366 × 768, 1280 × 900, 1024 × 768, 768 × 900, 429 × 900 y 360 × 800; drawer abierto/cerrado, temas ORMAN/Día/Noche, selector local de roles, menú `PROPIETARIO → GESTIONAR PERSONAS → LISTAR PERSONAS`, icono `group`, recarga autenticada y ausencia de overflow horizontal.
- Typecheck correcto; 18 archivos y 111 pruebas aprobadas.
- Build de producción correcto: 316.73 kB iniciales brutos y 81.98 kB de transferencia estimada.

## 2026-08-14 — Corrección responsive posterior del área privada

### Corregido

- El rail móvil del Sidebar dejó de depender de `-translate-x-full`, por lo que su botón de 44 px permanece dentro del viewport en tablet y mobile.
- Sidebar y backdrop se anclan a la fila que comienza después del Topbar real; el drawer ya no depende de una altura fija ni invade el Topbar cuando este ocupa más de una fila.
- La pantalla `/app/inicio` usa la altura disponible del Main y elimina el scroll residual de 20 px observado a 360 px.
- El Hero conserva profundidad 3D, pero el logo oscila entre ±14° para no desaparecer de perfil.

### Verificado

- Browser: 1440 × 900, 1366 × 768, 1280 × 900, 1024 × 768, 768 × 900, 429 × 900 y 360 × 800; Sidebar abierto/cerrado, temas, perfil, roles reales, menú real e icono Material `group`.
- Recarga autenticada correcta en `/app/inicio`, sin flash de landing ni avisos de consola.
- Typecheck correcto; 18 archivos y 108 pruebas aprobadas; build correcto con 315.93 kB iniciales brutos y 81.74 kB estimados.

## 2026-08-14 — Etapa 2 / Fase 05: Angular Material Icons en el área privada

### Añadido

- `@angular/material` 22.0.7 y su peer `@angular/cdk` 22.0.7, compatibles con Angular 22.0.7.
- Carga única de Material Symbols Rounded desde la hoja oficial de Google Fonts.
- Pruebas para iconos Material directos, fallback `apps` de icono ausente y continuidad del selector de rol.

### Cambiado

- Sidebar, Topbar y controles privados de abrir/cerrar ahora usan `MatIcon` sin migrar botones, selector, layout ni estilos Tailwind a Angular Material.
- El Sidebar representa directamente `Menu.icono`; para `null`, vacío o solo espacios utiliza `apps`.
- Se retiró el mapper visual Unicode del Sidebar.

### Pendiente

- Los valores legacy observados en fixtures históricos, como `users` y `reports`, deben actualizarse posteriormente en Backend/BD por nombres oficiales de Material Symbols, por ejemplo `group` y `assessment`. Angular no los traduce.
- CRUD de Menús, selector visual de iconos y actualización de datos de `Menu.icono` permanecen fuera de alcance.

### Verificado

- Typecheck correcto; 18 archivos y 108 pruebas aprobadas.
- Build de producción correcto: 316.40 kB iniciales brutos y 81.81 kB de transferencia estimada.
- La revisión visual manual en navegador queda pendiente porque no había navegador disponible en esta sesión.

## 2026-08-13 — Etapa 2 / Fase 04: selector de rol y Sidebar dinámico

### Cambiado

- El Topbar selecciona roles reales del `AuthContext`; el Sidebar muestra exclusivamente los menús y procesos del rol seleccionado, sin encabezados de rol.
- La selección es estado Signal local, se reconstruye desde el primer rol del contexto y se limpia con el contexto al cerrar o invalidar sesión.

### Conservado

- No se realizan requests al cambiar de rol, no se modifica autenticación, JWT, authorities ni Spring Security.

### Verificado

- Typecheck correcto; 18 archivos y 107 pruebas aprobadas; build correcto con 307.29 kB iniciales brutos y 78.92 kB estimados.
- `git diff --check` correcto y `package-lock.json` sin cambios.

## 2026-08-13 — Etapa 2 / Fase 03: contexto post-login real

### Añadido

- Modelos estrictos y `AuthContextService` para `GET /api/v1/auth/context` con estado Signal en memoria, carga única en vuelo, recarga explícita y limpieza.
- Restauración secuencial de sesión y contexto, y pruebas de endpoint, login, OTP, F5, logout, sidebar y perfil.

### Cambiado

- El sidebar privado dejó de usar su navegación mock y ahora representa Roles → Menús → Procesos del contexto Backend.
- El perfil privado usa datos de Persona y login reales, con avatar fallback cuando la referencia de foto no es una URL utilizable.

### Pendiente

- Falta un contrato Backend para resolver referencias de fotografía no URL y confirmar la semántica Router de `Proceso.enlace`.

### Verificado

- Typecheck correcto; 18 archivos y 105 pruebas aprobadas; build correcto con 306.96 kB iniciales brutos y 78.83 kB estimados.
- `git diff --check` correcto y `package-lock.json` sin cambios.

## 2026-08-12 - Corrección estructural definitiva de altura del Sidebar de Fase 02

### Corregido

- El shell privado usa una altura real de viewport (`h-[100dvh]`) en lugar de depender solo de `min-height`, dando al Content y al Sidebar una referencia vertical efectiva.
- El `<nav>` que pinta el fondo del Sidebar conserva `height: 100%` dentro de esa cadena válida; el fondo lateral ya no depende de la cantidad de opciones mock.
- El Main y la lista de navegación contienen su propio scroll vertical para conservar el alto exacto del shell.

### Conservado

- Sidebar expandido/compacto, rail y drawer móvil, TopBar, temas, perfil, autenticación, rutas y mock temporal de navegación.

### Validado

- Typecheck correcto; 17 archivos y 98 pruebas aprobadas; build correcto con 304.54 kB iniciales brutos.
- `package-lock.json` sin cambios. La comprobación visual de zoom queda pendiente de una sesión de navegador disponible.

## 2026-08-12 - Corrección responsive de Fase 02

### Corregido

- El `PrivateLayout` dejó de limitar el cuerpo privado y el contenido interno del `PrivateTopbar` a `max-w-[1800px]` centrado, eliminando los espacios laterales en monitores grandes.
- El shell privado ocupa el viewport con `min-h-[100dvh]`; el cuerpo distribuye sidebar y main con `flex-1`, y el sidebar desktop usa el alto restante del topbar.

### Conservado

- Autenticación, refresh, logout, guard, rutas, drawer responsive, temas, TopBar, Sidebar y contenido temporal sin cambios funcionales.

## 2026-08-13 - Mejora visual del PrivateTopbar de Fase 02

### Añadido

- Branding privado con logo, nombre ORMAN y subtítulo de gestión de propiedades.
- Fecha actual en español, selector de temas integrado, rol neutral, campana estructural y popover accesible de perfil.
- Avatar neutro y logout reutilizando `AuthService`.

### Fuera de alcance

- Roles reales, notificaciones, contador, foto o edición de perfil, endpoints y navegación dinámica.

### Validado

- Typecheck correcto; 17 archivos y 95 pruebas aprobadas; build correcto con 303.79 kB iniciales brutos.
- `package-lock.json` sin cambios.

## 2026-08-13 - Corrección de altura del Sidebar al cambiar zoom

### Corregido

- El Sidebar desktop ahora estira host y navegación al 100% del alto disponible del Content, evitando que el fondo termine con el contenido mock y deje una zona blanca al variar el zoom.
- Se conservan `100dvh`, el rail expandido/compacto, el drawer móvil y todos los comportamientos visuales aprobados.

### Validado

- Typecheck correcto; 17 archivos y 98 pruebas aprobadas; build correcto con 304.49 kB iniciales brutos.
- `package-lock.json` sin cambios. No se realizó validación visual directa de zoom.

## 2026-08-13 - Corrección visual y responsive del Sidebar de Fase 02

### Añadido

- Mock temporal de navegación para validar visualmente Sidebar expandido, compacto, activo y responsive.
- Hamburguesa dentro del Sidebar, rail compacto móvil persistente, drawer expandido, backdrop y cierre por Escape.
- Labels accesibles y `title` para conocer cada elemento cuando solo se muestran iconos.

### Conservado

- TopBar sin hamburguesa duplicada, fecha en español, temas, perfil, campana estructural, rol neutral, Main y rutas existentes.

### Fuera de alcance

- El mock no representa rutas, roles, permisos ni menús backend. Debe sustituirse por Usuario ↔ Roles ↔ Menús ↔ Procesos.

### Validado

- Typecheck correcto; 17 archivos y 98 pruebas aprobadas; build correcto con 304.45 kB iniciales brutos.
- `package-lock.json` sin cambios.

## 2026-08-13 - Ajuste estructural responsive de TopBar y Sidebar de Fase 02

### Añadido

- Colapso desktop del sidebar entre 18rem y 4.5rem, sin crear navegación ficticia.
- Drawer móvil con backdrop y cierre mediante hamburguesa, click externo y Escape.
- Fecha visible como segunda fila del topbar móvil y variable CSS de altura por breakpoint para posicionar el drawer.

### Conservado

- Branding, temas, perfil, campana estructural, rol neutral, layout de ancho completo, Main, sidebar “En construcción” y rutas/autenticación.

### Validado

- Typecheck correcto; 17 archivos y 97 pruebas aprobadas; build correcto con 304.47 kB iniciales brutos.
- `package-lock.json` sin cambios.

## 2026-08-12 - Etapa 2 / Fase 02: área privada base y rutas protegidas

### Añadido

- Área autenticada lazy bajo `/app` con entrada `/app/inicio`, `PrivateLayout`, topbar, sidebar estructural y contenido temporal.
- Guard de autenticación y estado de bootstrap `checking` / `authenticated` / `unauthenticated`.
- Restauración inicial de sesión mediante refresh HttpOnly y pruebas de rutas, guard, layout y bootstrap.

### Cambiado

- Login directo y OTP correcto redirigen a `/app/inicio`.
- El logout desde el topbar privado retorna a `/` y conserva `orman-device-id`.

### Validado

- Typecheck correcto, 16 archivos con 92 pruebas aprobadas y build de producción correcto (303.23 kB iniciales brutos).
- No se añadieron dependencias ni se modificó `package-lock.json`.

## 2026-08-12 - Ajuste visual y UX del OTP de ORMAN

### Cambiado

- El segundo estado de `LoginModalComponent` ahora usa seis casillas OTP individuales, con avance automático, Backspace, navegación por teclado y pegado de código completo.
- `Verificar` y `Volver` quedaron agrupados como acciones principales; `Reenviar código` se presenta como acción secundaria debajo.
- Se eliminó el mensaje informativo redundante del ingreso a OTP y se conservaron el contrato backend, resend, focus trap, Escape, X, aria-live y el foco al volver a LOGIN.

### Conservado

- El primer paso LOGIN, `AuthService`, endpoints, sesiones, refresh, XSRF, interceptor, rutas y temas oficiales sin cambios.

## 2026-08-11 - Etapa 2 / Fase 01: autenticación Angular ↔ Backend

### Añadido

- Proxy de desarrollo `/api` hacia el backend local, `HttpClient` moderno y XSRF estándar Angular.
- Estado de autenticación con Signals, deviceId estable, modelos tipados, `ProblemDetail`, Bearer, refresh single-flight, OTP y logout.
- Integración del flujo real LOGIN → OTP → AUTHENTICATED en el modal existente y estado visual autenticado mínimo.
- Pruebas de autenticación, refresh, XSRF, OTP, logout y deviceId.

### Validado

- `npx tsc --noEmit -p tsconfig.app.json`, suite completa de 76 pruebas y build de producción correctos.
- La validación manual con credenciales, correo OTP y DevTools queda pendiente por no contar con esas credenciales durante la fase.

### Corregido

- Se eliminó la regla de `.gitignore` que impedía versionar `AGENTS.md`, para que las instrucciones permanentes acompañen a futuros clones y agentes.

## 2026-08-11 - Plan General documental

### Añadido

- Se creó `docs/PlanGeneral.md` como documento maestro de planificación por Etapas y Fases.
- El plan enlaza la documentación histórica, registra estados y deja identificada la primera fase pendiente de Etapa 2.

## 2026-08-11 - Reorganizacion documental por Etapas

### Anadido

- Se adopta la organizacion `Etapa -> Fases -> Theory al cierre de la Etapa`.
- El historico existente queda bajo `docs/etapas/etapa-1/`.
- Se preparan `docs/etapas/etapa-2/fases/` y `docs/etapas/etapa-2/theory/`.

### Conservado

- No se modifico el contenido historico de las fases ni de la Theory.
- Esta reorganizacion es documental y no representa una fase funcional nueva.

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

## 2026-09-09 - Fase 09

### Corregido

- El buscador de Usuarios de Asignar Roles ahora usa la busqueda remota del Backend mediante `q` y elimina el filtrado local limitado a la pagina actual.
- Se agrego debounce de 350 ms y cancelacion de solicitudes anteriores con `switchMap`; al cambiar de pagina se conserva la consulta y una nueva busqueda reinicia en la pagina 0.
- El modelo `Usuario` incorpora `estado`, `nombre`, `ap` y `am`, y el directorio muestra login y nombre completo sin valores nulos.

### Verificado

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- 39 pruebas relacionadas aprobadas en 2 archivos.
- `npm run build`: correcto, con advertencias de presupuesto CSS ya existentes.
- `package-lock.json` sin cambios y `git diff --check` correcto.
