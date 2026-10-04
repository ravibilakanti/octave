import { NextResponse } from "next/server";
import { enabledProviders } from "@/lib/jobs/search";
import { aiConfigured } from "@/lib/ai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    app: process.env.NEXT_PUBLIC_APP_NAME || "Octave",
    ai: aiConfigured(),
    aiModel: process.env.AI_MODEL || "gpt-4o-mini",
    providers: enabledProviders().map((p) => ({ id: p.id, label: p.label })),
    minFitScore: Number(process.env.MIN_FIT_SCORE || 8),
    smtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
  });
}
