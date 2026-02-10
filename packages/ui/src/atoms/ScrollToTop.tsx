"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "../lib/utils";

export interface ScrollToTopProps {
  /** Scroll threshold in pixels before showing the button */
  threshold?: number;
  /** Custom className */
  className?: string;
}

export function ScrollToTop({ threshold = 300, className }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    let scrollElement: Element | null = null;
    let intervalId: ReturnType<typeof setInterval>;

    const toggleVisibility = () => {
      // Try to find the OverlayScrollbars viewport
      const osViewport = document.querySelector('[data-overlayscrollbars-viewport]');
      if (osViewport) {
        setIsVisible(osViewport.scrollTop > threshold);
      } else {
        // Fallback to window
        setIsVisible(window.scrollY > threshold);
      }
    };

    const setupListener = () => {
      const osViewport = document.querySelector('[data-overlayscrollbars-viewport]');

      if (osViewport && osViewport !== scrollElement) {
        // Remove old listener if exists
        if (scrollElement) {
          scrollElement.removeEventListener("scroll", toggleVisibility);
        }

        scrollElement = osViewport;
        scrollElement.addEventListener("scroll", toggleVisibility, { passive: true });
        toggleVisibility();

        // Stop polling once we found it
        if (intervalId) {
          clearInterval(intervalId);
        }
      } else if (!osViewport && !scrollElement) {
        // Use window as fallback
        window.addEventListener("scroll", toggleVisibility, { passive: true });
        toggleVisibility();
      }
    };

    // Initial setup
    setupListener();

    // Poll for OverlayScrollbars initialization (it may initialize after this component)
    intervalId = setInterval(setupListener, 100);

    // Stop polling after 2 seconds
    setTimeout(() => {
      if (intervalId) clearInterval(intervalId);
    }, 2000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", toggleVisibility);
      }
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, [threshold]);

  const scrollToTop = () => {
    const osViewport = document.querySelector('[data-overlayscrollbars-viewport]');
    if (osViewport) {
      osViewport.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-[9999] p-3 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/25",
        "hover:bg-primary/90 hover:scale-110 active:scale-95",
        "transition-all duration-300 ease-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
        className
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
