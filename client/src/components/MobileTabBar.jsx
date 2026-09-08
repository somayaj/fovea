import { NavLink, useLocation } from "react-router-dom";
import { APP_NAV, isNavItemActive } from "../lib/navItems.js";
import { cn } from "../lib/tw.js";

export default function MobileTabBar() {
  const location = useLocation();

  return (
    <nav className="mobile-tab-bar" aria-label="Main navigation">
      <ul className="mobile-tab-bar-list">
        {APP_NAV.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(item, location);

          return (
            <li key={item.id} className="min-w-0 flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                onClick={() => item.onNavigate?.()}
                className={cn("mobile-tab-bar-item", active && "mobile-tab-bar-item--active")}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                <span className="mobile-tab-bar-label">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
