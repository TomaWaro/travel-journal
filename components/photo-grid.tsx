import Image from "next/image";

type GridItem = {
  id: string;
  type: "photo" | "video" | "audio" | "text";
  title: string;
  body?: string;
  url: string;
};

type Props = {
  items: GridItem[];
};

export function PhotoGrid({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <strong>La galerie s&apos;ouvrira avec les premiers souvenirs.</strong>
        <p>Photos, videos et notes publiees apparaitront ici au fil du voyage.</p>
      </div>
    );
  }

  return (
    <div className="photo-grid">
      {items.map((item, index) => (
        <figure
          className={`photo-grid-item photo-grid-item-${(index % 5) + 1}`}
          key={item.id}
        >
          {item.type === "photo" ? (
            <Image
              alt={item.title}
              fill
              sizes="(max-width: 879px) 100vw, 50vw"
              src={item.url}
            />
          ) : item.type === "video" ? (
            <video controls playsInline preload="metadata" src={item.url} />
          ) : item.type === "audio" ? (
            <audio controls preload="metadata" src={item.url} />
          ) : (
            <div className="photo-grid-text-fallback">
              <span className="note-accent">{item.title}</span>
              {item.body ? <p>{item.body}</p> : null}
            </div>
          )}
          <figcaption>
            <span className="photo-grid-caption">{item.title}</span>
            {item.body ? <p>{item.body}</p> : null}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
