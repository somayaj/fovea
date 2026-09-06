import LegalLayout from "../components/LegalLayout.jsx";

const MIT_LICENSE = `MIT License

Copyright (c) 2026 Asha Somayajula

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export default function LicensePage() {
  return (
    <LegalLayout title="MIT License">
      <section className="space-y-3 rounded-xl border border-line/80 bg-accent-soft/20 p-4">
        <h2 className="text-base font-semibold text-brand">Provided as is</h2>
        <p>
          Fovea is free, open-source software provided <strong>as is</strong>, without warranty of any kind.
          There is no guarantee of uptime, data retention, or fitness for a particular purpose. Use it at your
          own risk.
        </p>
      </section>
      <p>
        Fovea is open source under the MIT License. Source code is available on{" "}
        <a
          className="text-accent hover:underline"
          href="https://github.com/somayaj/fovea"
          rel="noopener noreferrer"
          target="_blank"
        >
          GitHub
        </a>
        .
      </p>
      <pre className="overflow-x-auto rounded-xl border border-line/80 bg-surface p-4 text-xs leading-relaxed text-stone-700">
        {MIT_LICENSE}
      </pre>
    </LegalLayout>
  );
}
