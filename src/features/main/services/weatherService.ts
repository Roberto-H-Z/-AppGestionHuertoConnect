/**
 * Weather Service - Fetches weather data from Open-Meteo API.
 * Free, no API key required.
 * Uses expo-location for device geolocation.
 */

import * as Location from 'expo-location';

// ---- Types ----

export interface CurrentWeather {
    temperature: number;        // °C
    condition: string;          // Spanish description
    icon: string;               // MaterialCommunityIcons name
    humidity: number;           // %
    windSpeed: number;          // km/h
    precipitation: number;      // mm
    uvIndex: number;
    uvLabel: string;            // Bajo, Moderado, Alto, Muy Alto, Extremo
}

export interface DailyForecast {
    dayName: string;            // Lun, Mar, Mié, etc.
    icon: string;               // MaterialCommunityIcons name
    tempMax: number;
}

export interface WeatherData {
    current: CurrentWeather;
    forecast: DailyForecast[];
    locationName: string;
    lastUpdated: string;        // HH:MM AM/PM
}

// ---- WMO Weather Code Mapping ----

const wmoCodeToCondition: Record<number, { text: string; icon: string }> = {
    0: { text: 'Despejado', icon: 'weather-sunny' },
    1: { text: 'Mayormente despejado', icon: 'weather-sunny' },
    2: { text: 'Parcialmente nublado', icon: 'weather-partly-cloudy' },
    3: { text: 'Nublado', icon: 'weather-cloudy' },
    45: { text: 'Niebla', icon: 'weather-fog' },
    48: { text: 'Niebla helada', icon: 'weather-fog' },
    51: { text: 'Llovizna ligera', icon: 'weather-partly-rainy' },
    53: { text: 'Llovizna', icon: 'weather-rainy' },
    55: { text: 'Llovizna intensa', icon: 'weather-rainy' },
    61: { text: 'Lluvia ligera', icon: 'weather-partly-rainy' },
    63: { text: 'Lluvia', icon: 'weather-rainy' },
    65: { text: 'Lluvia intensa', icon: 'weather-pouring' },
    71: { text: 'Nieve ligera', icon: 'weather-snowy' },
    73: { text: 'Nieve', icon: 'weather-snowy' },
    75: { text: 'Nieve intensa', icon: 'weather-snowy-heavy' },
    80: { text: 'Chubascos ligeros', icon: 'weather-partly-rainy' },
    81: { text: 'Chubascos', icon: 'weather-rainy' },
    82: { text: 'Chubascos intensos', icon: 'weather-pouring' },
    95: { text: 'Tormenta', icon: 'weather-lightning' },
    96: { text: 'Tormenta con granizo', icon: 'weather-lightning-rainy' },
    99: { text: 'Tormenta fuerte con granizo', icon: 'weather-lightning-rainy' },
};

const getCondition = (code: number) =>
    wmoCodeToCondition[code] || { text: 'Desconocido', icon: 'weather-cloudy' };

const getUvLabel = (uv: number): string => {
    if (uv <= 2) return 'Bajo';
    if (uv <= 5) return 'Moderado';
    if (uv <= 7) return 'Alto';
    if (uv <= 10) return 'Muy Alto';
    return 'Extremo';
};

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ---- API Calls ----

export const fetchWeatherByLocation = async (): Promise<WeatherData> => {
    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Permiso de ubicación denegado');
    }

    const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    // Get location name (reverse geocode)
    let locationName = 'Tu ubicación';
    try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo) {
            locationName = geo.city || geo.subregion || geo.region || locationName;
        }
    } catch {
        // Fallback to default name
    }

    // Fetch from Open-Meteo
    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,uv_index` +
        `&daily=weather_code,temperature_2m_max&timezone=auto&forecast_days=7`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener datos del clima');

    const data = await response.json();

    // Parse current weather
    const currentCode = data.current.weather_code;
    const condition = getCondition(currentCode);
    const uvIndex = Math.round(data.current.uv_index || 0);

    const current: CurrentWeather = {
        temperature: Math.round(data.current.temperature_2m),
        condition: condition.text,
        icon: condition.icon,
        humidity: Math.round(data.current.relative_humidity_2m),
        windSpeed: Math.round(data.current.wind_speed_10m),
        precipitation: Math.round(data.current.precipitation * 10) / 10,
        uvIndex,
        uvLabel: getUvLabel(uvIndex),
    };

    // Parse 7-day forecast
    const forecast: DailyForecast[] = data.daily.time.map(
        (dateStr: string, i: number) => {
            const date = new Date(dateStr + 'T12:00:00');
            const code = data.daily.weather_code[i];
            return {
                dayName: dayNames[date.getDay()],
                icon: getCondition(code).icon,
                tempMax: Math.round(data.daily.temperature_2m_max[i]),
            };
        }
    );

    // Build last updated time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const lastUpdated = `${h12}:${minutes} ${ampm}`;

    return {
        current,
        forecast,
        locationName,
        lastUpdated,
    };
};
