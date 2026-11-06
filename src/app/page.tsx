import { HomeHero } from "@/components/sections/HomeHero";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function Home() {
  return (
    <main className="home-page" id="home">
      <SiteHeader />
      <HomeHero />
    </main>
  );
}
