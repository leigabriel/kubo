"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Explore", href: "/explore" },
];

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const countFormatter = new Intl.NumberFormat("en-US");

function formatCount(count: number) {
  return countFormatter.format(count);
}

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [isStarring, setIsStarring] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const lightSections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-header-theme='light']"),
    );

    if (lightSections.length === 0) {
      setIsLight(false);
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const headerBounds = header.getBoundingClientRect();
      const headerCenter = headerBounds.top + headerBounds.height / 2;
      const overLightSection = lightSections.some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= headerCenter && rect.bottom > 0;
      });

      setIsLight(overLightSection);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;

    void (async () => {
      try {
        const { data, error } = await supabase
          .from("site_stats")
          .select("count")
          .eq("key", "stars")
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          if (error.code === "42P01" || error.code === "PGRST205") {
            console.warn(
              "Star counter table is missing. Run supabase/migrations/20261107000001_create_site_stats.sql in the Supabase SQL editor.",
            );
          } else {
            console.error("Could not load star count", error);
          }
          setStarCount(0);
          return;
        }

        setStarCount(Number(data?.count ?? 0));
      } catch (error) {
        if (cancelled) return;
        console.error("Could not load star count", error);
        setStarCount(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleStarClick() {
    if (isStarring) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setIsStarring(true);

    try {
      const { data, error } = await supabase.rpc("increment_star_count");

      if (error) {
        if (
          error.code === "42P01" ||
          error.code === "PGRST202" ||
          error.code === "PGRST205"
        ) {
          console.warn(
            "Star counter is not set up. Run supabase/migrations/20261107000001_create_site_stats.sql in the Supabase SQL editor.",
          );
        } else {
          console.error("Could not increment star count", error);
        }
        return;
      }

      const nextCount = data == null ? null : Number(data);
      setStarCount((current) =>
        nextCount !== null && Number.isFinite(nextCount)
          ? nextCount
          : (current ?? 0) + 1,
      );
    } catch (error) {
      console.error("Could not increment star count", error);
    } finally {
      setIsStarring(false);
    }
  }

  const countDescription =
    starCount === null
      ? ""
      : starCount === 1
        ? ", 1 star"
        : `, ${formatCount(starCount)} stars`;

  return (
    <header
      ref={headerRef}
      className={`site-header${isLight ? " is-light" : ""}`}
    >
      <Link className="site-brand" href="/" aria-label="Kubo Archive home">
        K.A
      </Link>

      <nav className="primary-navigation" aria-label="Main navigation">
        {navigation.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "is-active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        className={`site-star${isStarring ? " is-starring" : ""}`}
        onClick={handleStarClick}
        disabled={isStarring}
        aria-label={`Star Kubo Archive${countDescription}`}
        title="Add a star"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z" />
        </svg>
        <span className="site-star-count" aria-live="polite">
          {starCount === null ? "—" : formatCount(starCount)}
        </span>
      </button>
    </header>
  );
}
