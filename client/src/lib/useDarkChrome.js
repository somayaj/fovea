import { useTheme } from "../context/ThemeContext.jsx";

/** True when the page header uses dark chrome (e.g. walnut espresso header). */
export function useDarkChrome() {
  const { preset } = useTheme();
  return Boolean(preset.header?.dark ?? preset.sidebar?.dark);
}
