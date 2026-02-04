📁 API - Cliente HTTP
=====================
Configuración del cliente HTTP para tu microservicio Node.js.

- client.ts    → Instancia de Axios/Fetch configurada con baseURL, interceptors
- endpoints/   → Funciones organizadas por recurso

Ejemplo:
- endpoints/auth.ts     → login(), register(), logout()
- endpoints/gardens.ts  → getGardens(), createGarden()
- endpoints/plants.ts   → getPlants(), addPlant()
