import Image from "next/image";
import Link from "next/link";
import { DateBadge, LocationBadge } from "@/components/editorial-badges";

type Props = {
  href: string;
  title: string;
  summary: string;
  imageUrl?: string | null;
  eyebrow?: string;
  date?: string;
  location?: string;
  stats?: string;
};

export function ArticleCard({
  href,
  title,
  summary,
  imageUrl,
  eyebrow,
  date,
  location,
  stats
}: Props) {
  return (
    <article className="article-card">
      <Link className="article-card-link" href={href}>
        {imageUrl ? (
          <div className="article-card-media">
            <Image alt={title} fill sizes="(max-width: 879px) 100vw, 50vw" src={imageUrl} />
          </div>
        ) : (
          <div className="article-card-media article-card-media-fallback">
            <span>Travel diary</span>
          </div>
        )}
        <div className="article-card-body">
          <div className="article-card-meta">
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            {date ? <DateBadge>{date}</DateBadge> : null}
            {location ? <LocationBadge>{location}</LocationBadge> : null}
          </div>
          <h3>{title}</h3>
          <p>{summary}</p>
          {stats ? <span className="article-card-stats">{stats}</span> : null}
        </div>
      </Link>
    </article>
  );
}
