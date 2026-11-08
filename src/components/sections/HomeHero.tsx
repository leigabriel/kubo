"use client";

import dynamic from "next/dynamic";

const TechText = dynamic(() => import("./TechText"), { ssr: false });

export function HomeHero() {
  const cores =
    typeof navigator !== "undefined" ? navigator.hardwareConcurrency : 8;
  const lowEnd = cores <= 4;

  return (
    <section
      className="home-hero"
      data-intro
      data-home-section="home"
      aria-labelledby="hero-title"
    >
      <div className="hero-model-anchor" aria-hidden="true" />
      <h1 className="hero-title sr-only" id="hero-title">
        KUBO
      </h1>
      <div className="hero-tech" aria-hidden="true">
        <TechText
          text="KUBO"
          fontFamily="'Gravelands', 'Impact', sans-serif"
          fontWeight={400}
          fontSize={2000}
          letterSpacing={0.03}
          color="#f7f7f7"
          accentColor="#f7f7f7"
          align="center"
          reach={lowEnd ? 200 : 260}
          softness={0.7}
          dashLength={4}
          dashGap={2}
          strokeWidth={1.5}
          reveal="letter"
          specks={lowEnd ? 6 : 10}
          selection
          labels={false}
          draggable={!lowEnd}
          bounce={0.4}
          clickKick={!lowEnd}
          sweep={!lowEnd}
          intro="none"
          introDuration={2}
          guides={false}
        />
      </div>
    </section>
  );
}
