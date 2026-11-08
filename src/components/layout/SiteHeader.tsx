"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { getSupabaseClient } from "@/lib/supabase/client";

const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
];

const exploreMenu = [
  { label: "3d Models", href: "/explore" },
  { label: "UI Icons", href: "/explore/ui-icons" },
  { label: "Components", href: "/explore/components" },
  { label: "Wallpapers", href: "/explore/wallpapers" },
  { label: "Pixel Playground", href: "/explore/pixel-playground" },
];

const EXPLORE_MENU_CLOSE_MS = 280;

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isMenuActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/explore") return pathname === "/explore";
  return pathname === href;
}

const countFormatter = new Intl.NumberFormat("en-US");

function formatCount(count: number) {
  return countFormatter.format(count);
}

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const exploreButtonRef = useRef<HTMLButtonElement>(null);
  const exploreMenuRef = useRef<HTMLDivElement>(null);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [isStarring, setIsStarring] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isExploreClosing, setIsExploreClosing] = useState(false);

  const lenis = useLenis(() => {}, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const lightSections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-header-theme='light']"),
    );

    if (lightSections.length === 0) {
      const frame = window.requestAnimationFrame(() => setIsLight(false));
      return () => window.cancelAnimationFrame(frame);
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

  const closeExploreMenu = useCallback(() => {
    setIsExploreClosing(true);
  }, []);

  useEffect(() => {
    if (!isExploreClosing) return;

    const timeout = window.setTimeout(() => {
      setIsExploreOpen(false);
      setIsExploreClosing(false);
    }, EXPLORE_MENU_CLOSE_MS);

    return () => window.clearTimeout(timeout);
  }, [isExploreClosing]);

  useEffect(() => {
    if (!isExploreOpen) return;

    const menu = exploreMenuRef.current;
    const exploreButton = exploreButtonRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    menu?.querySelector<HTMLElement>(".explore-menu-close")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeExploreMenu();
        return;
      }

      if (event.key !== "Tab" || !menu) return;

      const items = Array.from(
        menu.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      lenis?.start();

      if (previouslyFocused && previouslyFocused !== document.body) {
        previouslyFocused.focus();
      } else {
        exploreButton?.focus();
      }
    };
  }, [isExploreOpen, lenis, closeExploreMenu]);

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

  const explorePathActive = isActivePath(pathname, "/explore");
  const exploreActive = isExploreOpen || explorePathActive;

  return (
    <>
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

          <button
            ref={exploreButtonRef}
            type="button"
            className={exploreActive ? "is-active" : undefined}
            onClick={() => {
              if (isExploreOpen) {
                if (!isExploreClosing) closeExploreMenu();
                return;
              }

              setIsExploreClosing(false);
              setIsExploreOpen(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={isExploreOpen}
            aria-controls="explore-menu"
            aria-current={explorePathActive ? "page" : undefined}
          >
            Explore
          </button>
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

      {isExploreOpen ? (
        <>
          <button
            type="button"
            className={`explore-menu-backdrop${isExploreClosing ? " is-closing" : ""}`}
            aria-label="Close explore menu"
            tabIndex={-1}
            onClick={closeExploreMenu}
          />

          <div
            ref={exploreMenuRef}
            id="explore-menu"
            className={`explore-menu${isLight ? " is-dark" : ""}${isExploreClosing ? " is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="explore-menu-title"
          >
            <div className="explore-menu-top">
              <span className="explore-menu-brand">K.A</span>
              <button
                type="button"
                className="explore-menu-close"
                onClick={closeExploreMenu}
                aria-label="Close explore menu"
              >
                ( × )
              </button>
            </div>

            <div className="explore-menu-body">
              <h2 className="explore-menu-title" id="explore-menu-title">
                Explore
              </h2>
              <nav
                className="explore-menu-links"
                aria-label="Explore categories"
              >
                {exploreMenu.map((item, index) => {
                  const active = isMenuActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={active ? "is-active" : undefined}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setIsExploreOpen(false)}
                    >
                      <span className="explore-menu-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="explore-menu-label">{item.label}</span>
                      <span className="explore-menu-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="explore-menu-foot">
              <span className="explore-menu-foot-note">
                A living index of things worth keeping.
              </span>
              <Link href="/explore" onClick={() => setIsExploreOpen(false)}>
                All assets <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
