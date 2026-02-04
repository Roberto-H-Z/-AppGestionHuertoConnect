📁 REPOSITORIES - Implementación de Puertos
============================================
Implementan las interfaces definidas en core/ports/out.

Conectan el core con las fuentes de datos reales.

Ejemplo:
- GardenRepository.ts   → Implementa IGardenRepository
- PlantRepository.ts    → Implementa IPlantRepository
- WeatherService.ts     → Implementa IWeatherService
- AIService.ts          → Implementa IAIService

⚠️ Cada repositorio DEBE implementar una interface de ports/out
