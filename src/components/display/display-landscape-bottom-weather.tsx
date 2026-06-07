import type { WeatherPayload } from "@/lib/display-types";

interface DisplayLandscapeBottomWeatherProps {
  weather: WeatherPayload;
}

export function DisplayLandscapeBottomWeather({
  weather,
}: DisplayLandscapeBottomWeatherProps) {
  return (
    <aside className="display-landscape-weather-block" aria-label="Weather">
      <p className="display-weather-widget-label">Weather</p>
      <div className="display-landscape-weather-body">
        <p className="display-weather-widget-temp">
          {weather.temperature != null
            ? `${Math.round(weather.temperature)}°C`
            : "—"}
        </p>
        {weather.description ? (
          <p className="display-weather-widget-desc">{weather.description}</p>
        ) : null}
        {weather.windSpeed != null ? (
          <p className="display-weather-widget-wind">
            Wind {Math.round(weather.windSpeed)} km/h
          </p>
        ) : null}
      </div>
    </aside>
  );
}
