import LegalLayout from "../components/LegalLayout.jsx";

const EFFECTIVE_DATE = "September 6, 2026";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        <strong>Effective date:</strong> {EFFECTIVE_DATE}
      </p>
      <p>
        Fovea (<a className="text-accent hover:underline" href="https://fovea.sh">fovea.sh</a>) is a weekly
        focus and task-mapping app operated by Asha Somayajula. This policy explains what we collect, why, and
        how we use it.
      </p>

      <section className="space-y-3 rounded-xl border border-line/80 bg-accent-soft/20 p-4">
        <h2 className="text-base font-semibold text-brand">We do not sell your information</h2>
        <p>
          We do not sell, rent, trade, or share your personal information with third parties for their marketing
          or advertising. Your workspace data stays yours. We only use what we collect to run and improve
          Fovea.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand">What we collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account information</strong> — If you sign in with Google, we receive your name, email
            address, and profile picture from Google. We use this to create your account and show your identity
            in the app.
          </li>
          <li>
            <strong>Workspace data</strong> — Tasks, channels, ideas, map positions, weekly focus choices, and
            other content you create in Fovea. This is stored so the service works for you.
          </li>
          <li>
            <strong>Session data</strong> — We use a session cookie (<code className="rounded bg-accent-soft/50 px-1">fovea.sid</code>)
            to keep you signed in.
          </li>
          <li>
            <strong>Usage analytics</strong> — We use Google Analytics 4 to collect anonymous page views and
            basic usage data (for example, which pages are visited). Google may set its own cookies. See{" "}
            <a
              className="text-accent hover:underline"
              href="https://policies.google.com/privacy"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Technical logs</strong> — Our hosting provider may log IP addresses, request timestamps, and
            error data for security and reliability.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand">How we use data</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide, maintain, and improve Fovea</li>
          <li>Authenticate you and keep your session secure</li>
          <li>Understand how the product is used so we can fix bugs and improve features</li>
          <li>Respond to support requests</li>
        </ul>
        <p className="font-medium text-brand">We do not sell your personal information. Ever.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand">Where data is stored</h2>
        <p>
          Fovea is hosted on Railway. Your workspace data is stored in a managed database (PostgreSQL in
          production). Sessions may be stored in Redis when configured.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand">Third-party services</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Google Sign-In</strong> — authentication (
            <a
              className="text-accent hover:underline"
              href="https://policies.google.com/privacy"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google Privacy Policy
            </a>
            )
          </li>
          <li>
            <strong>Google Analytics</strong> — usage measurement (
            <a
              className="text-accent hover:underline"
              href="https://policies.google.com/technologies/partner-sites"
              rel="noopener noreferrer"
              target="_blank"
            >
              How Google uses data
            </a>
            )
          </li>
          <li>
            <strong>Railway</strong> — application hosting and infrastructure
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand">Retention and deletion</h2>
        <p>
          We keep your account and workspace data while your account is active. If you want your account and
          data deleted, contact us at{" "}
          <a className="text-accent hover:underline" href="mailto:privacy@fovea.sh">privacy@fovea.sh</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand">Your choices</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>You can sign out at any time, which clears your session cookie.</li>
          <li>You can use browser extensions or settings to block analytics cookies.</li>
          <li>You can revoke Fovea&apos;s access in your Google Account security settings.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand">Children</h2>
        <p>Fovea is not directed at children under 13, and we do not knowingly collect their information.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand">Use at your own risk</h2>
        <p>
          Fovea is provided <strong>as is</strong>, without warranty of any kind. We do not guarantee that the
          service will be uninterrupted, error-free, or fit for any particular purpose. You use the software at
          your own risk.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand">Changes</h2>
        <p>
          We may update this policy from time to time. The effective date at the top will change when we do.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand">Contact</h2>
        <p>
          Questions about privacy? Email{" "}
          <a className="text-accent hover:underline" href="mailto:privacy@fovea.sh">privacy@fovea.sh</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
