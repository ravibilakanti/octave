import { cn } from "@/lib/utils";

export function ScoreBadge({ score }: { score?: number | null }) {
  if (score == null) {
    return (
      <span className="rounded-full border border-[#2a3654] px-2 py-0.5 text-xs text-[#9aa8c7]">
        unscored
      </span>
    );
  }
  const tone =
    score >= 8 ? "border-[#34d399] text-[#34d399]" : score >= 6 ? "border-[#e2b657] text-[#e2b657]" : "border-[#f87171] text-[#f87171]";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", tone)}>
      {score.toFixed(1)} / 10
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-[#1b2540] px-2 py-0.5 text-xs capitalize text-[#9aa8c7]">
      {status.replaceAll("_", " ")}
    </span>
  );
}
