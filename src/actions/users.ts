"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import type { UserRole } from "@/types";

export async function setUserRole(userId: string, role: UserRole) {
  const admin = await requireSuperAdmin();
  if (userId === admin.id) {
    throw new Error("You can't change your own role.");
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin");
}

export async function setUserActive(userId: string, active: boolean) {
  const admin = await requireSuperAdmin();
  if (userId === admin.id) {
    throw new Error("You can't deactivate your own account.");
  }

  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/admin");
}

export async function deleteUser(userId: string) {
  const admin = await requireSuperAdmin();
  if (userId === admin.id) {
    throw new Error("You can't delete your own account.");
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
}
