import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchAndStore } from "@/lib/pipeline";
import { getProfileBundle } from "@/lib/profile";
import { toJson } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const profile = await getProfileBundle();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const jobs = await prisma.job.findMany({
    where: { profileId: profile.id },
    include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 }, applications: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  const filtered = q ? jobs.filter((j) => `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(q)) : jobs;
  return NextResponse.json({ jobs: filtered });
}

export async function POST(request: Request) {
  const profile = await getProfileBundle();
  const body = await request.json();
  if (body.manual) {
    const job = await prisma.job.create({
      data: {
        profileId: profile.id, externalId: `manual-${Date.now()}`, provider: "manual",
        title: body.title, company: body.company, location: body.location, remote: Boolean(body.remote),
        url: body.url, applyUrl: body.applyUrl || body.url, applyEmail: body.applyEmail,
        description: body.description || "", salary: body.salary, rawJson: toJson(body),
      },
    });
    return NextResponse.json({ job, errors: [] });
  }
  const result = await searchAndStore({ query: body.query || "", location: body.location, remoteOnly: Boolean(body.remoteOnly) });
  return NextResponse.json(result);
}
