import Link from "next/link";

const navigation = [
  { label: "Explore Assets", href: "/explore" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-mark" href="/" aria-label="Kubo home">
        <svg
          aria-hidden="true"
          viewBox="0 0 32 32"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="13" y="2" width="6" height="28" />
          <rect x="13" y="2" width="6" height="28" transform="rotate(60 16 16)" />
          <rect x="13" y="2" width="6" height="28" transform="rotate(120 16 16)" />
        </svg>
      </Link>

      <nav className="primary-navigation" aria-label="Main navigation">
        {navigation.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link className="sign-in-link" href="/sign-in">
          Sign In
        </Link>
      </nav>
    </header>
  );
}
