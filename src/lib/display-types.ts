export interface SerializedDisplayNotice {
  id: string;
  title: string;
  message: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface WeatherPayload {
  temperature: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  description: string;
}
