import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm border-primary/30 bg-primary/10 font-mono text-[10px] uppercase tracking-[0.14em] text-primary",
        status === "skipped" && "border-accent/40 bg-accent/10 text-accent",
        status === "published" && "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
        status === "drafting" && "border-amber-300/40 bg-amber-300/10 text-amber-200",
        className,
      )}
    >
      {status}
    </Badge>
  );
}
