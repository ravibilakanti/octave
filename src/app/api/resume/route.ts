import { NextResponse } from "next/server";
import { buildAtsResume, tailorAtsResume } from "@/lib/ats";
import { prisma } from "@/lib/db";
import { getProfileBundle } from "@/lib/profile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const profile = await getProfileBundle();
  let content = buildAtsResume(profile);
  let title = "ATS master resume";

  if (body.jobId) {
    const job = await prisma.job.findUniqueOrThrow({ where: { id: body.jobId } });
    content = await tailorAtsResume(profile, job);
    title = `ATS — ${job.title} @ ${job.company}`;
  }

  const version = await prisma.resumeVersion.create({
    data: { profileId: profile.id, jobId: body.jobId || null, kind: "ats", title, content },
  });
  return NextResponse.json({ version });
}

export async function GET() {
  const versions = await prisma.resumeVersion.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ versions });
}
