import { HomeHero } from "@/components/sections/HomeHero";
import { HomeSignature } from "@/components/sections/HomeSignature";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PageMotion } from "@/components/motion/PageMotion";

export default function Home() {
  return (
    <main className="home-page" id="home">
      <SiteHeader />
      <HomeHero />
      <HomeSignature />
      <PageMotion />
    </main>
  );
}
