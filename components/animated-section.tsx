"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
  delay?: number;
};

export function AnimatedSection({ children, className = "", id, delay = 0 }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section
      ref={ref}
      className={`animated-section ${isRevealed ? "is-revealed" : ""} ${className}`.trim()}
      id={id}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}
