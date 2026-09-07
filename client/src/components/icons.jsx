/** Lightweight SVG icons — stroke-based, 24×24 viewBox. */
const defaults = {
  size: 16,
  strokeWidth: 1.75,
  className: "",
};

function Icon({ children, size, strokeWidth, className, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconFocus(props) {
  return (
    <Icon {...defaults} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M16.9 16.9l2.1 2.1M4.9 19.1l2.1-2.1M16.9 7.1l2.1-2.1" />
    </Icon>
  );
}

export function IconMap(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
      <path d="M9 4v14M15 6v14" />
    </Icon>
  );
}

export function IconList(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconBoard(props) {
  return (
    <Icon {...defaults} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  );
}

export function IconBrainstorm(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M9.5 2A5.5 5.5 0 0 0 4 8.5c0 2.1 1.2 3.9 3 4.8V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3.7c1.8-.9 3-2.7 3-4.8A5.5 5.5 0 0 0 14.5 2" />
      <path d="M9.5 22h5" />
    </Icon>
  );
}

export function IconCalendar(props) {
  return (
    <Icon {...defaults} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Icon>
  );
}

export function IconPlus(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconSearch(props) {
  return (
    <Icon {...defaults} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </Icon>
  );
}

export function IconLink(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.5-1.5" />
    </Icon>
  );
}

export function IconNodes(props) {
  return (
    <Icon {...defaults} {...props}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M8.5 8.5L15.5 15.5" />
    </Icon>
  );
}

export function IconTarget(props) {
  return (
    <Icon {...defaults} {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </Icon>
  );
}

export function IconHash(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" />
    </Icon>
  );
}

export function IconClock(props) {
  return (
    <Icon {...defaults} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icon>
  );
}

export function IconArrowRight(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function IconLayers(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
    </Icon>
  );
}

export function IconSpark(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
    </Icon>
  );
}

export function IconQuote(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M7 7h4v6H6a2 2 0 0 1-2-2V7zM17 7h4v6h-5a2 2 0 0 1-2-2V7z" />
    </Icon>
  );
}

export function IconChevronLeft(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M15 18l-6-6 6-6" />
    </Icon>
  );
}

export function IconChevronRight(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M9 18l6-6-6-6" />
    </Icon>
  );
}

export function IconPanelLeft(props) {
  return (
    <Icon {...defaults} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </Icon>
  );
}

export function IconEdit(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Icon>
  );
}

export function IconUsers(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

export function IconTrash(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </Icon>
  );
}

export function IconArchive(props) {
  return (
    <Icon {...defaults} {...props}>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </Icon>
  );
}

export function IconCheck(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M20 6L9 17l-5-5" />
    </Icon>
  );
}

export function IconTimeline(props) {
  return (
    <Icon {...defaults} {...props}>
      <path d="M3 6h18M3 12h12M3 18h8" />
      <circle cx="19" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="2" fill="currentColor" stroke="none" />
    </Icon>
  );
}
