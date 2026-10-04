import { prisma } from "@/lib/db";
import type { ProfileBundle } from "@/lib/profile-text";

export async function getProfileBundle(): Promise<ProfileBundle> {
  const existing = await prisma.profile.findUnique({
    where: { id: "me" },
    include: {
      experiences: { orderBy: { sortOrder: "asc" } },
      education: { orderBy: { sortOrder: "asc" } },
      skills: true,
      certifications: true,
      projects: true,
    },
  });
  if (existing) return existing;

  return prisma.profile.create({
    data: { id: "me", minFitScore: 8, autoApply: false },
    include: {
      experiences: true,
      education: true,
      skills: true,
      certifications: true,
      projects: true,
    },
  });
}
