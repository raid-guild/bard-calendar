# Portal Auth And Permissions Plan

Status: implementation plan  
Date: June 12, 2026  
Source: `/home/skuhl/Documents/ody/raidguild/cohort/portal/docs/external-module-integration-guide.md`

## Objective

Integrate the calendar as an external Raid Guild Portal module using Portal signed launch auth.

Portal remains the source of truth for identity and roles. The calendar verifies the short-lived launch token, creates its own local session, and uses the Portal roles included at launch time to decide whether the user can view or edit.

## Authorization Rule

Users with a Portal role including `members` or `admin` can view the calendar.

Users with a Portal role including `admin` can edit calendar events.

Users without `members` or `admin` should see an unauthorized view instead of the calendar, even if they have a valid Portal launch session.

```ts
const rolePolicy = {
  viewRoles: ["members", "admin"],
  editRoles: ["admin"],
};

const roles = claims.roles ?? [];
const canView = rolePolicy.viewRoles.some((role) => roles.includes(role));
const canEdit = rolePolicy.editRoles.some((role) => roles.includes(role));
```

Keep this policy centralized in one helper or config object, not scattered across API routes and components. That makes later changes easy, such as allowing `member` instead of `members`, adding an `editor` role, or temporarily removing a role.

Recommended implementation:

```txt
src/lib/portal-role-policy.ts
```

```ts
export const portalRolePolicy = {
  viewRoles: ["members", "admin"],
  editRoles: ["admin"],
} as const;
```

All server helpers and UI session responses should use this policy module. Swapping roles later should usually mean changing this one file and updating the corresponding tests.

## Portal Launch Flow

Portal opens the external module callback with a signed JWT:

```txt
GET /portal/callback?token=<jwt>
```

The calendar must:

1. Read the `token` query parameter.
2. Verify the token signature and claims.
3. Create a local HTTP-only session cookie.
4. Redirect the user to `/`.
5. Never store or log the raw launch token.

The launch token is only for starting the local app session. It must not be used as an API credential.

## Required Token Verification

Verify:

- Signature with the shared module launch secret.
- `typ === "portal_module_launch"`.
- Expected issuer.
- Expected audience.
- Token is not expired.
- `moduleSlug` matches the expected module slug.

Expected production issuer:

```txt
https://portal.raidguild.org
```

Expected module slug:

```txt
bard-calendar
```

Confirm the final slug against the Portal module record before deployment.

## Environment Variables

Add placeholders to `.env.example` when implementation begins:

```txt
# Portal signed-launch auth.
# Must match the shared secret configured in the Portal module record.
PORTAL_MODULE_LAUNCH_SECRET=replace-with-shared-launch-secret

# Expected launch token claims.
PORTAL_MODULE_SLUG=bard-calendar
PORTAL_MODULE_ISSUER=https://portal.raidguild.org

# Secret used by this app to sign/encrypt its local session cookie.
PORTAL_MODULE_SESSION_SECRET=replace-with-long-random-session-secret

# Fallback link for users who need to re-launch the module.
PORTAL_MODULES_URL=https://portal.raidguild.org/modules
```

The real launch secret will be provided later and must not be committed.

## Local Session

Use a signed, HTTP-only, secure cookie for the first implementation.

Session payload should include only the fields the app needs:

```ts
type PortalSession = {
  portalUserID: string;
  portalProfileID?: string;
  email?: string;
  name?: string;
  handle?: string;
  picture?: string;
  roles: string[];
  canView: boolean;
  canEdit: boolean;
  issuedAt: number;
};
```

Recommended cookie behavior:

- HTTP-only.
- `sameSite: "lax"`.
- `secure: true` in production.
- Short session lifetime, likely 8 to 24 hours.
- Clear the cookie when verification or decoding fails.

No database user table is required for the first slice. Add one later only if the app needs audit history, local preferences, or account metadata.

## Server Implementation

Create:

```txt
src/lib/portal-auth.ts
src/app/portal/callback/route.ts
src/app/api/session/route.ts
```

`src/lib/portal-auth.ts` responsibilities:

- Define `PortalLaunchClaims`.
- Verify launch JWTs.
- Normalize optional Portal claims.
- Compute `canView` and `canEdit` from a centralized role policy.
- Create/read/clear the local session cookie.
- Provide helpers such as `getPortalSession()`, `requireViewerSession()`, and `requireEditorSession()`.

`src/app/portal/callback/route.ts` responsibilities:

- Accept `?token=`.
- Verify the launch token.
- Set the local session cookie.
- Redirect to `/`.
- Redirect or render a clear error if the token is missing, expired, or invalid.

`src/app/api/session/route.ts` responsibilities:

- Return safe current-session data for the frontend.
- Never expose secrets or raw launch token data.

Example response:

```json
{
  "user": {
    "name": "Member Name",
    "handle": "member-handle",
    "picture": "https://portal.raidguild.org/media/avatar.jpg",
    "roles": ["members"]
  },
  "canView": true,
  "canEdit": false
}
```

## API Route Protection

Current browser event reads and writes are public and must be guarded.

Update:

```txt
src/app/api/events/route.ts
src/app/api/events/[id]/route.ts
```

Rules:

- `GET /api/events`: require `canView`.
- `POST /api/events`: require `canEdit`.
- `PATCH /api/events/:id`: require `canEdit`.
- `DELETE /api/events/:id`: require `canEdit`.

Recommended error responses:

```txt
401 Unauthorized - no valid local session
403 Forbidden - valid session, but missing the required role for this action
```

Keep agent endpoints separate and unaffected:

```txt
src/app/api/agent/*
```

They should continue using `BARD_CALENDAR_AGENT_API_TOKEN` and should still allow the agent to view and edit through the existing agent-specific routes. Do not add Portal session requirements to `src/app/api/agent/*`.

Current agent capability to preserve:

- `GET /api/agent/events`: agent can view/list events.
- `POST /api/agent/events`: agent can create events.
- `PATCH /api/agent/events/:id`: agent can edit events.
- `PUT /api/agent/events/upsert`: agent can create or update by external identity.

If agent access needs shared event query or mutation logic, reuse the lower-level event query functions. Do not route agent requests through browser endpoints that require Portal cookies.

## UI States

The app should support three visible auth states.

### 1. No Valid Portal Session

Show an unauthorized launch view instead of the calendar.

Suggested copy:

```txt
Raid Guild Content Calendar

This module needs to be opened from the Raid Guild Portal.

Your Portal session signs a short-lived launch pass so we know who you are and whether you can edit the calendar.
```

Primary action:

```txt
Open Portal Modules
```

Link target:

```txt
PORTAL_MODULES_URL
```

For invalid or expired launch tokens, use similar copy:

```txt
Launch pass expired

This launch link is no longer valid. Please return to the Portal and open the Content Calendar again.
```

### 2. Valid Session Without View Role

Show the unauthorized view instead of the calendar.

This covers users who launched successfully from Portal but do not have `members` or `admin`.

Suggested copy:

```txt
Calendar access unavailable

Your Portal account does not currently have access to this module.
```

Primary action:

```txt
Open Portal Modules
```

### 3. Valid Session With `members`

Show the calendar in read-only mode.

Behavior:

- Calendar and list views are visible.
- Existing events open in a view-only drawer.
- Hide the `New event` button.
- Hide or disable save/delete controls.
- Disable form inputs in the drawer.
- Optionally show a compact `View only` indicator in the top bar.

### 4. Valid Session With `admin`

Show the full editable calendar.

Behavior:

- Calendar and list views are visible.
- `New event` is available.
- Existing events can be edited.
- Events can be deleted.

## Frontend Implementation

Update:

```txt
src/components/app-shell.tsx
src/components/top-bar.tsx
src/components/event-drawer.tsx
```

`AppShell` should:

- Fetch `/api/session`.
- Show the unauthorized view when no valid session exists.
- Show the unauthorized view when the session exists but `canView` is false.
- Derive and pass `canView` and `canEdit` into calendar controls.
- Prevent create/update/delete mutation calls when `canEdit` is false.

`TopBar` should:

- Accept `canEdit`.
- Hide `New event` when `canEdit` is false.
- Optionally display current user or `View only`.

`EventDrawer` should:

- Accept `readOnly`.
- Disable all editable fields in read-only mode.
- Hide or disable `Save event` and `Delete`.
- Use `View event` as the title in read-only mode.

Add a small unauthorized component, likely:

```txt
src/components/portal-launch-required.tsx
```

This component should match the existing dark operational UI and provide one clear link back to Portal modules.

## Testing Plan

Add tests for portal auth helpers:

- Valid launch token verifies.
- Missing token fails.
- Wrong signature fails.
- Wrong `typ` fails.
- Wrong issuer fails.
- Wrong audience fails.
- Wrong `moduleSlug` fails.
- Expired token fails.
- Missing optional claims still creates a valid normalized session.
- `roles: ["members"]` sets `canView: true` and `canEdit: false`.
- `roles: ["admin"]` sets `canView: true` and `canEdit: true`.
- Missing roles or unrelated roles set `canView: false` and `canEdit: false`.
- Role policy can be changed in one place without editing route handlers.

Add route-level tests where practical:

- Event write without session returns `401`.
- Event read with no session returns `401`.
- Event read with unrelated role returns `403`.
- Event read with `members` succeeds.
- Event write with `members` returns `403`.
- Event write with `admin` succeeds.
- Agent API event read/write still succeeds with `BARD_CALENDAR_AGENT_API_TOKEN` and no Portal session.

Add UI tests where practical:

- Unauthorized state renders Portal modules link.
- Read-only users do not see `New event`.
- Read-only drawer does not expose save/delete actions.
- Admin users see editable controls.

## Implementation Order

1. Add env placeholders to `.env.example`.
2. Add portal auth/session utility.
3. Add `/portal/callback`.
4. Add `/api/session`.
5. Add unauthorized launch view.
6. Guard event mutation routes.
7. Wire read-only UI behavior.
8. Add auth and permission tests.
9. Configure the Portal module record with the final callback URL, slug, audience, and secret env key.

## Open Decisions

- Confirm final Portal module slug. Proposed: `bard-calendar`.
- Decide local session lifetime.
- Confirm exact Portal role spelling. Current plan assumes `members` and `admin`.
- Decide whether to add a logout route. It is not required for the first slice, but can be useful for local testing.
