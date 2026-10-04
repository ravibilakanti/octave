import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { autoApplyEligible, prepareAndApply } from "@/lib/pipeline";

export const runtime = "nodejs";

export async function GET() {
  const applications = await prisma.application.findMany({
    include: {
      job: true,
      events: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.auto) {
    const result = await autoApplyEligible();
    return NextResponse.json(result);
  }
  if (!body.jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }
  try {
    const application = await prepareAndApply(body.jobId, { force: Boolean(body.force) });
    return NextResponse.json({ application });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Apply failed" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const body = await request.json();
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  const application = await prisma.application.update({
    where: { id: body.id },
    data: {
      status: body.status,
      notes: body.notes ?? undefined,
      events: {
        create: {
          status: body.status,
          message: body.message || `Status changed to ${body.status}`,
        },
      },
    },
    include: { job: true, events: true },
  });
  return NextResponse.json({ application });
}
