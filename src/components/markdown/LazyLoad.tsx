import React, { useEffect, useRef, useState } from 'react';

interface LazyLoadProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

/**
 * LazyLoad Component
 *
 * Uses Intersection Observer to defer rendering of children until they enter the viewport.
 * Improves initial page load performance by not rendering off-screen content.
 *
 * @param children - Content to lazy load
 * @param placeholder - Content to show while lazy loading
 * @param rootMargin - Margin around the viewport to trigger loading (default: '50px')
 * @param threshold - Percentage of visibility required to trigger loading (default: 0.01)
 * @param className - Additional CSS classes for the wrapper
 */
export const LazyLoad = React.memo(function LazyLoad({
  children,
  placeholder,
  rootMargin = '50px',
  threshold = 0.01,
  className = '',
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, disconnect observer
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : placeholder}
    </div>
  );
});
