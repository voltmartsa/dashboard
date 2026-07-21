import { cookies } from "next/headers";
import type { Area } from "@/types";

export const AREA_COOKIE = "dashboard_area";

export async function getCurrentArea(): Promise<Area> {
  const store = await cookies();
  const value = store.get(AREA_COOKIE)?.value;
  return value === "BUSINESS" || value === "PERSONAL" ? value : "PERSONAL";
}
