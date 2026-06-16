"use client";

import { CalendarDays } from "lucide-react";
import Image from "next/image";

type TopBarProps = {
  rangeLabel: string;
};

export function TopBar({ rangeLabel }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-primary/30 bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-lg font-semibold tracking-tight text-accent">
              {process.env.NEXT_PUBLIC_APP_NAME ?? "RaidGuild Content Calendar"}
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {rangeLabel}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end">
          <Image
            src="/scribe.svg"
            alt="Scribe"
            width={208}
            height={233}
            className="h-12 w-auto object-contain sm:h-14"
          />
        </div>
      </div>
    </header>
  );
}
