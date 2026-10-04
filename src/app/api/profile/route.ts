import { NextResponse } from "next/server";
import { getProfileBundle } from "@/lib/profile";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  const profile = await getProfileBundle();
  return NextResponse.json({
    ...profile,
    targetTitles: parseJson(profile.targetTitles, []),
    keywords: parseJson(profile.keywords, []),
    experiences: profile.experiences.map((e) => ({
      ...e,
      achievements: parseJson(e.achievements, []),
    })),
    projects: profile.projects.map((p) => ({
      ...p,
      highlights: parseJson(p.highlights, []),
    })),
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const current = await getProfileBundle();
  const profile = await prisma.profile.update({
    where: { id: current.id },
    update: {
      fullName: body.fullName ?? "",
      email: body.email ?? "",
      phone: body.phone,
      location: body.location,
      linkedinUrl: body.linkedinUrl,
      githubUrl: body.githubUrl,
      portfolioUrl: body.portfolioUrl,
      workAuthorization: body.workAuthorization,
      willingToRelocate: Boolean(body.willingToRelocate),
      remotePreference: body.remotePreference ?? "any",
      salaryMin: body.salaryMin ? Number(body.salaryMin) : null,
      salaryMax: body.salaryMax ? Number(body.salaryMax) : null,
      targetTitles: JSON.stringify(body.targetTitles ?? []),
      keywords: JSON.stringify(body.keywords ?? []),
      summary: body.summary ?? "",
      rawResume: body.rawResume ?? "",
      personalNotes: body.personalNotes ?? "",
      autoApply: Boolean(body.autoApply),
      minFitScore: Number(body.minFitScore ?? 8),
    },
  });

  if (Array.isArray(body.experiences)) {
    await prisma.experience.deleteMany({ where: { profileId: current.id } });
    if (body.experiences.length) {
      await prisma.experience.createMany({
        data: body.experiences.map((e: Record<string, unknown>, i: number) => ({
          profileId: "me",
          company: String(e.company ?? ""),
          title: String(e.title ?? ""),
          location: e.location ? String(e.location) : null,
          startDate: String(e.startDate ?? ""),
          endDate: e.endDate ? String(e.endDate) : null,
          current: Boolean(e.current),
          description: String(e.description ?? ""),
          achievements: JSON.stringify(e.achievements ?? []),
          sortOrder: i,
        })),
      });
    }
  }

  if (Array.isArray(body.education)) {
    await prisma.education.deleteMany({ where: { profileId: "me" } });
    if (body.education.length) {
      await prisma.education.createMany({
        data: body.education.map((e: Record<string, unknown>, i: number) => ({
          profileId: "me",
          school: String(e.school ?? ""),
          degree: String(e.degree ?? ""),
          field: e.field ? String(e.field) : null,
          startDate: e.startDate ? String(e.startDate) : null,
          endDate: e.endDate ? String(e.endDate) : null,
          notes: e.notes ? String(e.notes) : null,
          sortOrder: i,
        })),
      });
    }
  }

  if (Array.isArray(body.skills)) {
    await prisma.skill.deleteMany({ where: { profileId: "me" } });
    if (body.skills.length) {
      await prisma.skill.createMany({
        data: body.skills.map((s: Record<string, unknown>) => ({
          profileId: "me",
          name: String(s.name ?? s),
          category: String(s.category ?? "core"),
          level: String(s.level ?? "proficient"),
        })),
      });
    }
  }

  if (Array.isArray(body.certifications)) {
    await prisma.certification.deleteMany({ where: { profileId: "me" } });
    if (body.certifications.length) {
      await prisma.certification.createMany({
        data: body.certifications.map((c: Record<string, unknown>) => ({
          profileId: "me",
          name: String(c.name ?? ""),
          issuer: c.issuer ? String(c.issuer) : null,
          issuedOn: c.issuedOn ? String(c.issuedOn) : null,
          expiresOn: c.expiresOn ? String(c.expiresOn) : null,
          url: c.url ? String(c.url) : null,
        })),
      });
    }
  }

  if (Array.isArray(body.projects)) {
    await prisma.project.deleteMany({ where: { profileId: "me" } });
    if (body.projects.length) {
      await prisma.project.createMany({
        data: body.projects.map((p: Record<string, unknown>) => ({
          profileId: "me",
          name: String(p.name ?? ""),
          url: p.url ? String(p.url) : null,
          description: String(p.description ?? ""),
          highlights: JSON.stringify(p.highlights ?? []),
        })),
      });
    }
  }

  return NextResponse.json({ ok: true, id: profile.id });
}
