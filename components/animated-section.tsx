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
    // Fail-proof backup timeout: force reveal after 800ms if observer fails on mobile Safari/Chrome
    const backupTimeout = setTimeout(() => {
      setIsRevealed(true);
    }, 800);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          clearTimeout(backupTimeout);
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
      clearTimeout(backupTimeout);
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
