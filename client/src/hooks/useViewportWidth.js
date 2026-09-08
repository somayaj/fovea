import { useEffect, useState } from "react";

import { isMobileShell } from "../lib/mobileShell.js";

export function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

export function useIsMobile(breakpoint = 1024) {
  const width = useViewportWidth();
  if (isMobileShell()) return true;
  return width < breakpoint;
}
