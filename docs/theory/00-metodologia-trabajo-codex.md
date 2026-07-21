# Metodología de trabajo con Codex

## Propósito

ORMAN se construye por fases pequeñas, verificables y expresamente autorizadas. Esta metodología reduce cambios accidentales, evita arquitectura prematura y mantiene la documentación alineada con el software real.

## Flujo de una fase

Antes de modificar archivos se presenta el objetivo, alcance, archivos afectados, comandos, riesgos y resultado esperado. La ejecución comienza solo después de la autorización del responsable del proyecto.

Durante la fase se aplican únicamente los cambios aprobados. Si aparece un problema, primero se inspecciona su causa y se selecciona la solución de menor alcance. No se amplía la fase para implementar funciones futuras.

Al terminar se registran:

1. Archivos creados, modificados o eliminados.
2. Comandos ejecutados.
3. Resultados de compilación y pruebas.
4. Errores y soluciones.
5. Estado final y siguiente fase recomendada.

## Principios aplicados

- No avanzar automáticamente entre fases.
- No sobrescribir contenido sin comprobar previamente el destino.
- No usar comandos destructivos.
- No realizar commits sin autorización.
- Mantener separados el frontend y el backend.
- Instalar dependencias solo cuando pertenecen al alcance aprobado.
- Documentar hechos realizados, no funciones planeadas como si ya existieran.
- Conservar pruebas y validar cada cambio en proporción a su riesgo.
- Crear carpetas, componentes y servicios cuando tengan una responsabilidad actual.

## Responsabilidades

Codex inspecciona, propone, implementa y verifica dentro del alcance autorizado. La persona responsable del proyecto decide cuándo comienza cada fase y aprueba cualquier ampliación relevante.

Esta separación hace que las decisiones técnicas sean revisables y que el estado del repositorio permanezca comprensible en todo momento.
