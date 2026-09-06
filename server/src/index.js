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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const isProdEnv = process.env.NODE_ENV === "production";

function isLocalHost(hostname) {
  const host = String(hostname || "").split(":")[0].toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
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
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "8mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/startup-check", (req, res) => {
  console.log("/startup-check called");
  res.json({ ok: true });
});

const start = async () => {
  try {
  let sessionStore;

  if (REDIS_URL) {
    const redisClient = createClient({ url: REDIS_URL });
    redisClient.on("error", (err) => {
      console.error("Redis client error", err);
    });
    await redisClient.connect();
    sessionStore = new RedisStore({
      client: redisClient,
      prefix: "fovea:sess:",
    });
  } else {
    console.warn(
      "REDIS_URL not set; falling back to in-memory session store (not suitable for production).",
    );
  }

  app.use(
    session({
      store: sessionStore,
      name: "fovea.sid",
      secret: process.env.SESSION_SECRET || "fovea-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 14 * 24 * 60 * 60 * 1000,
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
    app.get(
      "/auth/google/callback",
      passport.authenticate("google", { failureRedirect: `${CLIENT_ORIGIN}/login?error=google` }),
      (_req, res) => {
        res.redirect(CLIENT_ORIGIN);
      },
    );
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
        res.clearCookie("fovea.sid");
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

  try {
    await initDb();
  } catch (err) {
    console.error("initDb() failed during startup:", err);
    throw err;
  }

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
  } catch (err) {
    console.error("Fatal error during server startup (start()):", err);
    throw err;
  }
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
