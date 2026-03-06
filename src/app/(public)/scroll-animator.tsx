"use client";

import { useEffect } from "react";

/**
 * Applies scroll-triggered fade-in animations to all landing page sections.
 * Uses IntersectionObserver — no wrapping individual elements needed.
 * Add data-animate attribute to any element you want animated.
 */
export function ScrollAnimator() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "-40px" }
    );

    // Observe all elements with data-animate
    document.querySelectorAll("[data-animate]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
