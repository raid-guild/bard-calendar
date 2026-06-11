import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ChannelBadge({ channel, className }: { channel: string; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-sm bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
    >
      {channel}
    </Badge>
  );
}
