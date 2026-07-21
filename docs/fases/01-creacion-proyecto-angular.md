# Fase 01 — Creación del proyecto Angular

Fecha de ejecución: 2026-07-21.

## Objetivo

Crear desde cero el proyecto `orman-frontend` con Angular 22, componentes standalone, Angular Router, CSS, ejecución zoneless, tipado estricto, Git y pruebas unitarias predeterminadas.

## Alcance

La fase incluyó el scaffolding de Angular CLI, la instalación de sus dependencias, la inicialización de Git, la comprobación de la estructura generada, la compilación, las pruebas y la documentación inicial.

No se instaló Tailwind CSS y no se crearon la landing, temas, datos simulados ni carpetas de arquitectura futuras.

## Comando ejecutado

```powershell
ng new orman-frontend --routing=true --style=css --standalone=true --ssr=false --zoneless=true --strict=true --package-manager=npm --test-runner=vitest --skip-tests=false --skip-git=false --commit=false --ai-config=none --file-name-style-guide=2016 --defaults
```

## Opciones utilizadas

- `--routing=true`: habilitó Angular Router.
- `--style=css`: seleccionó CSS y descartó SCSS.
- `--standalone=true`: creó una aplicación sin NgModules raíz.
- `--ssr=false`: no añadió SSR ni prerenderizado.
- `--zoneless=true`: no añadió `zone.js` como dependencia directa de la aplicación.
- `--strict=true`: habilitó comprobaciones estrictas de TypeScript y plantillas.
- `--package-manager=npm`: seleccionó npm.
- `--test-runner=vitest`: configuró Vitest.
- `--skip-tests=false`: conservó los archivos de prueba.
- `--skip-git=false`: solicitó la inicialización de Git.
- `--commit=false`: impidió el commit inicial automático.
- `--ai-config=none`: evitó configuraciones adicionales para asistentes.
- `--file-name-style-guide=2016`: mantuvo nombres explícitos como `app.component.ts`.
- `--defaults`: evitó preguntas interactivas.

No se utilizó `--force`.

## Archivos y carpetas generados

Angular CLI generó:

```text
.vscode/
public/
└── favicon.ico
src/
├── app/
│   ├── app.component.css
│   ├── app.component.html
│   ├── app.component.spec.ts
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── index.html
├── main.ts
└── styles.css
.editorconfig
.gitignore
.prettierrc
angular.json
package.json
tsconfig.app.json
tsconfig.json
tsconfig.spec.json
```

La instalación añadió `package-lock.json` y `node_modules/`. La compilación añadió `dist/`. La fase añadió `.git/` y la documentación bajo `docs/`.

## Versiones finales instaladas

- Node.js: 24.18.0.
- npm: 11.16.0.
- Angular CLI: 22.0.7.
- Angular Core: 22.0.7.
- Angular Router: 22.0.7.
- TypeScript: 6.0.3.
- RxJS: 7.8.2.
- Vitest: 4.1.10.

## Comandos adicionales ejecutados

```powershell
npm install
git init
npm list @angular/core @angular/cli @angular/router typescript vitest rxjs --depth=0
npm run build
npm test -- --watch=false
git status --short --branch
```

También se emplearon comandos PowerShell de solo lectura para validar la ruta, la ausencia del directorio de destino, la estructura y la configuración.

## Resultado de compilación

`npm run build` finalizó con código 0. Se generó el bundle de producción en `dist/orman-frontend` con un tamaño inicial bruto de 214.72 kB y una transferencia estimada de 58.91 kB.

## Resultado de pruebas

`npm test -- --watch=false` finalizó con código 0:

- Archivos de prueba: 1 aprobado.
- Pruebas: 2 aprobadas.
- Fallos: 0.

## Errores encontrados

1. El proceso inicial de `ng new` alcanzó el límite de 120 segundos durante `Installing packages (npm)`. La estructura ya se había generado, pero aún no existían `node_modules`, `package-lock.json` ni `.git`.
2. Un primer `npm install` dentro del sandbox agotó el tiempo sin descargar dependencias.
3. La primera compilación dentro del sandbox recibió `Access is denied` al resolver `src/main.ts` y `src/styles.css`.
4. npm informó cuatro vulnerabilidades transitivas: una baja y tres moderadas.
5. npm advirtió que cinco dependencias tienen scripts de instalación pendientes de aprobación según su política `allowScripts`.

## Soluciones aplicadas

1. Se comprobó el estado parcial antes de continuar y no se repitió `ng new`, evitando sobrescrituras y el uso de `--force`.
2. Se completó la instalación con `npm install` y acceso de red autorizado.
3. Como el CLI no alcanzó su paso final, se ejecutó `git init` manualmente. No se creó ningún commit.
4. La compilación y las pruebas se repitieron fuera de la restricción de lectura del sandbox y finalizaron correctamente.
5. No se ejecutó `npm audit fix` ni se aprobaron scripts automáticamente, para evitar cambios de dependencias no evaluados o incompatibles con el alcance.

## Estado final

La Fase 01 está completada. El proyecto Angular compila, sus pruebas pasan, Git está inicializado sin commits y la documentación refleja el estado real. Tailwind y las funcionalidades de la landing no existen todavía.

## Próximo paso recomendado

Fase 02 — Estructura base del frontend: organizar progresivamente la aplicación y preparar la ruta pública `/`, únicamente después de recibir autorización expresa.
