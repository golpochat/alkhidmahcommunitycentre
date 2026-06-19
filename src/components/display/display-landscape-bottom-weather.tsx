import type { WeatherPayload } from "@/lib/display-types";

interface DisplayLandscapeBottomWeatherProps {
  weather: WeatherPayload;
}

export function DisplayLandscapeBottomWeather({
  weather,
}: DisplayLandscapeBottomWeatherProps) {
  return (
    <aside
      className="display-bottom-bar-weather-block"
      aria-label="Weather"
    >
      <p className="display-bottom-bar-label display-bottom-bar-label-normal">
        {weather.description ?? "Weather"}
      </p>
      <p className="display-bottom-bar-value">
        {weather.temperature != null
          ? `${Math.round(weather.temperature)}°C`
          : "—"}
      </p>
    </aside>
  );
}
