"use client";

import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type CategoryKind =
  | "models"
  | "icons"
  | "components"
  | "wallpapers"
  | "pixel"
  | "all";

type Category = {
  index: string;
  name: string;
  description: string;
  href: string;
  kind: CategoryKind;
  accent: string;
};

const categories: Category[] = [
  {
    index: "01",
    name: "3D Models",
    description: "Objects, props, and scenes in three dimensions.",
    href: "/explore",
    kind: "models",
    accent: "#ff9a5f",
  },
  {
    index: "02",
    name: "UI Icons",
    description: "Small marks for interfaces and systems.",
    href: "/explore/ui-icons",
    kind: "icons",
    accent: "#ffb877",
  },
  {
    index: "03",
    name: "Components",
    description: "Interface pieces ready to assemble.",
    href: "/explore/components",
    kind: "components",
    accent: "#ff8ccf",
  },
  {
    index: "04",
    name: "Wallpapers",
    description: "Backgrounds for screens and spaces.",
    href: "/explore/wallpapers",
    kind: "wallpapers",
    accent: "#c7a5ff",
  },
  {
    index: "05",
    name: "Pixel Playground",
    description: "A small canvas for making marks.",
    href: "/explore/pixel-playground",
    kind: "pixel",
    accent: "#ff8a3d",
  },
  {
    index: "06",
    name: "All Assets",
    description: "The complete Kubo archive, in one place.",
    href: "/explore",
    kind: "all",
    accent: "#f7f7f7",
  },
];

function CategoryGlyph({ kind }: { kind: CategoryKind }) {
  if (kind === "models") {
    return (
      <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M60 8 104 32v30L60 86 16 62V32z" />
        <path d="M16 32 60 56l44-24M60 56v30" />
        <path d="M38 20 82 44v30L38 50z" opacity=".35" />
      </svg>
    );
  }

  if (kind === "icons") {
    return (
      <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="18" y="10" width="20" height="20" rx="2" />
        <circle cx="60" cy="20" r="10" />
        <path d="M88 10h20v20H88z" />
        <path d="M18 46h20v20H18z" />
        <path d="M60 46 70 66H50z" />
        <circle cx="98" cy="56" r="10" />
      </svg>
    );
  }

  if (kind === "components") {
    return (
      <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="18" y="12" width="84" height="16" rx="2" />
        <rect x="18" y="34" width="52" height="16" rx="2" />
        <rect x="76" y="34" width="26" height="16" rx="2" />
        <rect x="18" y="56" width="30" height="12" rx="2" />
        <rect x="54" y="56" width="48" height="12" rx="2" />
      </svg>
    );
  }

  if (kind === "wallpapers") {
    return (
      <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="18" y="10" width="84" height="60" rx="2" />
        <circle cx="78" cy="28" r="8" />
        <path d="m18 58 24-22 20 18 16-12 24 22" />
      </svg>
    );
  }

  if (kind === "pixel") {
    return (
      <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth="1.2">
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 7 }, (_, column) => {
            const filled = (row + column) % 3 === 0;
            return (
              <rect
                key={`${row}-${column}`}
                x={20 + column * 12}
                y={10 + row * 12}
                width="11"
                height="11"
                fill={filled ? "currentColor" : "none"}
                opacity={filled ? 0.8 : 0.45}
              />
            );
          }),
        )}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M18 12h84v56H18z" opacity=".35" />
      <path d="M18 12l84 56M102 12 18 68M60 12v56M18 40h84" opacity=".55" />
    </svg>
  );
}

export function HomeCategories() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const section = sectionRef.current;
      if (!section) return;

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 72%",
          once: true,
        },
      });

      tl.from(".categories-kicker, .categories-title, .categories-lede", {
        y: 26,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.08,
      })
        .from(
          ".categories-rule",
          { scaleX: 0, transformOrigin: "left center", duration: 1 },
          0.15,
        )
        .from(
          ".category-card",
          { y: 36, autoAlpha: 0, duration: 0.75, stagger: 0.07 },
          0.25,
        );

      gsap.to(".category-glyph", {
        yPercent: -7,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="categories"
      className="home-categories"
      data-home-section="categories"
      aria-labelledby="categories-title"
    >
      <header className="categories-head">
        <div>
          <p className="categories-kicker">Browse by type</p>
          <h2 className="categories-title" id="categories-title">
            Categories
          </h2>
        </div>
        <p className="categories-lede">
          Find what you need by the kind of thing it is — objects, icons,
          components, wallpapers, and small experiments.
        </p>
      </header>

      <div className="categories-rule" aria-hidden="true" />

      <div className="categories-grid">
        {categories.map((category) => (
          <Link
            key={category.index}
            href={category.href}
            className={`category-card${category.kind === "all" ? " category-card-all" : ""}`}
            style={{ "--category-accent": category.accent } as CSSProperties}
          >
            <span className="category-card-top">
              <span className="category-index">{category.index}</span>
              <span className="category-arrow" aria-hidden="true">
                ↗
              </span>
            </span>

            <span className="category-glyph" aria-hidden="true">
              <CategoryGlyph kind={category.kind} />
            </span>

            <span className="category-card-body">
              <span className="category-name">{category.name}</span>
              <span className="category-description">
                {category.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
