📁 PORTS - Puertos (Interfaces)
================================
Define los contratos entre el core y el mundo exterior.

- in/   → Puertos de entrada (casos de uso que expone el core)
- out/  → Puertos de salida (interfaces que el core necesita)

Ejemplo:
- in/IGardenService.ts    → Interface del servicio de huertos
- out/IGardenRepository.ts → Interface del repositorio
- out/IWeatherService.ts   → Interface para API del clima
- out/IAIService.ts        → Interface para servicios de IA
