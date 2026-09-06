import { IMAGES } from "../lib/images.js";
import { cn } from "../lib/tw.js";

/** Landing hero — regenerated collage: woman center, man, team, and tasks. */
export default function LoginHeroCollage({ className = "" }) {
  return (
    <div className={cn("login-collage-scene", className)}>
      <picture>
        <source srcSet={IMAGES.focusLandingWebp} type="image/webp" />
        <img
          src={IMAGES.focusLanding}
          alt="This week's focus at the center, with deep work, team sync, and other tasks around it"
          className="login-collage-base"
          width={1536}
          height={1024}
          decoding="async"
        />
      </picture>
      <div className="login-collage-focus-ring login-collage-focus-ring--center" aria-hidden="true" />
    </div>
  );
}
