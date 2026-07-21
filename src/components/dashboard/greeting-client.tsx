"use client";

import { useEffect, useState } from "react";
import { Sunrise, Sun, Sunset, Moon, type LucideIcon } from "lucide-react";
import { WEATHER_ICONS } from "@/lib/weather-icons";
import type { WeatherIconName } from "@/lib/weather";

export type GreetingWeather = {
  label: string;
  temperatureC: number;
  conditionLabel: string;
  icon: WeatherIconName;
} | null;

function greetingFor(hour: number): { text: string; Icon: LucideIcon } {
  if (hour < 5) return { text: "Burning the midnight oil", Icon: Moon };
  if (hour < 12) return { text: "Good morning", Icon: Sunrise };
  if (hour < 17) return { text: "Good afternoon", Icon: Sun };
  if (hour < 21) return { text: "Good evening", Icon: Sunset };
  return { text: "Good night", Icon: Moon };
}

export function GreetingClient({
  dueTodayCount,
  weather,
}: {
  dueTodayCount: number;
  weather: GreetingWeather;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setNow(new Date()), 0);
    return () => clearTimeout(timeout);
  }, []);

  if (!now) {
    return (
      <div className="mb-4 h-[76px] rounded-[var(--radius-card)] border border-border bg-card" />
    );
  }

  const { text, Icon } = greetingFor(now.getHours());
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  const WeatherIcon = weather ? WEATHER_ICONS[weather.icon] : null;

  return (
    <div className="mb-4 flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-gradient-to-br from-primary-soft to-card px-5 py-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold text-foreground">{text}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <span>{dateLabel}</span>
          {dueTodayCount > 0 && (
            <span>
              · {dueTodayCount} task{dueTodayCount === 1 ? "" : "s"} due today
            </span>
          )}
          {weather && WeatherIcon && (
            <span className="inline-flex items-center gap-1">
              · <WeatherIcon className="size-3.5" />
              {Math.round(weather.temperatureC)}°C, {weather.conditionLabel.toLowerCase()} in{" "}
              {weather.label}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
