import type { Metadata } from "next";
import Providers from "@/app/providers";
import "@/index.css";

export const metadata: Metadata = {
  title: "RaidGuild Content Calendar",
  description:
    "Internal social content calendar for RaidGuild publishing plans, drafts, channel targets, and agent-created events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
