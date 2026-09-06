import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { AvailabilityCalendar, darkTheme } from "../src";
import type { AvailabilitySlot } from "../src";
import { examples, seedBlocked, seedSlots } from "./examples";
import "./styles.css";

const REPO =
  "https://github.com/meghrajgiri/react-weekly-availability-calendar";
const STORYBOOK = "/availability-calendar/storybook/";
const NPM = "https://www.npmjs.com/package/react-weekly-availability-calendar";
const PKG = "react-weekly-availability-calendar";
const VERSION = __PKG_VERSION__;

function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("ac-docs-theme");
      if (saved) return saved === "dark";
    } catch {
      /* private mode — fall through to the system preference */
    }
    return (
      typeof matchMedia === "function" &&
      matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("ac-docs-theme", dark ? "dark" : "light");
    } catch {
      /* not fatal — the toggle still works for this session */
    }
  }, [dark]);

  return [dark, useCallback(() => setDark((d) => !d), [])] as const;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy-btn"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          },
          () => setCopied(false)
        );
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Hero({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(seedSlots);
  const install = `npm install ${PKG}`;

  return (
    <header className="hero">
      <div className="wrap">
        <span className="badge">v{VERSION}</span>
        <h1>A weekly availability calendar you can actually drag.</h1>
        <p className="lede">
          Create, move, and resize time slots with the pointer. Zero runtime
          dependencies, styles injected automatically, SSR-safe, and typed end
          to end.
        </p>

        <div className="cta-row">
          <span className="install">
            <span className="prompt">$</span>
            <span className="install-cmd">{install}</span>
            <CopyButton text={install} />
          </span>
          <a className="btn btn--primary" href="#examples">
            See examples
          </a>
          <a className="btn" href={REPO}>
            GitHub
          </a>
        </div>

        <div className="demo">
          <div className="demo-bar">
            <strong style={{ fontWeight: 600 }}>Live</strong>
            <span className="demo-hint">
              Drag empty space to create · drag a slot to move · drag an edge to
              resize
            </span>
            <span className="demo-hint--short">
              Drag to create · swipe for more days
            </span>
          </div>
          <div className="demo-body">
            <AvailabilityCalendar
              slots={slots}
              onSlotsChange={setSlots}
              blockedSlots={seedBlocked}
              snapMinutes={30}
              timeFormat="12"
              // Opens on working hours rather than midnight, so the first
              // thing visible is the slots rather than empty night rows.
              startHour={8}
              endHour={20}
              theme={dark ? darkTheme : undefined}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

const FEATURES = [
  {
    h: "Zero dependencies",
    p: "Only react and react-dom as peers. Nothing else enters your lockfile.",
  },
  {
    h: "No CSS import",
    p: "Styles are injected once on first render. Nothing to wire into your bundler.",
  },
  {
    h: "SSR safe",
    p: 'Ships a "use client" directive, so it imports cleanly in the Next.js App Router.',
  },
  {
    h: "Themeable",
    p: "CSS variables via theme, per-part class names, or render props for full control.",
  },
  {
    h: "Touch ready",
    p: "Pointer events throughout, with scroll locking during a drag on mobile.",
  },
  {
    h: "TypeScript first",
    p: "Written in TypeScript. Types ship for both ESM and CJS consumers.",
  },
];

function ExampleCard({
  example,
  dark,
}: {
  example: (typeof examples)[number];
  dark: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="example" id={example.id}>
      <div className="example-head">
        <h3>{example.title}</h3>
        <p>{example.blurb}</p>
        <button className="toggle-code" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide code" : "Show code"}
        </button>
      </div>
      {example.render(dark)}
      {open && <pre>{example.code}</pre>}
    </section>
  );
}

function App() {
  const [dark, toggle] = useTheme();

  return (
    <>
      <nav className="nav">
        <div className="wrap nav-inner">
          <a className="nav-brand" href="#top">
            <span className="nav-dot" />
            availability-calendar
          </a>
          <a className="nav-link nav-link--hide-sm" href="#examples">
            Examples
          </a>
          <a className="nav-link nav-link--hide-sm" href="#props">
            API
          </a>
          <a className="nav-link nav-link--hide-xs" href={STORYBOOK}>
            Storybook
          </a>
          <a className="nav-link nav-link--hide-xs" href={NPM}>
            npm
          </a>
          <a className="nav-link" href={REPO}>
            GitHub
          </a>
          <button
            className="icon-btn"
            onClick={toggle}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            title="Toggle theme"
          >
            {dark ? "☀" : "☾"}
          </button>
        </div>
      </nav>

      <main id="top">
        <Hero dark={dark} />

        <div className="wrap">
          <div className="features">
            {FEATURES.map((f) => (
              <div className="feature" key={f.h}>
                <h3>{f.h}</h3>
                <p>{f.p}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="wrap">
          <section className="section" id="examples">
            <h2>Examples</h2>
            <p className="sub">
              Every calendar below is live — drag them. Toggle the theme in the
              nav to see the same examples in dark mode.
            </p>
            {examples.map((ex) => (
              <ExampleCard key={ex.id} example={ex} dark={dark} />
            ))}
          </section>

          <section className="section" id="props">
            <h2>Full API reference</h2>
            <p className="sub">
              Every prop, every variant, with live controls — generated directly
              from the TypeScript types, so it can never drift from the source.
            </p>
            <div className="cta-row">
              <a className="btn btn--primary" href={STORYBOOK}>
                Open Storybook →
              </a>
              <a className="btn" href={`${REPO}#props`}>
                README
              </a>
            </div>
          </section>
        </div>

        <footer className="footer">
          <div className="wrap footer-inner">
            <span>
              MIT · built by <a href="https://meghrajgiri.com">Meghraj Giri</a>
            </span>
            <span className="footer-links">
              <a href={NPM}>npm</a>
              <a href={REPO}>GitHub</a>
              <a href={STORYBOOK}>Storybook</a>
              <a href={`${REPO}/blob/main/CHANGELOG.md`}>Changelog</a>
            </span>
          </div>
        </footer>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
