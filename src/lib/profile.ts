import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ProfileBundle } from "@/lib/profile-text";

export async function getProfileBundle(): Promise<ProfileBundle> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const existing = await prisma.profile.findUnique({
    where: { userId },
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
    data: {
      userId,
      fullName: session.user?.name || "",
      email: session.user?.email || "",
      minFitScore: 8,
      autoApply: false,
    },
    include: {
      experiences: true,
      education: true,
      skills: true,
      certifications: true,
      projects: true,
    },
  });
}
