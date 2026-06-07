import type { WeatherPayload } from "@/lib/display-types";
import { formatPrayerTime24h } from "@/lib/prayer-times-client";

interface DisplayWeatherWidgetProps {
  weather: WeatherPayload;
  sunrise?: string | null;
  variant?: "default" | "landscape-footer";
}

export function DisplayWeatherWidget({
  weather,
  sunrise,
  variant = "default",
}: DisplayWeatherWidgetProps) {
  const widgetClass =
    variant === "landscape-footer"
      ? "display-weather-widget display-weather-widget-footer"
      : "display-weather-widget";

  return (
    <aside className={widgetClass} aria-label="Weather and sunrise">
      <p className="display-weather-widget-label">Weather</p>
      <p className="display-weather-widget-temp">
        {weather.temperature != null ? `${Math.round(weather.temperature)}°C` : "—"}
      </p>
      <p className="display-weather-widget-desc">{weather.description}</p>
      {weather.windSpeed != null && (
        <p className="display-weather-widget-wind">
          Wind {Math.round(weather.windSpeed)} km/h
        </p>
      )}
      {sunrise && (
        <div className="display-weather-widget-sunrise-row">
          <p className="display-weather-widget-label">Sunrise</p>
          <p className="display-weather-widget-sunrise-time">
            {formatPrayerTime24h(sunrise)}
          </p>
        </div>
      )}
    </aside>
  );
}
