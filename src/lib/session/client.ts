export type PortalSessionResponse = {
  user?: {
    name?: string;
    handle?: string;
    picture?: string;
    roles: string[];
  };
  canView: boolean;
  canEdit: boolean;
  portalModulesUrl: string;
};

export async function fetchPortalSession(): Promise<PortalSessionResponse> {
  const response = await fetch("/api/session", { cache: "no-store" });
  const json = await response.json().catch(() => ({}));

  if (response.status === 401) {
    return {
      canView: false,
      canEdit: false,
      portalModulesUrl:
        json.portalModulesUrl ?? "https://portal.raidguild.org/modules",
    } satisfies PortalSessionResponse;
  }

  if (!response.ok) {
    throw new Error(json.error ?? "Unable to load Portal session.");
  }

  return json as PortalSessionResponse;
}
