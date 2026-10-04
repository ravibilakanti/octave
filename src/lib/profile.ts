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
  return existing as ProfileBundle;
}

export async function getProfileBundle(): Promise<ProfileBundle> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const owned = await prisma.profile.findUnique({ where: { userId } });
  if (owned) return getProfileBundleById(owned.id);

  // Claim the legacy singleton profile and its existing pipeline data for the
  // first authenticated account, preserving a pre-auth local installation.
  const legacy = await prisma.profile.findUnique({ where: { id: "me" } });
  if (legacy && legacy.userId == null) {
    await prisma.profile.update({ where: { id: "me" }, data: {
      userId, fullName: legacy.fullName || session.user?.name || "",
      email: legacy.email || session.user?.email || "",
    }});
    return getProfileBundleById("me");
  }

  const created = await prisma.profile.create({
    data: {
      userId, fullName: session.user?.name || "", email: session.user?.email || "",
      minFitScore: 8, autoApply: false,
    },
  });
  return getProfileBundleById(created.id);
}
