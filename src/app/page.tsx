import { HomeArchive } from "@/components/sections/HomeArchive";
import { HomeHero } from "@/components/sections/HomeHero";
import { HomeModel } from "@/components/sections/HomeModel";
import { HomeSignature } from "@/components/sections/HomeSignature";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PageMotion } from "@/components/motion/PageMotion";

export default function Home() {
  return (
    <main className="home-page" id="home">
      <SiteHeader />
      <HomeHero />
      <HomeSignature />
      <HomeArchive />
      <SiteFooter />
      <HomeModel />
      <PageMotion />
    </main>
  );
}
