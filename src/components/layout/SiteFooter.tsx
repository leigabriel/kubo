import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer" data-reveal>
      <p className="site-footer-by">BY KUBO</p>
      <p className="site-footer-word" aria-label="KUBO">
        KUBO
      </p>
      <div className="site-footer-meta">
        <p>© KUBO 2026</p>
        <nav aria-label="Footer">
          <Link href="/">HOME</Link>
          <Link href="/about" aria-current="page">
            ABOUT
          </Link>
          <Link href="/explore">EXPLORE</Link>
        </nav>
      </div>
    </footer>
  );
}
