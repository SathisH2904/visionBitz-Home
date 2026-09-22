import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Scrolls the window to the top on route change — unless the URL has a
// hash (e.g. /#industries), in which case it scrolls to that section
// instead of overriding the browser's anchor-jump behavior.
export default function ScrollToTopOnRouteChange() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}