import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <p className="eyebrow">Travel Journal</p>
          <h2>Un carnet de route vivant, pense pour etre relu plus tard.</h2>
        </div>
        <div className="site-footer-links">
          <Link href="/">Accueil</Link>
          <span>Photos, route, recits, commentaires</span>
        </div>
      </div>
    </footer>
  );
}
