import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "APEX — Frontend Development Agent",
  description: "Autonomous AI Agent for Frontend Development. Scans, analyzes, plans, and executes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="scan-overlay">{children}</body>
    </html>
  );
}
