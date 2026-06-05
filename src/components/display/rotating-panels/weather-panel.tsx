import type { WeatherPayload } from "@/lib/display-types";

interface WeatherPanelProps {
  weather: WeatherPayload;
}

export function WeatherPanel({ weather }: WeatherPanelProps) {
  return (
    <div className="display-rotating-panel display-rotating-panel-weather">
      <h3 className="display-rotating-panel-title">Local Weather</h3>
      <p className="display-weather-temp">
        {weather.temperature != null ? `${Math.round(weather.temperature)}°C` : "—"}
      </p>
      <p className="display-weather-desc">{weather.description}</p>
      {weather.windSpeed != null && (
        <p className="display-weather-wind">
          Wind {Math.round(weather.windSpeed)} km/h
        </p>
      )}
      <p className="display-weather-location">Clondalkin, Dublin</p>
    </div>
  );
}
