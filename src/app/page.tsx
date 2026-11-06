import { HomeHero } from "@/components/sections/HomeHero";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PageMotion } from "@/components/motion/PageMotion";

export default function Home() {
  return (
    <main className="home-page" id="home">
      <SiteHeader />
      <HomeHero />
      <PageMotion />
    </main>
  );
}
