"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PixelGrid } from "./PixelGrid";

const footerNavigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Explore", href: "/explore" },
];

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteFooter() {
  const pathname = usePathname();

  return (
    <footer className="site-footer">
      <div className="site-footer-play">
        <PixelGrid />
      </div>

      <div className="site-footer-signoff">
        <p className="site-footer-word" aria-label="Kubo Archive">
          kubo.archive
        </p>
        <div className="site-footer-meta">
          <p>© 2026</p>
          <nav aria-label="Footer">
            {footerNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  isActivePath(pathname, item.href) ? "page" : undefined
                }
              >
                {item.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
