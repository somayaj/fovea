import { randomUUID } from "node:crypto";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { execute, nowIso, queryOne } from "./db.js";
import { ensureStarterProject } from "./seed.js";

export async function upsertGoogleUser(profile) {
  const googleSub = profile.id;
  const email = profile.emails?.[0]?.value || null;
  const name = profile.displayName || email || "Fovea user";
  const avatar = profile.photos?.[0]?.value || null;
  let user = await queryOne("SELECT * FROM users WHERE google_sub = ?", [googleSub]);
  if (!user) {
    user = {
      id: randomUUID(),
      google_sub: googleSub,
      email,
      name,
      avatar,
      created_at: nowIso(),
    };
    await execute(
      "INSERT INTO users (id, google_sub, email, name, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, user.google_sub, user.email, user.name, user.avatar, user.created_at],
    );
    await ensureStarterProject(user.id);
  } else {
    await execute("UPDATE users SET email = ?, name = ?, avatar = ? WHERE id = ?", [
      email,
      name,
      avatar,
      user.id,
    ]);
    user = await queryOne("SELECT * FROM users WHERE id = ?", [user.id]);
  }
  return user;
}

export async function createDevUser() {
  const googleSub = "dev-local";
  let user = await queryOne("SELECT * FROM users WHERE google_sub = ?", [googleSub]);
  if (!user) {
    user = {
      id: randomUUID(),
      google_sub: googleSub,
      email: "you@localhost",
      name: "Local",
      avatar: null,
      created_at: nowIso(),
    };
    await execute(
      "INSERT INTO users (id, google_sub, email, name, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, user.google_sub, user.email, user.name, user.avatar, user.created_at],
    );
    await ensureStarterProject(user.id);
  }
  return user;
}

export function configurePassport() {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await queryOne("SELECT * FROM users WHERE id = ?", [id]);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackFromEnv = process.env.GOOGLE_CALLBACK_URL || "";
  const callbackLooksLocal = /localhost|127\.0\.0\.1/i.test(callbackFromEnv);
  const callbackURL =
    callbackFromEnv && !(process.env.NODE_ENV === "production" && callbackLooksLocal)
      ? callbackFromEnv
      : "/auth/google/callback";
  if (clientID && clientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            done(null, await upsertGoogleUser(profile));
          } catch (err) {
            done(err);
          }
        },
      ),
    );
  }
}

export function requireAuth(req, res, next) {
  if (req.isAuthenticated?.() && req.user) return next();
  return res.status(401).json({ error: "Sign in required" });
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  };
}
