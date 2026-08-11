# Fase 02 — Estructura base del frontend

Fecha de ejecución: 2026-07-21.

## 1. Objetivo

Organizar la base Angular de ORMAN con una estructura modular por funcionalidades, configurar la ruta pública `/` y comprobarla mediante una landing mínima, sin implementar el diseño definitivo ni instalar Tailwind CSS.

## 2. Alcance

La fase incluyó la revisión de la base generada por Angular, la creación de la funcionalidad pública inicial, la simplificación del componente raíz, la configuración del enrutamiento, las pruebas unitarias y de integración, y la actualización documental.

No se crearon temas, selector de tema, header, hero, tarjetas, datos simulados, servicios, modelos, formularios, layouts sin uso, SCSS ni configuración de Tailwind. No se instalaron paquetes y no se avanzó a la Fase 03.

## 3. Estructura anterior

```text
src/app/
├── app.component.css
├── app.component.html
├── app.component.spec.ts
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

`app.routes.ts` no contenía rutas y `app.component.html` conservaba la plantilla de bienvenida generada por Angular.

## 4. Estructura final

```text
src/app/
├── features/
│   └── public/
│       └── landing/
│           ├── landing.component.css
│           ├── landing.component.html
│           ├── landing.component.spec.ts
│           └── landing.component.ts
├── app.component.css
├── app.component.html
├── app.component.spec.ts
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

No se crearon `core`, `shared` ni `layouts` porque todavía no contienen responsabilidades reales.

## 5. Decisiones arquitectónicas

- Organización por funcionalidad, con la landing dentro de `features/public/landing`.
- Componentes standalone, en continuidad con la configuración inicial de Angular.
- Ruta raíz declarada con `path: ''` y `loadComponent` para carga diferida.
- Componente raíz sin estado ni diseño: solo actúa como contenedor de `router-outlet`.
- Landing temporal autocontenida con HTML y CSS mínimos.
- Ausencia deliberada de `public-layout`: una sola vista temporal no justifica todavía esa abstracción.
- Creación progresiva de `core`, `shared` y `layouts` únicamente cuando tengan archivos de uso real.

## 6. Archivos creados

- `src/app/features/public/landing/landing.component.ts`
- `src/app/features/public/landing/landing.component.html`
- `src/app/features/public/landing/landing.component.css`
- `src/app/features/public/landing/landing.component.spec.ts`
- `docs/etapas/etapa-1/fases/02-estructura-frontend.md`
- `docs/etapas/etapa-1/theory/02-estructura-modular-frontend.md`

## 7. Archivos modificados

- `src/app/app.component.ts`
- `src/app/app.component.html`
- `src/app/app.component.spec.ts`
- `src/app/app.routes.ts`
- `README.md`
- `docs/README.md`
- `docs/CHANGELOG.md`

No se eliminaron archivos.

## 8. Comandos ejecutados

Se utilizaron comandos PowerShell de solo lectura para inspeccionar archivos y estructura, además de:

```powershell
npx ng build
npx ng test --watch=false
.\node_modules\.bin\ng.cmd serve --host 127.0.0.1 --port 4200
Invoke-WebRequest -Uri 'http://127.0.0.1:4200/' -UseBasicParsing
```

La compilación y las pruebas se repitieron fuera del sandbox después de encontrar una restricción ambiental de acceso. Las pruebas se ejecutaron nuevamente después de añadir la comprobación integrada de la ruta raíz.

No se ejecutó ningún comando Git.

## 9. Pruebas realizadas

- Creación del componente raíz.
- Presencia de `router-outlet` en el componente raíz.
- Navegación integrada a `/` y renderizado de la landing.
- Creación de `LandingComponent`.
- Renderizado del título `ORMAN` y del texto `Frontend público en construcción.`.
- Compilación de producción con la landing como chunk diferido.
- Inicio del servidor de desarrollo y respuesta HTTP 200 de `/`.

Resultado final: 2 archivos de prueba aprobados, 5 pruebas aprobadas y 0 fallos.

## 10. Errores encontrados

1. El primer `npx ng build` dentro del sandbox no pudo leer rutas del propio proyecto y mostró `Access is denied`.
2. El primer servidor de desarrollo iniciado dentro del sandbox no llegó a responder en el puerto 4200.
3. La sesión no ofreció un navegador integrado disponible para una inspección visual automatizada.

## 11. Soluciones aplicadas

1. La compilación y las pruebas se repitieron con acceso autorizado fuera de la restricción del sandbox; ambas finalizaron con código 0.
2. El servidor se reinició fuera del sandbox, generó correctamente los bundles y respondió HTTP 200 en `/`.
3. La carga real de la vista se verificó con una prueba de integración del router que navega a `/` y comprueba el contenido renderizado. Esta validación complementa la respuesta HTTP del servidor.

## 12. Estado final

La Fase 02 está completada. ORMAN tiene una primera funcionalidad pública organizada por dominio, la ruta `/` carga de forma diferida una landing mínima y el componente raíz funciona solamente como contenedor del router. La compilación y todas las pruebas pasan.

No se instalaron paquetes, Tailwind CSS ni SCSS. No se crearon carpetas vacías o layouts sin uso. No se ejecutaron operaciones Git ni se inspeccionó o modificó `.git`.

## 13. Próximo paso recomendado

Esperar autorización antes de iniciar la Fase 03. Una fase posterior podrá abordar el siguiente incremento visual o técnico definido para ORMAN, sin anticiparlo desde esta fase.
