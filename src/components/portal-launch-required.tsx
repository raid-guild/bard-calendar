"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type PortalLaunchRequiredProps = {
  title?: string;
  message?: string;
  portalModulesUrl: string;
};

export function PortalLaunchRequired({
  title = "RaidGuild Content Calendar",
  message = "This module needs to be opened from the RaidGuild Portal.",
  portalModulesUrl,
}: PortalLaunchRequiredProps) {
  return (
    <div className="noise-bg relative flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <main className="relative z-10 w-full max-w-md border border-border bg-card/70 px-6 py-7 shadow-2xl shadow-black/30">
        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-sm border border-primary/30 bg-primary/10 text-primary">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-accent">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {message}
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your Portal session signs a short-lived launch pass so we can confirm
          calendar access.
        </p>
        <Button
          asChild
          className="mt-6 rounded-sm font-heading text-xs uppercase tracking-wider"
        >
          <a href={portalModulesUrl}>Open Portal Modules</a>
        </Button>
      </main>
    </div>
  );
}
