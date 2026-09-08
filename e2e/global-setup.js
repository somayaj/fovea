export default async function globalSetup() {
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    try {
      const res = await fetch("http://localhost:3001/health");
      const data = await res.json();
      if (data.ready) return;
    } catch {
      // Server still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("API server did not become ready in time.");
}
