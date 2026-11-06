"use client";

import dynamic from "next/dynamic";

const TechText = dynamic(() => import("./TechText"), { ssr: false });

export function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <h1 className="hero-title sr-only" id="hero-title">
        KUBO
      </h1>
      <div className="hero-tech" aria-hidden="true">
        <TechText
          text="KUBO"
          fontFamily="'Gravelands', 'Impact', sans-serif"
          fontWeight={400}
          fontSize={800}
          letterSpacing={0.03}
          color="#f7f7f7"
          accentColor="#f7f7f7"
          align="center"
          reach={320}
          softness={0.7}
          dashLength={4}
          dashGap={2}
          strokeWidth={1.5}
          reveal="letter"
          specks={15}
          selection
          labels={false}
          draggable
          bounce={0.4}
          clickKick
          intro="none"
          introDuration={2}
          guides={false}
        />
      </div>
    </section>
  );
}
