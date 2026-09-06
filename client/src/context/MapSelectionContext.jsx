import { createContext, useContext } from "react";

export const MapSelectionContext = createContext(null);

export function useMapSelection() {
  return useContext(MapSelectionContext);
}
