import { NextResponse } from "next/server";
import { analyzeJob, analyzeUnscored } from "@/lib/pipeline";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (body.jobId) {
    const result = await analyzeJob(body.jobId);
    return NextResponse.json(result);
  }
  const results = await analyzeUnscored(Number(body.limit ?? 12));
  return NextResponse.json({ count: results.length, results });
}
