import { lazy, Suspense, useEffect, useRef, useState } from "react";

const TreasureChest3D = lazy(() =>
  import("./TreasureChest3D").then((m) => ({ default: m.TreasureChest3D }))
);

interface Props {
  onOpen: () => void;
  isOpen: boolean;
  onLockedClick?: () => void;
}

/**
 * Lazy wrapper around the heavy 3D treasure chest. Loads Three.js +
 * @react-three/fiber + @react-three/drei only when the contact section
 * is actually scrolled into view, so the home-page first paint stays fast.
 */
export const TreasureChest3DLazy = (props: Props) => {
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
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className="w-full flex items-center justify-center"
      style={{ minHeight: 320 }}
    >
      {visible ? (
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="w-48 h-48 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, hsl(45 70% 55% / 0.35), transparent 70%)",
              }}
            />
          }
        >
          <TreasureChest3D {...props} />
        </Suspense>
      ) : (
        <div
          aria-hidden="true"
          className="w-48 h-48 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, hsl(45 70% 55% / 0.35), transparent 70%)",
          }}
        />
      )}
    </div>
  );
};

export default TreasureChest3DLazy;