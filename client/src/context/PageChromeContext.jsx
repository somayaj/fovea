import { createContext, useContext } from "react";
import { useDarkChrome } from "../lib/useDarkChrome.js";

const PageChromeContext = createContext({ dark: false });

export function PageChromeProvider({ children }) {
  const dark = useDarkChrome();
  return <PageChromeContext.Provider value={{ dark }}>{children}</PageChromeContext.Provider>;
}

export function usePageChrome() {
  return useContext(PageChromeContext);
}
