import "server-only";

export type WeatherCondition = { label: string; icon: WeatherIconName };
export type WeatherIconName =
  | "sun"
  | "cloud-sun"
  | "cloud"
  | "cloud-fog"
  | "cloud-drizzle"
  | "cloud-rain"
  | "cloud-snow"
  | "cloud-lightning";

// WMO weather codes, as returned by Open-Meteo. https://open-meteo.com/en/docs
export function describeWeatherCode(code: number): WeatherCondition {
  if (code === 0) return { label: "Clear sky", icon: "sun" };
  if (code === 1 || code === 2) return { label: "Partly cloudy", icon: "cloud-sun" };
  if (code === 3) return { label: "Overcast", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Fog", icon: "cloud-fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "cloud-drizzle" };
  if (code >= 61 && code <= 67) return { label: "Rain", icon: "cloud-rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", icon: "cloud-snow" };
  if (code >= 80 && code <= 82) return { label: "Rain showers", icon: "cloud-rain" };
  if (code >= 85 && code <= 86) return { label: "Snow showers", icon: "cloud-snow" };
  if (code >= 95) return { label: "Thunderstorm", icon: "cloud-lightning" };
  return { label: "Unknown", icon: "cloud" };
}

export type CurrentWeather = {
  temperatureC: number;
  windKph: number;
  condition: WeatherCondition;
};

// Open-Meteo's forecast API needs no API key.
export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeather | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current;
    if (!current) return null;
    return {
      temperatureC: current.temperature_2m,
      windKph: current.wind_speed_10m,
      condition: describeWeatherCode(current.weather_code),
    };
  } catch {
    return null;
  }
}
