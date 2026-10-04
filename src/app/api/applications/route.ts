import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { autoApplyEligible, prepareAndApply } from "@/lib/pipeline";
import { getProfileBundle } from "@/lib/profile";

export const runtime = "nodejs";

export async function GET() {
  const profile = await getProfileBundle();
  const applications = await prisma.application.findMany({
    where: { job: { profileId: profile.id } },
    include: { job: true, events: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.auto) return NextResponse.json(await autoApplyEligible());
  if (!body.jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });
  try {
    return NextResponse.json({ application: await prepareAndApply(body.jobId, { force: Boolean(body.force) }) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Apply failed" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const profile = await getProfileBundle();
  const body = await request.json();
  if (!body.id || !body.status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
  const existing = await prisma.application.findFirst({ where: { id: body.id, job: { profileId: profile.id } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const application = await prisma.application.update({
    where: { id: body.id },
    data: {
      status: body.status, notes: body.notes ?? undefined,
      events: { create: { status: body.status, message: body.message || `Status changed to ${body.status}` } },
    },
    include: { job: true, events: true },
  });
  return NextResponse.json({ application });
}
