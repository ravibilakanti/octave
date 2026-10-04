import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ProfileBundle } from "@/lib/profile-text";

export async function getProfileBundleById(profileId: string): Promise<ProfileBundle> {
  const existing = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      experiences: { orderBy: { sortOrder: "asc" } },
      education: { orderBy: { sortOrder: "asc" } },
      skills: true,
      certifications: true,
      projects: true,
    },
  });
  if (!existing) throw new Error("Profile not found.");
  return existing;
}

export async function getProfileBundle(): Promise<ProfileBundle> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) return getProfileBundleById(existing.id);

  const created = await prisma.profile.create({
    data: {
      userId,
      fullName: session.user?.name || "",
      email: session.user?.email || "",
      minFitScore: 8,
      autoApply: false,
    },
  });
  return getProfileBundleById(created.id);
}
