export function pictureFilename(prefix) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${prefix}-${y}-${m}-${d}.png`;
}

export async function downloadElementPng(element, filename) {
  if (!element) throw new Error("Nothing to export");
  const { toPng } = await import("html-to-image");
  const paper =
    getComputedStyle(document.documentElement).getPropertyValue("--color-paper").trim() || "#f9f6ee";
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: paper,
    filter: (node) => {
      if (!(node instanceof Element)) return true;
      if (node.dataset?.exportHide === "true") return false;
      if (node.classList?.contains("react-flow__controls")) return false;
      if (node.classList?.contains("react-flow__attribution")) return false;
      if (node.classList?.contains("react-flow__minimap")) return false;
      return true;
    },
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
