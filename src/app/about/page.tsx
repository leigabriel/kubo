import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageMotion } from "@/components/motion/PageMotion";

export const metadata: Metadata = {
  title: "About — Kubo",
  description:
    "Kubo is a creative digital space for discovering, organizing, and exploring digital assets through a simple, immersive experience.",
};

export default function AboutPage() {
  return (
    <main className="about-page" id="about">
      <SiteHeader />
      <PageMotion />

      {/* Hero — massive page wordmark, no imagery */}
      <section className="about-hero" data-intro aria-labelledby="about-title">
        <p className="about-kicker">A creative digital space</p>
        <h1 className="about-hero-word" id="about-title" aria-label="About">
          About
        </h1>
        <div className="about-rule" />
        <p className="about-hero-sub">
          Kubo is a creative digital space for discovering, organizing, and
          exploring digital assets — through a simple, immersive experience.
          One place to keep what you make and find what you need next.
        </p>
      </section>

      {/* Intro — three columns, small text */}
      <section className="about-intro" data-reveal aria-label="About Kubo">
        <div className="about-col">
          <p className="about-col-label">What is Kubo — 01 / 03</p>
          <p>
            Kubo is a friendly creative space for assets that feel fresh and
            interesting, but not so niche that nobody has seen them. It
            welcomes everyone, and isn&apos;t so mainstream that it&apos;s
            boring or predictable.
          </p>
          <p>
            Kubo brings the right files together at the right moment. It keeps
            the focus on what&apos;s worth keeping — and makes the art of
            finding it / easy / and packaging it into simple executions.
          </p>
        </div>
        <div className="about-col">
          <p className="about-col-label">How Kubo works — 02 / 03</p>
          <p>
            Exploring Kubo is calm, fast, and tactile. Every file — 3D, motion,
            image, type — sits in one bright grid. Search, preview, and pull
            it in, without walls or noise.
          </p>
          <p>
            Kubo moves you from curiosity to collection in seconds, not tabs.
            Everything stays close, easy to find, and easy to share, so
            discovery never turns into a hunt.
          </p>
        </div>
        <div className="about-col">
          <p className="about-col-label">Why Kubo — 03 / 03</p>
          <p>
            At the end of the day, Kubo is about discovery that feels good. It
            cares about how assets feel, not just how they look — an identity
            rooted in clear values and a fresh perspective, with a
            _game-changing visual language_ that shapes how people build with
            it.
          </p>
          <p>
            If you came looking for something to build with, you&apos;re in the
            right room. Kubo is where that building starts.
          </p>
        </div>
      </section>

      {/* Services — huge Geist Pixel capability list, no images */}
      <section
        className="about-services"
        data-reveal
        aria-labelledby="about-services-title"
      >
        <p className="about-section-label" id="about-services-title">
          What Kubo does
        </p>
        <p className="about-capabilities">
          Search and Discover, Sort and Organize, 3D and Motion, Visual and
          Brand Identity, Image and Photography, Video and Sound, Texture and
          Material, Type and Typography, Prototype and UI/UX, Curate, Collect,
          Share and Build
        </p>
        <aside className="about-note">
          Every asset in Kubo is unique as the people who made it. When
          diverse files come together in one place, it becomes a stronger
          collection — truly bespoke to the way you build.
        </aside>
      </section>

      {/* Values — four small columns */}
      <section className="about-values" aria-labelledby="about-values-title">
        <p className="about-section-label" id="about-values-title">
          How Kubo works
        </p>
        <div className="about-values-grid" data-reveal-group>
          <div className="about-value">
            <h3>
              <span>No Fluff.</span>
            </h3>
            <p>
              Kubo is realistic. Creators have goals, budgets, and timelines.
              Kubo stays true to that — simple, direct, and honest.
            </p>
          </div>
          <div className="about-value">
            <h3>
              <span> Education </span>is deeply rooted in how Kubo helps you
              discover.
            </h3>
            <p>
              Finding the right asset is hard, and it can be overwhelming. Kubo
              makes it an easy / way to pull together files, see what&apos;s
              inside them, and get excited about what&apos;s next.
            </p>
          </div>
          <div className="about-value">
            <h3>
              <span>Systems Oriented.</span>
            </h3>
            <p>
              Collections should be flexible. They should work well across
              different projects and stages. Building a library with systematic
              thinking gives you more power to grow — for the long run, not
              just today.
            </p>
          </div>
          <div className="about-value">
            <h3>
              <span>Fun.</span>
            </h3>
            <p>
              Discovery should be fun! It&apos;s the visual magic that pulls
              people in and makes them go, &quot;whoa, what!&quot; Kubo is
              strategic, but it&apos;s still a form of art and should make you
              feel something. Why not be playful and expressive with it?
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
