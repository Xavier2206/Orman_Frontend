# Fase 03 — Instalación y configuración de Tailwind CSS

Fecha de ejecución: 2026-07-22.

## 1. Objetivo

Integrar Tailwind CSS en Angular 22 mediante el procedimiento oficial vigente, comprobar que sus utilidades se procesan y documentar la configuración sin desarrollar todavía el sistema de temas ni la landing definitiva.

## 2. Alcance

La fase incluyó la revisión previa del proyecto, la consulta de documentación oficial, la instalación de Tailwind CSS 4 y su plugin PostCSS, una prueba visual neutra sobre la landing temporal, compilación, pruebas, comprobación HTTP y validación del CSS generado.

No se crearon temas, selector de temas, servicios, layouts, componentes nuevos, datos, formularios, nuevas rutas ni configuración tradicional de Tailwind. No se avanzó a la Fase 04.

## 3. Estado previo

- Angular CLI y Angular 22.0.7.
- TypeScript 6.0.3.
- Componentes standalone, ejecución zoneless y Angular Router.
- Vitest 4.1.10.
- CSS sin SCSS.
- Landing temporal en `features/public/landing`.
- Tailwind no figuraba como dependencia directa.
- No existía configuración PostCSS ni `tailwind.config.js`.
- La compilación previa terminó correctamente con 189.17 kB iniciales y 0 bytes de estilos globales.

## 4. Procedimiento oficial utilizado

Se consultaron las guías oficiales vigentes de [Angular](https://angular.dev/guide/tailwind) y [Tailwind CSS](https://tailwindcss.com/docs/installation/framework-guides/angular).

Angular recomienda primero:

```powershell
ng add tailwindcss
```

Se simuló el comando con `npx ng add tailwindcss --dry-run --skip-confirmation`. Angular CLI 22.0.7 indicó `Package "tailwindcss" was found but does not support schematics`, por lo que no aplicó cambios.

Se usó entonces la alternativa manual publicada en la misma guía oficial:

```powershell
npm install --save-dev tailwindcss @tailwindcss/postcss postcss
```

Después se creó la configuración PostCSS y se añadió la importación global. No se usó `--force`, no se fijó Tailwind 3 y no se instaló Autoprefixer manualmente.

## 5. Paquetes instalados y versiones

Dependencias de desarrollo directas:

- `tailwindcss`: 4.3.3.
- `@tailwindcss/postcss`: 4.3.3.
- `postcss`: 8.5.22.

npm añadió 11 paquetes transitivos y cambió 1 paquete del árbol instalado.

## 6. Archivos creados

- `.postcssrc.json`.
- `docs/etapas/etapa-1/fases/03-configuracion-tailwind.md`.
- `docs/etapas/etapa-1/theory/03-tailwind-css.md`.

## 7. Archivos modificados

- `package.json`.
- `package-lock.json`.
- `src/styles.css`.
- `src/app/features/public/landing/landing.component.ts`.
- `src/app/features/public/landing/landing.component.html`.
- `README.md`.
- `docs/README.md`.
- `docs/CHANGELOG.md`.

Archivo eliminado:

- `src/app/features/public/landing/landing.component.css`. Toda la prueba temporal quedó expresada mediante utilidades Tailwind, por lo que conservarlo vacío no aportaba valor. También se retiró su referencia `styleUrl`.

## 8. Configuración PostCSS resultante

`.postcssrc.json` contiene el formato recomendado por Angular:

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

## 9. Importación global utilizada

`src/styles.css` contiene:

```css
@import 'tailwindcss';
```

No se añadieron las directivas del flujo de Tailwind 3.

## 10. Prueba visual temporal

La landing conserva exactamente el título `ORMAN` y el texto `Frontend público en construcción.`. Se aplicaron utilidades para altura mínima de pantalla, centrado, separación, relleno, fondo neutro, contraste y tipografía.

Entre las clases utilizadas están `min-h-screen`, `place-content-center`, `gap-3`, `bg-slate-100`, `text-slate-900`, `text-4xl` y `font-bold`. Esta presentación es solo una comprobación técnica y no representa el diseño final.

## 11. Comandos ejecutados

```powershell
node --version
npm --version
npx ng version
npm list tailwindcss --depth=0
npx ng build
npx ng add tailwindcss --dry-run --skip-confirmation
npm view tailwindcss version
npm view @tailwindcss/postcss version peerDependencies dependencies --json
npm view postcss version
npm install --save-dev tailwindcss @tailwindcss/postcss postcss
npm list tailwindcss @tailwindcss/postcss postcss --depth=0
npx ng build
npx ng test --watch=false
npx ng serve --host 127.0.0.1 --port 4200
Invoke-WebRequest -Uri 'http://127.0.0.1:4200/' -UseBasicParsing
npm audit --json
```

También se usaron comandos PowerShell y `rg` de solo lectura para inspeccionar archivos, configuraciones, SCSS, el CSS generado y el puerto temporal. No se ejecutaron comandos Git.

## 12. Resultado de compilación

La compilación final `npx ng build` terminó con código 0:

- Bundle inicial bruto: 194.29 kB.
- Transferencia inicial estimada: 54.32 kB.
- CSS global generado: 5.13 kB brutos y 1.58 kB estimados.
- Chunk diferido de la landing: 578 bytes.
- Salida: `dist/orman-frontend`.

## 13. Resultado de pruebas

`npx ng test --watch=false` terminó con código 0:

- Archivos de prueba: 2 aprobados.
- Pruebas: 5 aprobadas.
- Fallos: 0.

Continúan verificándose la creación del componente raíz, `router-outlet`, navegación a `/`, renderizado de la landing y sus dos textos. No fue necesario cambiar las aserciones porque no dependen de todas las clases visuales.

## 14. Comprobación de la ruta `/`

El servidor de desarrollo se inició en `127.0.0.1:4200`. Una solicitud a `/` devolvió HTTP 200 y `Content-Type: text/html`. La prueba de integración existente también navegó a `/` y encontró el contenido de la landing.

No había un navegador integrado disponible en la sesión para una captura visual automatizada. El servidor temporal fue detenido y el puerto 4200 quedó liberado.

## 15. Errores encontrados

1. La compilación previa dentro del sandbox no pudo leer rutas del proyecto y mostró `Access is denied`.
2. `ng add tailwindcss` no pudo ejecutar la integración porque Angular CLI 22.0.7 informó que el paquete detectado no soportaba schematics.
3. No había un navegador integrado disponible para inspección visual automatizada.

## 16. Soluciones aplicadas

1. La compilación se repitió con acceso autorizado fuera del sandbox y terminó correctamente.
2. Se aplicó la alternativa manual de la guía oficial de Angular, con los mismos tres paquetes, configuración PostCSS e importación global esperados.
3. La comprobación se realizó mediante la prueba de integración, HTTP 200 y análisis del CSS de producción.

El CSS compilado contiene, entre otras, estas reglas:

```css
.min-h-screen {
  min-height: 100vh;
}
.place-content-center {
  place-content: center;
}
.bg-slate-100 {
  background-color: var(--color-slate-100);
}
.text-4xl {
  font-size: var(--text-4xl);
  line-height: var(--tw-leading, var(--text-4xl--line-height));
}
.font-bold {
  --tw-font-weight: var(--font-weight-bold);
  font-weight: var(--font-weight-bold);
}
```

## 17. Vulnerabilidades reportadas por npm

`npm install` y `npm audit --json` reportaron 4 vulnerabilidades:

- 1 baja en una versión transitiva de `esbuild` usada por Vite.
- 3 moderadas relacionadas con `@angular/cli`, `@modelcontextprotocol/sdk` y `@hono/node-server`.
- 0 altas y 0 críticas.

No se ejecutó `npm audit fix` ni `npm audit fix --force`. El informe sugiere una solución mayor de Angular CLI que no corresponde aplicar dentro de esta fase sin evaluación específica.

## 18. Estado final

La Fase 03 está completada. ORMAN utiliza Tailwind CSS 4.3.3 mediante `@tailwindcss/postcss` y PostCSS 8.5.22. La landing temporal demuestra el procesamiento real de utilidades, la compilación y las pruebas pasan, y `/` responde correctamente.

No existe SCSS, `tailwind.config.js`, sistema de temas ni componentes adicionales. No se ejecutó ninguna operación Git ni se inspeccionó o modificó `.git`.

## 19. Próximo paso

Esperar autorización antes de iniciar la Fase 04. La siguiente fase podrá abordar el próximo incremento definido para ORMAN sin anticipar el sistema completo desde esta configuración técnica.
