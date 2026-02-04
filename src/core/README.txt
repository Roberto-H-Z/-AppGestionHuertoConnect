📁 CORE - Núcleo de Negocio (Arquitectura Hexagonal)
====================================================
Contiene la lógica de negocio PURA, sin dependencias externas.

- domain/     → Entidades y objetos de valor del dominio
- ports/      → Interfaces (contratos) de entrada y salida
- use-cases/  → Casos de uso de la aplicación

⚠️ REGLA IMPORTANTE: Este directorio NO debe importar nada de 
infrastructure/ ni de features/. Solo TypeScript puro.
