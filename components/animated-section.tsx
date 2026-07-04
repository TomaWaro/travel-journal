import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function AnimatedSection({ children, className = "", id }: Props) {
  return (
    <section className={`animated-section ${className}`.trim()} id={id}>
      {children}
    </section>
  );
}
