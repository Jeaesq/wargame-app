import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wargame App",
  description: "Turn-based geopolitical wargame prototype"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div>
              <p className="topbar__eyebrow">Wargame App</p>
              <Link className="topbar__brand" href="/">
                Cold War Command Desk
              </Link>
            </div>
            <nav className="topbar__nav" aria-label="Primary">
              <Link href="/">Home</Link>
              <Link href="/games/new">New Game</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
