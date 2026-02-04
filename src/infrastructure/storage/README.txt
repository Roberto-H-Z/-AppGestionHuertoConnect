📁 STORAGE - Persistencia Local
================================
Manejo de datos locales en el dispositivo.

- async-storage/  → Key-value storage (tokens, preferencias, cache)
- sqlite/         → Base de datos local (datos offline, sincronización)

Ejemplo:
- async-storage/authStorage.ts  → Guardar/obtener tokens
- async-storage/cacheStorage.ts → Cache de datos
- sqlite/database.ts            → Configuración SQLite
