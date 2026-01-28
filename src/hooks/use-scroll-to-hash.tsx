import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const useScrollToHash = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (hash) {
      // Small delay to ensure the page has rendered
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      // Scroll to top when navigating to a page without hash
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hash, pathname]);
};

export const ScrollToHash = () => {
  useScrollToHash();
  return null;
};
