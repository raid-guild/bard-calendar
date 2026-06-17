import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeQuestionMark,
  Bot,
  CalendarDays,
  ExternalLink,
  KeyRound,
  ListChecks,
  MessageSquarePlus,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Docs | RaidGuild Content Calendar",
  description:
    "Member guide for the RaidGuild Content Calendar, UI workflow, permissions, and Queen Raida agent usage.",
};

const raidaChannelUrl =
  "https://discord.com/channels/684227450204323876/1514747512219766995";

const workflow = [
  {
    name: "Topic",
    description:
      "The underlying idea, theme, source material, or campaign context.",
  },
  {
    name: "Draft",
    description:
      "Channel-specific copy connected to a topic, with markdown content and optional external draft links.",
  },
  {
    name: "Publishing event",
    description:
      "The scheduled calendar item that says what publishes, where it publishes, and when.",
  },
  {
    name: "Live URL",
    description:
      "The published post link that closes the loop for later reporting and performance review.",
  },
];

const uiSections = [
  {
    title: "Calendar",
    icon: CalendarDays,
    items: [
      "Use month or week view to scan planned publishing work.",
      "Use Today, previous, and next controls to move through the schedule.",
      "Open a calendar item to view or edit its publishing details.",
      "Create a new event when the timing and target channel are already known.",
    ],
  },
  {
    title: "List",
    icon: ListChecks,
    items: [
      "Review events in a table built for fast scanning.",
      "Compare publish date, channel, status, type, campaign, owner, draft link, media link, and update time.",
      "Use filters when you need a narrower slice of the publishing plan.",
      "Open a row to inspect or update the event.",
    ],
  },
  {
    title: "Drafts",
    icon: ScrollText,
    items: [
      "Create topics for new content ideas, themes, or campaigns.",
      "Expand a topic to review its drafts.",
      "Add channel-specific drafts under the relevant topic.",
      "Use daggers as member approval or upvote signals.",
      "Assign a ready draft to the calendar when it should become scheduled work.",
    ],
  },
];

const statuses = [
  ["idea", "Possible future item."],
  ["planned", "Intended for publishing."],
  ["drafting", "Copy, media, or context is still being prepared."],
  ["ready", "Prepared for final review or scheduling."],
  ["scheduled", "Queued or scheduled externally."],
  ["published", "Live, ideally with a live URL attached."],
  ["skipped", "Intentionally not published."],
];

const raidaTasks = [
  "Create a topic from a member idea.",
  "Add supporting material, links, and source context.",
  "Generate or revise channel-specific drafts.",
  "Assign drafts to calendar events.",
  "Update events when posts are scheduled or published.",
  "Keep topic, draft, event, and live URL links intact for later reporting.",
];

const prompts = [
  "Raida, create a topic for this idea: ...",
  "Raida, turn this into a Farcaster and X draft.",
  "Raida, schedule this draft for next week.",
  "Raida, add this live URL to the published event.",
];

export default function DocsPage() {
  return (
    <div className="noise-bg relative min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-primary/30 bg-primary/10 text-primary">
              <BadgeQuestionMark className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-heading text-lg font-semibold tracking-tight text-accent">
                Content Calendar Docs
              </h1>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                RaidGuild member guide
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-sm border border-border bg-background px-3 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Calendar
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-[1200px] gap-6 px-4 py-6 lg:px-6">
        <section className="border border-border bg-card/60 p-5">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
            <div className="space-y-4">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
                How the calendar works
              </div>
              <h2 className="max-w-3xl font-heading text-3xl font-semibold tracking-tight text-foreground">
                A shared workspace for RaidGuild topics, drafts, publishing
                plans, and live links.
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                The calendar keeps content work queryable and connected. The
                important relationship is simple: a topic can have drafts, a
                draft can become a publishing event, and a published event
                should end with a live URL.
              </p>
            </div>
            <div className="border border-primary/25 bg-primary/10 p-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                Core workflow
              </div>
              <div className="mt-3 font-mono text-sm text-foreground">
                Topic -&gt; Draft -&gt; Publishing event -&gt; Live URL
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {workflow.map((item) => (
            <article key={item.name} className="border border-border bg-card/50 p-4">
              <h3 className="font-heading text-lg text-foreground">
                {item.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <article className="border border-border bg-card/50 p-5">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
              <ShieldCheck className="h-4 w-4" />
              Permissions
            </div>
            <h2 className="mt-3 font-heading text-2xl font-semibold">
              Portal roles control what the UI allows.
            </h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
              <p>
                Members with the Portal role <code>member</code> or{" "}
                <code>members</code> can view the calendar, list, and drafts.
                They cannot create, edit, assign, dagger, or delete content
                through the UI.
              </p>
              <p>
                Portal admins with the <code>admin</code> role can view and
                edit. Admins can create and update topics, drafts, and
                publishing events, assign drafts to the calendar, add daggers,
                and delete events.
              </p>
            </div>
          </article>

          <article className="border border-border bg-card/50 p-5">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
              <KeyRound className="h-4 w-4" />
              Good habits
            </div>
            <div className="mt-4 grid gap-2 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
              <p>Keep each topic focused on one idea or theme.</p>
              <p>Add source links and strategic context to supporting material.</p>
              <p>Create separate drafts for separate channels.</p>
              <p>Use clear event names, owners, campaigns, and content types.</p>
              <p>Keep topic, draft, and event links intact.</p>
              <p>Add the live URL after publication.</p>
            </div>
          </article>
        </section>

        <section className="grid gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
              Using the UI
            </div>
            <h2 className="mt-2 font-heading text-2xl font-semibold">
              Start from the view that matches the work.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {uiSections.map((section) => {
              const Icon = section.icon;

              return (
                <article
                  key={section.title}
                  className="border border-border bg-card/50 p-5"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-heading text-xl">{section.title}</h3>
                  </div>
                  <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border border-border bg-card/50 p-5">
          <div className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
            Event status
          </div>
          <h2 className="mt-2 font-heading text-2xl font-semibold">
            Statuses should describe the current publishing reality.
          </h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {statuses.map(([name, description]) => (
              <div key={name} className="border border-border bg-background/40 p-3">
                <div className="font-mono text-xs uppercase tracking-[0.14em] text-foreground">
                  {name}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="border border-border bg-card/50 p-5">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
              <Bot className="h-4 w-4" />
              Queen Raida
            </div>
            <h2 className="mt-3 font-heading text-2xl font-semibold">
              Raida uses the same model through her agent skill and API.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Queen Raida has a skill wrapping <code>AGENT.md</code> plus the
              authenticated agent API. She can manage topics, drafts, and
              publishing events without using the browser UI.
            </p>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
              {raidaTasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </article>

          <article className="border border-primary/25 bg-primary/10 p-5">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
              <MessageSquarePlus className="h-4 w-4" />
              Bring ideas to Raida
            </div>
            <h2 className="mt-3 font-heading text-2xl font-semibold">
              Have a new topic or post idea? Ask Raida in Discord.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use the Queen Raida channel when you want to turn rough context
              into a topic, draft, or publishing plan.
            </p>
            <Link
              href={raidaChannelUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-primary px-4 font-heading text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open Raida channel
              <ExternalLink className="h-4 w-4" />
            </Link>
            <div className="mt-5 grid gap-2">
              {prompts.map((prompt) => (
                <div
                  key={prompt}
                  className="border border-primary/20 bg-background/40 p-3 font-mono text-xs text-foreground"
                >
                  {prompt}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="border border-border bg-card/50 p-5">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-4 w-4" />
            Suggested member workflow
          </div>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground md:grid-cols-2">
            <li>1. Bring an idea to Raida in Discord or create a topic in the UI.</li>
            <li>2. Add supporting material, links, notes, or source context.</li>
            <li>3. Create one or more drafts for target channels.</li>
            <li>4. Review drafts and add daggers when you support the direction.</li>
            <li>5. Assign ready drafts to the calendar.</li>
            <li>6. Update event status as work moves toward publishing.</li>
            <li>7. Add the live URL after publication.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
