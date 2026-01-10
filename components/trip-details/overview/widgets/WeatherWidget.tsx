import * as React from 'react';
import { Card } from '../../../ui/Base';

// =============================================================================
// Types
// =============================================================================

interface WeatherWidgetProps {
    cityName: string;
    countryCode?: string;
}

interface WeatherData {
    temp: number;
    condition: string;
    icon: string;
    humidity: number;
    forecast: { day: string; temp: number; icon: string }[];
}

// =============================================================================
// Mock Data (Replace with API integration later)
// =============================================================================

const getMockWeather = (cityName: string): WeatherData => {
    // Simple mock based on city name for demo
    const conditions = ['Ensolarado', 'Nublado', 'Chuvoso', 'Parcialmente nublado'];
    const icons = ['wb_sunny', 'cloud', 'rainy', 'partly_cloudy_day'];
    const randomIndex = Math.abs(cityName.charCodeAt(0) % 4);

    return {
        temp: 18 + Math.floor(Math.random() * 15),
        condition: conditions[randomIndex],
        icon: icons[randomIndex],
        humidity: 50 + Math.floor(Math.random() * 30),
        forecast: [
            { day: 'Seg', temp: 22, icon: 'wb_sunny' },
            { day: 'Ter', temp: 24, icon: 'partly_cloudy_day' },
            { day: 'Qua', temp: 20, icon: 'cloud' },
            { day: 'Qui', temp: 19, icon: 'rainy' },
            { day: 'Sex', temp: 23, icon: 'wb_sunny' },
        ]
    };
};

const getWeatherColor = (icon: string): string => {
    const colors: Record<string, string> = {
        'wb_sunny': 'bg-amber-100 text-amber-500',
        'partly_cloudy_day': 'bg-blue-100 text-blue-500',
        'cloud': 'bg-gray-100 text-gray-500',
        'rainy': 'bg-cyan-100 text-cyan-600',
        'thunderstorm': 'bg-purple-100 text-purple-600',
    };
    return colors[icon] || 'bg-gray-100 text-gray-500';
};

// =============================================================================
// WeatherWidget Component
// =============================================================================

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
    cityName,
    countryCode
}) => {
    const [weather, setWeather] = React.useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        // Simulate API call
        setIsLoading(true);
        const timer = setTimeout(() => {
            setWeather(getMockWeather(cityName));
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [cityName]);

    if (isLoading) {
        return (
            <Card className="p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                    <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-amber-100 rounded-full">
                        Clima
                    </span>
                </div>
                <div className="flex items-center justify-center py-8">
                    <div className="size-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </Card>
        );
    }

    if (!weather) return null;

    return (
        <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-amber-100 rounded-full">
                    Clima
                </span>
                <span className="text-[10px] text-text-muted">{cityName}</span>
            </div>

            {/* Current Weather */}
            <div className="flex items-center gap-4 mb-4">
                <div className={`size-14 rounded-xl flex items-center justify-center ${getWeatherColor(weather.icon)}`}>
                    <span className="material-symbols-outlined text-3xl">{weather.icon}</span>
                </div>
                <div>
                    <div className="flex items-start gap-1">
                        <span className="text-4xl font-black text-text-main">{weather.temp}</span>
                        <span className="text-lg text-text-muted">°C</span>
                    </div>
                    <p className="text-sm text-text-muted">{weather.condition}</p>
                </div>
            </div>

            {/* Humidity */}
            <div className="flex items-center gap-2 mb-4 text-xs text-text-muted">
                <span className="material-symbols-outlined text-sm">water_drop</span>
                <span>Umidade: {weather.humidity}%</span>
            </div>

            {/* Forecast */}
            <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] text-text-muted uppercase font-bold mb-2">Previsão</p>
                <div className="flex justify-between">
                    {weather.forecast.map((day, idx) => (
                        <div key={idx} className="text-center">
                            <p className="text-[10px] text-text-muted mb-1">{day.day}</p>
                            <span className={`material-symbols-outlined text-lg ${day.icon === 'wb_sunny' ? 'text-amber-500' :
                                    day.icon === 'rainy' ? 'text-cyan-500' :
                                        'text-gray-400'
                                }`}>
                                {day.icon}
                            </span>
                            <p className="text-xs font-bold text-text-main">{day.temp}°</p>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default WeatherWidget;
