# Fovea Mobile (React Native)

Expo app that wraps the **same Fovea web client** in a native WebView. You get identical UX — focus collage, task map, board view, themes, bottom-sheet panels — because it *is* the web app, not a reimplementation.

## Why WebView?

A full React Native rewrite would not match the web UX without rebuilding the sketch map, roadmap timeline, brainstorm canvas, and theme system. The native shell gives you:

- App Store / Play Store distribution path (Expo)
- Safe areas, splash, portrait lock
- Forced mobile layout (`?mobile=1` + `window.fovea.isMobileShell`)
- Same API, data, and screens as [fovea.sh](https://fovea.sh)

## Development

**Terminal 1 — API + web client:**

```bash
npm run dev
```

**Terminal 2 — Expo:**

```bash
npm install
npm run start -w fovea-mobile
```

Press `i` for iOS Simulator or `a` for Android emulator. The WebView loads `http://localhost:5173?mobile=1`.

### Physical device

Vite listens on all interfaces (`host: true`). Set your machine's LAN IP:

```bash
EXPO_PUBLIC_FOVEA_URL=http://192.168.1.42:5173 npm run start -w fovea-mobile
```

Phone and computer must be on the same network. Use **Continue without Google** (dev login) when OAuth is unset.

## Production

Point the shell at your deployed app:

```bash
EXPO_PUBLIC_FOVEA_URL=https://fovea.sh npm run start -w fovea-mobile
```

Google OAuth in WebView may need additional redirect configuration; dev login works for local testing.

## Layout parity

The web client detects the mobile shell via:

- `window.fovea.isMobileShell` (injected before load)
- `?mobile=1` query param (fallback)

`AppShell` forces the mobile drawer nav (hamburger, full sidebar, bottom-sheet task panels) — same as narrowing the browser below the `lg` breakpoint.
