import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-brand" href="/">
          <span className="site-brand-mark" aria-hidden="true">
            TJ
          </span>
          <span className="site-brand-copy">
            <strong>Travel Journal</strong>
            <em>Editorial diary</em>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Navigation principale">
          <Link className="site-nav-link" href="/">
            Home
          </Link>
          <span className="site-nav-pill">Quasi-public journey</span>
        </nav>
      </div>
    </header>
  );
}
