const SECTION_URLS = {
  Focus: "/",
  Tasks: "/map",
  Brainstorm: "/brainstorm",
  Roadmap: "/roadmap",
  Admin: "/admin",
};

export async function goToSection(page, label) {
  const url = SECTION_URLS[label];
  if (!url) throw new Error(`Unknown section: ${label}`);
  await page.goto(url);
}

export async function goToMobileSection(page, label) {
  const tab = page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", {
    name: label,
    exact: true,
  });
  await tab.click();
}
