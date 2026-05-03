import { lazy, Suspense, useEffect, useRef, useState } from "react";

const ServiceKey3D = lazy(() =>
  import("./ServiceKey3D").then((m) => ({ default: m.ServiceKey3D }))
);

interface Props {
  variant: "gold" | "silver" | "bronze" | "emerald";
  isHovered: boolean;
  className?: string;
}

/**
 * Lazy wrapper around the heavy Three.js ServiceKey3D.
 * Loads the WebGL bundle only when the key is scrolled into view,
 * so the home-page first paint never depends on Three.js / @react-three/*.
 */
export const ServiceKey3DLazy = ({ variant, isHovered, className = "" }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;
    const el = ref.current;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const fallback = (
    <div
      className={`pointer-events-none ${className}`}
      style={{
        background:
          "radial-gradient(circle at 50% 40%, hsl(45 70% 55% / 0.45), transparent 70%)",
        borderRadius: "9999px",
      }}
      aria-hidden="true"
    />
  );

  return (
    <div ref={ref} className={className}>
      {visible ? (
        <Suspense fallback={fallback}>
          <ServiceKey3D variant={variant} isHovered={isHovered} className={className} />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
};

export default ServiceKey3DLazy;