import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PageMotion } from "@/components/motion/PageMotion";

export const metadata: Metadata = {
  title: "Login — Kubo",
  description: "Sign in to Kubo.",
};

export default function LoginPage() {
  return (
    <main className="collection-page" id="login">
      <SiteHeader />
      <PageMotion />

      <section
        className="collection-empty"
        aria-labelledby="login-title"
        data-intro
      >
        <p className="collection-kicker">Kubo Archive</p>
        <h1 className="collection-title" id="login-title">
          Login / Sign in
        </h1>
        <p className="collection-note">
          Accounts aren&apos;t connected yet. The archive is open to everyone
          for now.
        </p>
        <Link className="collection-back" href="/">
          Back to home <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
