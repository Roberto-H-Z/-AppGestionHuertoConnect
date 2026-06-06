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

// ── Fallback: base de datos local de ciudades mexicanas comunes ──────────
// Se usa si la API de geocodificación falla o no tiene el resultado.
const MEXICO_CITIES: Record<string, GeoLocation> = {
    'xalapa': { name: 'Xalapa', lat: 19.5438, lon: -96.9102, country: 'México', region: 'Veracruz' },
    'veracruz': { name: 'Veracruz', lat: 19.1738, lon: -96.1342, country: 'México', region: 'Veracruz' },
    'orizaba': { name: 'Orizaba', lat: 18.8503, lon: -97.1003, country: 'México', region: 'Veracruz' },
    'coatepec': { name: 'Coatepec', lat: 19.4517, lon: -96.9622, country: 'México', region: 'Veracruz' },
    'córdoba': { name: 'Córdoba', lat: 18.8839, lon: -96.9336, country: 'México', region: 'Veracruz' },
    'cordoba': { name: 'Córdoba', lat: 18.8839, lon: -96.9336, country: 'México', region: 'Veracruz' },
    'monterrey': { name: 'Monterrey', lat: 25.6866, lon: -100.3161, country: 'México', region: 'Nuevo León' },
    'guadalajara': { name: 'Guadalajara', lat: 20.6597, lon: -103.3496, country: 'México', region: 'Jalisco' },
    'ciudad de mexico': { name: 'Ciudad de México', lat: 19.4326, lon: -99.1332, country: 'México', region: 'CDMX' },
    'cdmx': { name: 'Ciudad de México', lat: 19.4326, lon: -99.1332, country: 'México', region: 'CDMX' },
    'merida': { name: 'Mérida', lat: 20.9674, lon: -89.5926, country: 'México', region: 'Yucatán' },
    'mérida': { name: 'Mérida', lat: 20.9674, lon: -89.5926, country: 'México', region: 'Yucatán' },
    'puebla': { name: 'Puebla', lat: 19.0414, lon: -98.2063, country: 'México', region: 'Puebla' },
    'oaxaca': { name: 'Oaxaca', lat: 17.0669, lon: -96.7203, country: 'México', region: 'Oaxaca' },
    'tijuana': { name: 'Tijuana', lat: 32.5027, lon: -117.0037, country: 'México', region: 'Baja California' },
    'leon': { name: 'León', lat: 21.1221, lon: -101.6824, country: 'México', region: 'Guanajuato' },
    'léon': { name: 'León', lat: 21.1221, lon: -101.6824, country: 'México', region: 'Guanajuato' },
    'culiacan': { name: 'Culiacán', lat: 24.7994, lon: -107.3879, country: 'México', region: 'Sinaloa' },
    'culiacán': { name: 'Culiacán', lat: 24.7994, lon: -107.3879, country: 'México', region: 'Sinaloa' },
    'acapulco': { name: 'Acapulco', lat: 16.8531, lon: -99.8237, country: 'México', region: 'Guerrero' },
    'cancun': { name: 'Cancún', lat: 21.1743, lon: -86.8466, country: 'México', region: 'Quintana Roo' },
    'cancún': { name: 'Cancún', lat: 21.1743, lon: -86.8466, country: 'México', region: 'Quintana Roo' },
    'hermosillo': { name: 'Hermosillo', lat: 29.0729, lon: -110.9559, country: 'México', region: 'Sonora' },
    'chihuahua': { name: 'Chihuahua', lat: 28.6353, lon: -106.0889, country: 'México', region: 'Chihuahua' },
    'torreon': { name: 'Torreón', lat: 25.5428, lon: -103.4068, country: 'México', region: 'Coahuila' },
    'torreón': { name: 'Torreón', lat: 25.5428, lon: -103.4068, country: 'México', region: 'Coahuila' },
    'queretaro': { name: 'Querétaro', lat: 20.5888, lon: -100.3899, country: 'México', region: 'Querétaro' },
    'querétaro': { name: 'Querétaro', lat: 20.5888, lon: -100.3899, country: 'México', region: 'Querétaro' },
    'morelia': { name: 'Morelia', lat: 19.7060, lon: -101.1950, country: 'México', region: 'Michoacán' },
    'aguascalientes': { name: 'Aguascalientes', lat: 21.8853, lon: -102.2916, country: 'México', region: 'Aguascalientes' },
    'saltillo': { name: 'Saltillo', lat: 25.4232, lon: -100.9963, country: 'México', region: 'Coahuila' },
    'san luis potosi': { name: 'San Luis Potosí', lat: 22.1565, lon: -100.9855, country: 'México', region: 'San Luis Potosí' },
    'mexicali': { name: 'Mexicali', lat: 32.6245, lon: -115.4523, country: 'México', region: 'Baja California' },
    'villahermosa': { name: 'Villahermosa', lat: 17.9892, lon: -92.9475, country: 'México', region: 'Tabasco' },
    'tuxtla gutierrez': { name: 'Tuxtla Gutiérrez', lat: 16.7521, lon: -93.1167, country: 'México', region: 'Chiapas' },
    'tepic': { name: 'Tepic', lat: 21.5042, lon: -104.8948, country: 'México', region: 'Nayarit' },
    'durango': { name: 'Durango', lat: 24.0277, lon: -104.6532, country: 'México', region: 'Durango' },
    'colima': { name: 'Colima', lat: 19.2433, lon: -103.7241, country: 'México', region: 'Colima' },
    'cuernavaca': { name: 'Cuernavaca', lat: 18.9261, lon: -99.2319, country: 'México', region: 'Morelos' },
    'toluca': { name: 'Toluca', lat: 19.2826, lon: -99.6557, country: 'México', region: 'Estado de México' },
    'pachuca': { name: 'Pachuca', lat: 20.1011, lon: -98.7591, country: 'México', region: 'Hidalgo' },
    'guanajuato': { name: 'Guanajuato', lat: 21.0190, lon: -101.2574, country: 'México', region: 'Guanajuato' },
    'chilpancingo': { name: 'Chilpancingo', lat: 17.5535, lon: -99.5002, country: 'México', region: 'Guerrero' },
};

/**
 * Busca las coordenadas de un municipio o ciudad.
 * 1. Primero busca en la base de datos local (offline, instantáneo)
 * 2. Si no lo encuentra, consulta la API de Open-Meteo Geocoding
 *
 * @param municipio - Nombre del municipio (ej: "Xalapa", "Monterrey")
 * @returns GeoLocation con lat/lon o null si no se encontró
 */
export const geocodeMunicipio = async (municipio: string): Promise<GeoLocation | null> => {
    const key = municipio.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos para la búsqueda
        .toLowerCase();

    // 1. Buscar en base de datos local (con y sin acentos)
    const keyWithAccents = municipio.trim().toLowerCase();
    const localResult = MEXICO_CITIES[key] || MEXICO_CITIES[keyWithAccents];
    if (localResult) {
        console.log(`[geocode] Encontrado localmente: ${localResult.name}`);
        return localResult;
    }

    // 2. Consultar la API de Open-Meteo Geocoding
    try {
        const encoded = encodeURIComponent(municipio.trim());
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=5&language=es&format=json`;

        console.log(`[geocode] Consultando API para: ${municipio}`);
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`[geocode] API respondió con status: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            console.warn(`[geocode] API no encontró resultados para: ${municipio}`);
            return null;
        }

        // Preferir resultados de México
        const mexicoResult = data.results.find((r: any) => r.country_code === 'MX');
        const best = mexicoResult || data.results[0];

        console.log(`[geocode] API encontró: ${best.name}, ${best.admin1}, ${best.country}`);

        return {
            name: best.name,
            lat: best.latitude,
            lon: best.longitude,
            country: best.country || '',
            region: best.admin1 || undefined,
        };
    } catch (error) {
        console.warn('[geocode] Error en API, sin resultado:', error);
        return null;
    }
};
