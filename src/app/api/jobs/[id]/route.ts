import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProfileBundle } from "@/lib/profile";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const profile = await getProfileBundle();
  const { id } = await ctx.params;
  const job = await prisma.job.findFirst({
    where: { id, profileId: profile.id },
    include: { analyses: { orderBy: { createdAt: "desc" }, take: 5 }, applications: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}
