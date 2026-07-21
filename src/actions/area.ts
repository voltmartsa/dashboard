"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AREA_COOKIE } from "@/lib/area";
import { AREAS, type Area } from "@/types";

export async function setAreaAction(area: Area) {
  if (!AREAS.includes(area)) return;
  const store = await cookies();
  store.set(AREA_COOKIE, area, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
