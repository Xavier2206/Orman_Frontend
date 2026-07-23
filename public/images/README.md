# Imágenes públicas

Este directorio reúne los recursos visuales públicos de ORMAN:

- `brand/`: logotipos, isotipos y recursos de identidad visual.
- `hero/`: fotografías, composiciones y fondos de portada.
- `properties/`: fotografías de propiedades y sus ambientes.
- `placeholders/`: reemplazos visuales y estados sin imagen.

## Convención de nombres

Usar nombres descriptivos en minúsculas, con guiones medios, sin espacios ni tildes. Evitar nombres ambiguos o versionados como `imagen1.jpg`, `foto-final-final.png` y `nuevo-logo2.png`.

Ejemplos correctos: `orman-logo.svg`, `edificio-orman-frente.webp`, `departamento-02-sala.webp`, `tienda-camargo-fachada.webp` y `property-placeholder.svg`.

## Formatos

- SVG para logotipos e íconos vectoriales.
- WebP o AVIF para fotografías.
- PNG solo cuando se necesite transparencia y SVG no sea apropiado.
- JPG solo cuando sea necesario por compatibilidad.

Optimizar cada recurso antes de incorporarlo. No guardar información sensible, credenciales ni datos privados en archivos, metadatos o nombres.

## Uso desde Angular

Los archivos de `public/` se referencian desde las plantillas con rutas absolutas desde la raíz:

```html
<img src="/images/brand/orman-logo.svg" alt="ORMAN" />

<img
  src="/images/properties/departamento-02-sala.webp"
  alt="Sala del Departamento 2"
/>
```

No usar rutas como `../../../../public/images/` ni importar recursos públicos desde TypeScript, salvo que exista una razón técnica específica.

## Accesibilidad y privacidad

- Toda imagen informativa debe tener un `alt` descriptivo.
- Las imágenes decorativas deben usar `alt=""`.
- No usar únicamente imágenes para transmitir información importante.
- No publicar documentos, placas, rostros o datos personales sin autorización.
- Eliminar o evitar metadatos de ubicación sensibles.
- No incluir credenciales ni información privada en los nombres de archivo.

