/**
 * Geocoding Service — Convierte nombre de municipio a coordenadas (lat/lon)
 * Usa la API gratuita de Open-Meteo Geocoding (sin API key).
 * Documentación: https://open-meteo.com/en/docs/geocoding-api
 */

export interface GeoLocation {
    name: string;
    lat: number;
    lon: number;
    country: string;
    region?: string;
}

/**
 * Busca las coordenadas de un municipio o ciudad.
 * @param municipio - Nombre del municipio (ej: "Xalapa", "Monterrey", "Ciudad de México")
 * @returns GeoLocation con lat/lon o null si no se encontró
 */
export const geocodeMunicipio = async (municipio: string): Promise<GeoLocation | null> => {
    try {
        const encoded = encodeURIComponent(municipio.trim());
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=5&language=es&format=json`;

        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) return null;

        const data = await response.json();
        if (!data.results || data.results.length === 0) return null;

        // Preferir resultados de México (country_code: "MX")
        const mexicoResult = data.results.find((r: any) => r.country_code === 'MX');
        const best = mexicoResult || data.results[0];

        return {
            name: best.name,
            lat: best.latitude,
            lon: best.longitude,
            country: best.country || '',
            region: best.admin1 || undefined,
        };
    } catch (error) {
        console.warn('[geocodeMunicipio] Error:', error);
        return null;
    }
};
