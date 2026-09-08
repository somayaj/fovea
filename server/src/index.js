import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import RedisStore from "connect-redis";
import { createClient } from "redis";
import cors from "cors";
import passport from "passport";
import dotenv from "dotenv";
import { configurePassport, createDevUser, publicUser } from "./auth.js";
import api from "./routes.js";
import { initDb, isPostgres } from "./db.js";
import {
  canonicalAppOrigin,
  ensureHttpsOrigin,
  isLocalHost,
  isLocalOrigin,
  stripSlash,
} from "./appOrigin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const PORT = Number(process.env.PORT) || 3001;
const LOCAL_CLIENT_ORIGIN = "http://localhost:5173";
const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const isProdEnv = process.env.NODE_ENV === "production";

function configuredClientOrigin() {
  const raw = stripSlash(process.env.CLIENT_ORIGIN);
  if (raw && !(isProdEnv && isLocalOrigin(raw))) return ensureHttpsOrigin(raw);
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL;
  if (railway) {
    const host = stripSlash(railway).replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return isProdEnv ? canonicalAppOrigin(null) || "" : LOCAL_CLIENT_ORIGIN;
}

function afterAuthRedirect(req) {
  if (isProdEnv) {
    return canonicalAppOrigin(req) || "https://fovea.sh";
  }
  return configuredClientOrigin() || LOCAL_CLIENT_ORIGIN;
}

function isLoopbackAddress(addr) {
  return addr === "127.0.0.1" || addr === "::1" || addr === ":ffff:127.0.0.1";
}

function allowDevLogin(req) {
  if (isProdEnv) return false;
  if (!isLocalHost(req.hostname)) return false;
  if (!isLoopbackAddress(req.socket?.remoteAddress)) return false;
  return process.env.DEV_LOGIN === "1" || !googleReady;
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

configurePassport();

const REDIS_URL = process.env.REDIS_URL || "";

const app = express();
app.set("trust proxy", 1);

if (isProdEnv) {
  app.use((req, res, next) => {
    // Skip healthcheck routes — Railway probes /health over plain HTTP
    if (req.path === "/health" || req.path === "/healthz") return next();

    const proto = String(req.get("x-forwarded-proto") || "")
      .split(",")[0]
      .trim();

    // Redirect non-HTTPS traffic to HTTPS
    if (proto !== "https") {
      const host = String(req.get("x-forwarded-host") || req.get("host") || "fovea.sh")
        .split(",")[0]
        .trim();
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }

    // Set HSTS for HTTPS traffic
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const configured = configuredClientOrigin();
      if (configured && origin === configured) return callback(null, true);
      if (origin === LOCAL_CLIENT_ORIGIN) return callback(null, true);
      try {
        const host = new URL(origin).hostname;
        if (isProdEnv && (host.endsWith(".up.railway.app") || host.endsWith(".railway.app"))) {
          return callback(null, true);
        }
      } catch {
        // ignore invalid origins
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "8mb" }));

// Liveness endpoint: always 200 so Railway's healthcheck passes while
// initDb()/migrate() are still running. `ready` reports readiness.
let ready = false;
app.get(["/health", "/healthz"], (req, res) => {
  res.status(200).json({ ok: true, ready });
});

const start = async () => {
  try {
  let sessionStore;

  if (REDIS_URL) {
    const redisClient = createClient({ url: REDIS_URL });
    redisClient.on("error", (err) => {
      console.error("Redis client error", err);
    });

    const REDIS_CONNECT_TIMEOUT_MS = 10_000;
    const connectTimeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Redis connect() timed out after ${REDIS_CONNECT_TIMEOUT_MS}ms`));
      }, REDIS_CONNECT_TIMEOUT_MS);
    });

    try {
      await Promise.race([redisClient.connect(), connectTimeout]);
      sessionStore = new RedisStore({
        client: redisClient,
        prefix: "fovea:sess:",
      });
    } catch (err) {
      console.error(
        "Failed to connect to Redis within timeout; falling back to in-memory session store (not suitable for production).",
        err,
      );
      redisClient.disconnect?.().catch(() => {});
    }
  } else {
    console.warn(
      "REDIS_URL not set; falling back to in-memory session store (not suitable for production).",
    );
  }

  const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax",
    secure: isProdEnv,
    path: "/",
  };

  const SESSION_MAX_AGE_MS = 15 * 60 * 1000;

  app.use(
    session({
      store: sessionStore,
      name: "fovea.sid",
      secret: process.env.SESSION_SECRET || "fovea-dev-secret",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        ...SESSION_COOKIE_OPTIONS,
        maxAge: SESSION_MAX_AGE_MS,
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/auth/status", (req, res) => {
    res.json({
      google: googleReady,
      devLogin: allowDevLogin(req),
      user: publicUser(req.user),
    });
  });

  if (googleReady) {
    app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
    app.get("/auth/google/callback", (req, res, next) => {
      passport.authenticate("google", {
        failureRedirect: `${afterAuthRedirect(req)}/?error=google`,
      })(req, res, next);
    }, (req, res) => {
      res.redirect(afterAuthRedirect(req));
    });
  }

  app.post("/auth/dev", async (req, res) => {
    if (!allowDevLogin(req)) return res.status(403).json({ error: "Dev login is disabled" });
    try {
      const user = await createDevUser();
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Could not start session" });
        res.json({ user: publicUser(user) });
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Could not start session" });
    }
  });

  app.post("/auth/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("fovea.sid", SESSION_COOKIE_OPTIONS);
        res.json({ ok: true });
      });
    });
  });

  app.use("/api", api);

  const clientDist = path.join(__dirname, "..", "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/auth")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next();
    });
  });

  // Start accepting connections (and responding to /health) before
  // database initialization completes. This is the "liveness" surface;
  // /health reports readiness separately via the `ready` flag.
  try {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Fovea API on http://localhost:${PORT} (${isPostgres ? "postgres" : "sqlite"})`);
    });
    server.on("error", (err) => {
      console.error("app.listen() emitted an error:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("Failed to start app.listen():", err);
    throw err;
  }

  try {
    await initDb();
    ready = true;
  } catch (err) {
    console.error("initDb() failed during startup:", err);
    throw err;
  }
  } catch (err) {
    console.error("Fatal error during server startup (start()):", err);
    throw err;
  }
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
