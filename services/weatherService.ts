/**
 * Weather Service using OpenMeteo API (Free, No Key required)
 * https://open-meteo.com/
 */

export interface WeatherData {
    temp: number;
    condition: string;
    icon: string; // Material Symbol name
    description?: string;
    isNight?: boolean;
}

export interface ForecastDay {
    date: string; // YYYY-MM-DD
    tempMax: number;
    tempMin: number;
    condition: string;
    icon: string;
}

// WMO Weather interpretation codes (WW)
// https://open-meteo.com/en/docs
const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
    0: { label: 'Céu Limpo', icon: 'sunny' },
    1: { label: 'Predominantemente Ensolarado', icon: 'partly_cloudy_day' },
    2: { label: 'Parcialmente Nublado', icon: 'partly_cloudy_day' },
    3: { label: 'Encoberto', icon: 'cloud' },
    45: { label: 'Nevoeiro', icon: 'foggy' },
    48: { label: 'Nevoeiro com Geada', icon: 'foggy' },
    51: { label: 'Garoa Leve', icon: 'rainy_light' },
    53: { label: 'Garoa Moderada', icon: 'rainy' },
    55: { label: 'Garoa Densa', icon: 'rainy' },
    61: { label: 'Chuva Leve', icon: 'rainy_light' },
    63: { label: 'Chuva Moderada', icon: 'rainy' },
    65: { label: 'Chuva Forte', icon: 'rainy_heavy' },
    71: { label: 'Neve Leve', icon: 'weather_snowy' },
    73: { label: 'Neve Moderada', icon: 'weather_snowy' },
    75: { label: 'Neve Forte', icon: 'snowing_heavy' },
    77: { label: 'Granizo', icon: 'weather_hail' },
    80: { label: 'Pancadas de Chuva Leves', icon: 'rainy_light' },
    81: { label: 'Pancadas de Chuva Moderadas', icon: 'rainy' },
    82: { label: 'Pancadas de Chuva Violentas', icon: 'rainy_heavy' },
    95: { label: 'Tempestade', icon: 'thunderstorm' },
    96: { label: 'Tempestade com Granizo', icon: 'thunderstorm' },
    99: { label: 'Tempestade com Granizo Forte', icon: 'thunderstorm' },
};

// Simple cache to avoid spamming the API on re-renders
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const forecastCache = new Map<string, { data: ForecastDay[]; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export const weatherService = {
    /**
     * Get current weather for a city name by first geocoding it
     */
    async getCurrentWeather(cityName: string): Promise<WeatherData | null> {
        if (!cityName) return null;

        const cacheKey = `${cityName.toLowerCase()}_${new Date().toISOString().slice(0, 13)}`; // Hourly cache key basically
        const cached = weatherCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.data;
        }

        try {
            // 1. Geocode City
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                console.warn(`WeatherService: City not found: ${cityName}`);
                return null;
            }

            const { latitude, longitude } = geoData.results[0];

            // 2. Fetch Weather
            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&timezone=auto`
            );
            const weatherData = await weatherRes.json();

            if (!weatherData.current) {
                throw new Error('No current weather data in response');
            }

            const { temperature_2m, weather_code, is_day } = weatherData.current;
            const codeInfo = WEATHER_CODES[weather_code] || { label: 'Desconhecido', icon: 'question_mark' };

            // Adjust icon for night if needed (simple heuristic)
            let icon = codeInfo.icon;
            if (is_day === 0) {
                if (icon === 'sunny') icon = 'clear_night';
                if (icon === 'partly_cloudy_day') icon = 'partly_cloudy_night';
            }

            const result: WeatherData = {
                temp: Math.round(temperature_2m),
                condition: codeInfo.label,
                icon: icon,
                isNight: is_day === 0
            };

            weatherCache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;

        } catch (error) {
            console.error('WeatherService Error:', error);
            return null;
        }
    },

    /**
     * Get 7-day forecast for a city
     */
    async getForecast(cityName: string): Promise<ForecastDay[] | null> {
        if (!cityName) return null;

        const cacheKey = `forecast_${cityName.toLowerCase()}_${new Date().toISOString().slice(0, 10)}`;
        const cached = forecastCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.data;
        }

        try {
            // 1. Geocode City
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                console.warn(`WeatherService: City not found for forecast: ${cityName}`);
                return null;
            }

            const { latitude, longitude } = geoData.results[0];

            // 2. Fetch 7-day forecast
            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
            );
            const weatherData = await weatherRes.json();

            if (!weatherData.daily) {
                throw new Error('No daily forecast data in response');
            }

            const { time, weather_code, temperature_2m_max, temperature_2m_min } = weatherData.daily;

            const forecast: ForecastDay[] = time.map((date: string, i: number) => {
                const code = weather_code[i];
                const codeInfo = WEATHER_CODES[code] || { label: 'Desconhecido', icon: 'question_mark' };

                return {
                    date,
                    tempMax: Math.round(temperature_2m_max[i]),
                    tempMin: Math.round(temperature_2m_min[i]),
                    condition: codeInfo.label,
                    icon: codeInfo.icon,
                };
            });

            forecastCache.set(cacheKey, { data: forecast, timestamp: Date.now() });
            return forecast;

        } catch (error) {
            console.error('WeatherService Forecast Error:', error);
            return null;
        }
    }
};
