import Link from "next/link";

const footerNavigation = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Explore", href: "/explore" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Archive",
    links: [
      { label: "The Archive Box", href: "/explore" },
      { label: "On Keeping Things", href: "/explore" },
      { label: "A Taxonomy of Useful Things", href: "/explore" },
      { label: "Open to Interpretation", href: "/explore" },
    ],
  },
  {
    title: "Formats",
    links: [
      { label: "3D and Motion", href: "/explore" },
      { label: "Image and Photography", href: "/explore" },
      { label: "Type and Typography", href: "/explore" },
      { label: "Texture and Material", href: "/explore" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer" data-header-theme="light">
      <nav className="site-footer-directory" aria-label="Footer">
        {footerNavigation.map((group) => (
          <div className="site-footer-column" key={group.title}>
            <p className="site-footer-column-title">{group.title}</p>
            <ul>
              {group.links.map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="site-footer-mark">
        <div className="site-footer-wordmark">
          <span
            className="site-footer-glow site-footer-glow-warm"
            aria-hidden="true"
          >
            kubo.archive
          </span>
          <span className="site-footer-glow" aria-hidden="true">
            kubo.archive
          </span>
          <p className="site-footer-word" aria-hidden="true">
            kubo.archive
          </p>
        </div>
      </div>

      <div className="site-footer-meta">
        <p>Copyright © 2026 Kubo</p>
        <p>All rights reserved.</p>
      </div>
    </footer>
  );
}
