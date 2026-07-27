import type { Area } from "@/types";

export type CalendarItem = {
  id: string;
  title: string;
  href: string;
  kind: "task" | "project";
  area: Area;
  urgent?: boolean;
  done?: boolean;
};

export const AREA_DOT_COLOR: Record<Area, string> = {
  BUSINESS: "#e8604c",
  PERSONAL: "#c98a2e",
};
