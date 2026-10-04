import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProfileBundle } from "@/lib/profile";

export const runtime = "nodejs";

export async function GET() {
  const profile = await getProfileBundle();
  const [jobs, applications, analyses, ready] = await Promise.all([
    prisma.job.count({ where: { profileId: profile.id } }),
    prisma.application.groupBy({ by: ["status"], where: { job: { profileId: profile.id } }, _count: true }),
    prisma.fitment.findMany({
      where: { job: { profileId: profile.id } },
      orderBy: { createdAt: "desc" }, take: 200,
      select: { score: true, recommendation: true },
    }),
    prisma.application.count({ where: { status: { in: ["ready", "applied"] }, job: { profileId: profile.id } } }),
  ]);
  const byStatus = Object.fromEntries(applications.map((s) => [s.status, s._count]));
  const scored = analyses.length;
  const applyBand = analyses.filter((a) => a.score >= profile.minFitScore).length;
  const avg = scored === 0 ? 0 : Number((analyses.reduce((sum, a) => sum + a.score, 0) / scored).toFixed(1));
  const recent = await prisma.application.findMany({
    where: { job: { profileId: profile.id } }, include: { job: true },
    orderBy: { createdAt: "desc" }, take: 8,
  });
  const topFits = await prisma.fitment.findMany({
    where: { job: { profileId: profile.id } }, include: { job: true },
    orderBy: { score: "desc" }, take: 8,
  });
  return NextResponse.json({ jobs, scored, applyBand, avg, ready, byStatus, recent, topFits });
}
