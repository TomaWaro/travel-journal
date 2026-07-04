type BadgeProps = {
  children: string;
};

export function LocationBadge({ children }: BadgeProps) {
  return <span className="location-badge">{children}</span>;
}

export function DateBadge({ children }: BadgeProps) {
  return <span className="date-badge">{children}</span>;
}
