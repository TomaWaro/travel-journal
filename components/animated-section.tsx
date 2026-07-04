"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
  delay?: number;
};

export function AnimatedSection({ children, className = "", id, delay = 0 }: Props) {
  return (
    <section
      className={`animated-section is-revealed ${className}`.trim()}
      id={id}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}
