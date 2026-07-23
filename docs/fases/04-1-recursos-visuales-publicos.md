# Fase 04.1 — Estructura de recursos visuales públicos

Fecha de ejecución: 2026-07-22.

## 1. Objetivo

Crear y documentar la estructura mínima para almacenar imágenes públicas del frontend de ORMAN, incluidos recursos de marca, hero, propiedades y reemplazos visuales.

## 2. Alcance

La fase incluye exclusivamente carpetas bajo `public/images/`, archivos README internos y documentación del proyecto. No incluye imágenes reales o artificiales, diseño de interfaz, integración visual, datos simulados, conversión u optimización automática, descargas, API, backend, paquetes, rutas, temas ni cambios en la landing.

## 3. Motivo de usar `public/images`

Angular sirve directamente el contenido de `public/`. Centralizar los recursos visuales en `public/images/` permite referenciarlos con rutas públicas estables desde la raíz y evita rutas relativas acopladas a la ubicación de cada componente.

## 4. Estructura creada

```text
public/
└── images/
    ├── README.md
    ├── brand/
    │   └── README.md
    ├── hero/
    │   └── README.md
    ├── properties/
    │   └── README.md
    └── placeholders/
        └── README.md
```

No se crearon otras carpetas ni archivos con extensiones de imagen.

## 5. Función de cada carpeta

- `brand/`: logotipo principal, variantes horizontales o verticales, isotipo, versiones claras y oscuras y otros recursos de identidad.
- `hero/`: fotografías, composiciones y fondos de la portada pública.
- `properties/`: fotografías de casas, edificios, departamentos, tiendas, oficinas, garajes y sus ambientes.
- `placeholders/`: reemplazos para propiedades sin fotografía, hero temporal y estados de carga o sustitución visual.

`properties/` no contiene subcarpetas por propiedad en esta fase.

## 6. Convenciones de nombres

- Usar minúsculas.
- Separar palabras con guiones medios.
- No usar espacios ni tildes.
- Elegir nombres descriptivos y estables.
- Evitar nombres ambiguos o de versiones temporales como `imagen1.jpg`, `foto-final-final.png` y `nuevo-logo2.png`.

Ejemplos válidos:

- `orman-logo.svg`
- `edificio-orman-frente.webp`
- `departamento-02-sala.webp`
- `tienda-camargo-fachada.webp`
- `property-placeholder.svg`

Nombres previstos para futuros recursos de marca, sin crear los archivos en esta fase:

- `orman-logo.svg`
- `orman-logo-horizontal.svg`
- `orman-logo-light.svg`
- `orman-logo-dark.svg`
- `orman-isotype.svg`

## 7. Formatos recomendados

- SVG para logotipos e íconos vectoriales.
- WebP o AVIF para fotografías.
- PNG únicamente cuando se necesite transparencia y SVG no sea apropiado.
- JPG solo cuando sea necesario por compatibilidad.

Cada imagen debe optimizarse antes de incorporarla. Esta fase no convierte ni optimiza recursos.

## 8. Uso desde Angular

Los recursos se referencian en plantillas con rutas absolutas desde la raíz:

```html
<img src="/images/brand/orman-logo.svg" alt="ORMAN" />

<img
  src="/images/properties/departamento-02-sala.webp"
  alt="Sala del Departamento 2"
/>
```

No se deben usar rutas como `../../../../public/images/`. Tampoco se deben importar imágenes públicas desde TypeScript salvo que exista una razón técnica específica.

## 9. Accesibilidad

- Toda imagen informativa debe tener un texto `alt` descriptivo.
- Las imágenes decorativas deben usar `alt=""`.
- La información importante no debe transmitirse únicamente mediante imágenes.

## 10. Privacidad

- No publicar fotografías con documentos, placas, rostros o datos personales sin autorización.
- Evitar metadatos de ubicación sensibles.
- No incluir credenciales ni información privada en archivos o nombres.

## 11. Archivos creados

- `public/images/README.md`.
- `public/images/brand/README.md`.
- `public/images/hero/README.md`.
- `public/images/properties/README.md`.
- `public/images/placeholders/README.md`.
- `docs/fases/04-1-recursos-visuales-publicos.md`.

## 12. Archivos modificados

- `README.md`.
- `docs/README.md`.
- `docs/CHANGELOG.md`.

No se eliminó ningún archivo.

## 13. Comandos ejecutados

Se usaron comandos de PowerShell para crear y comprobar directorios, leer documentación, enumerar archivos y buscar SCSS. Las validaciones funcionales ejecutadas fueron:

```powershell
npx ng build
npx ng test --watch=false
```

Ambos comandos se intentaron primero dentro del sandbox y se repitieron con acceso autorizado debido a restricciones de lectura del entorno. No se instaló ningún paquete, no se ejecutó ningún comando Git y no se inspeccionó `.git`.

## 14. Resultado de compilación

`npx ng build` terminó con código 0 al ejecutarse con el acceso de lectura necesario:

- Total inicial: 224.32 kB brutos y 62.24 kB estimados.
- CSS global: 18.86 kB brutos y 3.96 kB estimados.
- Chunk diferido del layout: 9.00 kB brutos y 2.27 kB estimados.
- Chunk diferido de la landing: 4.72 kB brutos y 1.34 kB estimados.
- Salida: `dist/orman-frontend`.

El primer intento dentro del sandbox no pudo resolver `src/main.ts` ni `src/styles.css` porque el entorno bloqueó la lectura de rutas superiores. No fue un error del código y no requirió cambios en la aplicación.

## 15. Resultado de pruebas

`npx ng test --watch=false` terminó con código 0 al ejecutarse con el acceso de lectura necesario:

- 8 archivos de prueba aprobados.
- 29 pruebas aprobadas.
- 0 fallos.

El primer intento dentro del sandbox no pudo resolver los archivos de prueba ni las dependencias existentes de Angular por la misma restricción de lectura. La repetición autorizada confirmó que la suite permanece estable.

## 16. Estado final

La estructura documental de recursos visuales públicos queda preparada y validada:

- Existen las cinco carpetas previstas.
- Cada carpeta contiene su `README.md`.
- No existen subcarpetas adicionales bajo `public/images/`.
- No se crearon imágenes reales, artificiales ni archivos vacíos con extensiones de imagen.
- No se instalaron paquetes.
- No se creó SCSS.
- No se ejecutó Git ni se inspeccionó `.git`.
- La compilación y las pruebas concluyeron correctamente.
- No hubo cambios funcionales ni se avanzó a una fase posterior.

## 17. Próximo paso

Esperar autorización expresa antes de integrar recursos visuales o iniciar otra fase.
