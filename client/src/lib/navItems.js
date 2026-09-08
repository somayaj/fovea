import {
  IconBrainstorm,
  IconCalendar,
  IconFocus,
  IconList,
} from "../components/icons.jsx";
import { ROADMAP_ENABLED } from "./features.js";

/** Primary app sections — shared by sidebar and mobile tab bar. */
export const APP_NAV = [
  {
    id: "focus",
    to: "/",
    end: true,
    label: "Focus",
    icon: IconFocus,
    hint: "This week",
    matchActive: (_, location) => location.pathname === "/",
  },
  {
    id: "tasks",
    to: "/map",
    end: true,
    label: "Tasks",
    icon: IconList,
    hint: "All workstreams",
    matchActive: (_, location) =>
      location.pathname === "/map" && !new URLSearchParams(location.search).get("channel"),
    onNavigate: () => window.dispatchEvent(new CustomEvent("fovea:reset-map")),
  },
  ...(ROADMAP_ENABLED
    ? [
        {
          id: "roadmap",
          to: "/roadmap",
          label: "Roadmap",
          icon: IconCalendar,
          hint: "12 months",
        },
      ]
    : []),
  {
    id: "brainstorm",
    to: "/brainstorm",
    label: "Brainstorm",
    icon: IconBrainstorm,
    hint: "Ideas",
  },
];

export function isNavItemActive(item, location) {
  if (item.matchActive) return item.matchActive(null, location);
  const path = item.to || "/";
  if (item.end) return location.pathname === path;
  return location.pathname === path || location.pathname.startsWith(`${path}/`);
}
