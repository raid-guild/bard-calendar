import { z } from "zod";

export const routePlatforms = ["x", "linkedin", "paragraph", "farcaster", "newsletter", "website", "discord", "other"] as const;
export const routeSchema = z.object({
  platform: z.enum(routePlatforms),
  account: z.string().trim().min(1).nullable().optional(),
  format: z.string().trim().min(1).nullable().optional(),
}).superRefine((route, context) => {
  if (route.platform === "x" && !["raidguild", "queen-raida"].includes(route.account ?? "")) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["account"], message: "X routes require account raidguild or queen-raida; generic X is ambiguous." });
  }
  if (route.platform === "linkedin" && !["post", "article"].includes(route.format ?? "")) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["format"], message: "LinkedIn routes require post or article format." });
  }
});

export type ContentRoute = z.infer<typeof routeSchema>;

export function routeFromLegacy(value: string): ContentRoute | null {
  const key = value.trim().toLowerCase();
  const known: Record<string, ContentRoute> = {
    "x: main account": { platform: "x", account: "raidguild", format: "post" },
    "x: raida": { platform: "x", account: "queen-raida", format: "post" },
    linkedin: { platform: "linkedin", account: "raidguild", format: "post" },
    paragraph: { platform: "paragraph", account: "raidguild", format: "article" },
    farcaster: { platform: "farcaster", account: "raidguild", format: "post" },
    newsletter: { platform: "newsletter", account: "raidguild", format: "newsletter" },
    "website: .ia": { platform: "website", account: "raidguild-ia", format: "article" },
    "website: .org": { platform: "website", account: "raidguild-org", format: "article" },
    "website: raida": { platform: "website", account: "queen-raida", format: "article" },
    discord: { platform: "discord", account: "raidguild", format: "message" },
    other: { platform: "other", account: null, format: null },
  };
  return known[key] ?? null;
}

export function legacyFromRoute(route: ContentRoute): string {
  if (route.platform === "x") return route.account === "queen-raida" ? "x: raida" : "x: main account";
  if (route.platform === "linkedin") return "linkedin";
  if (route.platform === "website") return route.account === "queen-raida" ? "website: raida" : route.account === "raidguild-ia" ? "website: .ia" : "website: .org";
  return route.platform;
}
