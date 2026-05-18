"use client";

import React, { useEffect, useRef, useState } from "react";

// ─── SVG Icons ──────────────────────────────────────────────────────────────

function ScryLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#7c5cfc" />
      <rect x="7" y="7" width="4" height="14" rx="1.5" fill="white" opacity="0.9" />
      <rect x="13" y="9" width="8" height="2.5" rx="1" fill="white" />
      <rect x="13" y="13" width="5" height="2.5" rx="1" fill="white" opacity="0.7" />
      <rect x="13" y="17" width="6" height="2.5" rx="1" fill="white" opacity="0.5" />
    </svg>
  );
}

function IconScan() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
      <path d="M3 7V4.5A1.5 1.5 0 0 1 4.5 3H7M13 3h2.5A1.5 1.5 0 0 1 17 4.5V7M17 13v2.5a1.5 1.5 0 0 1-1.5 1.5H13M7 17H4.5A1.5 1.5 0 0 1 3 15.5V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="7" y="7" width="6" height="6" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function IconAI() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
      <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" fill="currentColor" />
      <path d="M16 14l.75 2.25L19 17l-2.25.75L16 20l-.75-2.25L13 17l2.25-.75L16 14z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function IconPDF() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
      <path d="M5 3h7l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M12 3v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 12h6M7 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function IconCards() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
      <rect x="2" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <rect x="4" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
      <path d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3V14H4a1 1 0 0 1-1-1V4z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
      <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: IconScan,
    title: "OCR & Text Extraction",
    desc: "Capture any document with your camera. Gemini Vision extracts every word, preserving structure and layout.",
  },
  {
    icon: IconAI,
    title: "AI Processing",
    desc: "Automatically generates a title, category, tags, and a concise summary for every document you scan.",
  },
  {
    icon: IconCards,
    title: "Flashcard Generation",
    desc: "Turn any document into a set of study flashcards in one tap. Perfect for exam revision.",
  },
  {
    icon: IconPDF,
    title: "PDF & Markdown Export",
    desc: "Export documents as beautifully formatted PDFs or Markdown files. Share via any app.",
  },
  {
    icon: IconSearch,
    title: "Full-Text Search",
    desc: "Search across every document you've scanned — by content, title, tags, or summary.",
  },
  {
    icon: IconChat,
    title: "AI Chat",
    desc: "Ask questions about your documents. Get instant, concise answers powered by Gemini.",
  },
];

const STEPS = [
  { num: "01", title: "Scan or Import", desc: "Point your camera at any document, whiteboard, receipt, or book. Or import from your photo library." },
  { num: "02", title: "AI Extracts & Organizes", desc: "Gemini Vision reads the document, extracts all text, and auto-generates a title, category, tags, and summary." },
  { num: "03", title: "Study, Export & Share", desc: "Generate flashcards, chat with your document, export as PDF or Markdown, and share anywhere." },
];

const SCAN_MODES = ["Notes", "Book", "Whiteboard", "Receipt", "ID Card"];

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeModeIdx, setActiveModeIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveModeIdx((i) => (i + 1) % SCAN_MODES.length);
    }, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const resetInterval = (idx: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveModeIdx(idx);
    intervalRef.current = setInterval(() => {
      setActiveModeIdx((i) => (i + 1) % SCAN_MODES.length);
    }, 2000);
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px",
        transition: "all 0.25s",
        background: scrolled ? "rgba(5,5,5,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ScryLogo size={26} />
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.5px", color: "var(--text)" }}>Scry</span>
        </div>

        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {["Features", "How it works", "Download"].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/ /g, "-")}`}
              style={{
                fontSize: 13, fontWeight: 500, color: "var(--text-2)",
                textDecoration: "none", letterSpacing: "0.01em",
                transition: "color 0.15s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-2)")}
            >
              {link}
            </a>
          ))}
        </div>

        <a href="#download" style={{ textDecoration: "none" }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: "opacity 0.15s",
          }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <IconDownload />
            Download APK
          </button>
        </a>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 80px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Glow */}
        <div style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(124,92,252,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
          animation: "pulse-glow 4s ease-in-out infinite",
        }} />

        {/* Scan line decoration */}
        <div style={{
          position: "absolute", top: "45%", left: "50%",
          transform: "translateX(-50%)",
          width: 280, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(124,92,252,0.6), transparent)",
          animation: "scanLine 3s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Badge */}
        <div className="fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--accent-dim)",
          border: "1px solid rgba(124,92,252,0.25)",
          borderRadius: 99, padding: "6px 14px",
          marginBottom: 32,
        }}>
          <IconAI />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Powered by Gemini AI
          </span>
        </div>

        {/* Heading */}
        <h1 className="fade-up fade-up-1" style={{
          fontSize: "clamp(44px, 8vw, 88px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.0,
          color: "var(--text)",
          maxWidth: 800,
          marginBottom: 24,
        }}>
          Scan.{" "}
          <span style={{ color: "var(--text-2)", fontWeight: 300 }}>Extract.</span>
          <br />
          <em style={{
            fontStyle: "italic", fontWeight: 800,
            background: "linear-gradient(135deg, #7c5cfc, #a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Understand.
          </em>
        </h1>

        {/* Sub */}
        <p className="fade-up fade-up-2" style={{
          fontSize: "clamp(15px, 2vw, 18px)",
          color: "var(--text-2)",
          maxWidth: 540,
          lineHeight: 1.7,
          marginBottom: 40,
        }}>
          Turn any document into organized, searchable knowledge.
          OCR, AI summaries, flashcards, and PDF export — in seconds.
        </p>

        {/* Mode chips */}
        <div className="fade-up fade-up-2" style={{
          display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center",
          marginBottom: 40,
        }}>
          {SCAN_MODES.map((m, i) => (
            <button
              key={m}
              onClick={() => resetInterval(i)}
              style={{
                padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
                border: "1px solid",
                letterSpacing: "0.02em",
                background: activeModeIdx === i ? "var(--accent)" : "transparent",
                borderColor: activeModeIdx === i ? "var(--accent)" : "var(--border)",
                color: activeModeIdx === i ? "#fff" : "var(--text-2)",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div className="fade-up fade-up-3" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/download/Scry.apk" download style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--text)", color: "#0a0a0a",
              border: "none", borderRadius: 10, padding: "14px 28px",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              transition: "transform 0.15s, opacity 0.15s",
            }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.opacity = "0.92"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.opacity = "1"; }}
            >
              <IconDownload />
              Download APK  <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.5, marginLeft: 4 }}>v1.0 · Android</span>
            </button>
          </a>
          <a href="#features" style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "transparent", color: "var(--text-2)",
              border: "1px solid var(--border)", borderRadius: 10, padding: "14px 24px",
              fontSize: 15, fontWeight: 500, cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
              onMouseOver={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              See features <IconArrow />
            </button>
          </a>
        </div>

        {/* Stats */}
        <div className="fade-up fade-up-4" style={{
          display: "flex", gap: 0,
          marginTop: 72,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
          {[
            { label: "Scan Modes", value: "5" },
            { label: "AI Features", value: "6" },
            { label: "Export Formats", value: "3" },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: "20px 36px",
              textAlign: "center",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-1px" }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            color: "var(--accent)", textTransform: "uppercase", marginBottom: 16,
          }}>
            Capabilities
          </div>
          <h2 style={{
            fontSize: "clamp(30px, 5vw, 48px)", fontWeight: 800,
            letterSpacing: "-0.03em", color: "var(--text)", lineHeight: 1.1,
          }}>
            Everything CamScanner can do,<br />
            <span style={{ color: "var(--text-2)", fontWeight: 400 }}>with AI built in.</span>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 1,
          background: "var(--border)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
        }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                style={{
                  background: "var(--surface)", padding: "28px 28px",
                  transition: "background 0.15s",
                  cursor: "default",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "var(--surface)")}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: "var(--accent-dim)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--accent)", marginBottom: 16,
                }}>
                  <Icon />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.2px" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            color: "var(--accent)", textTransform: "uppercase", marginBottom: 16,
          }}>
            How it works
          </div>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800,
            letterSpacing: "-0.03em", color: "var(--text)", lineHeight: 1.15,
          }}>
            Three steps to understand anything.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {STEPS.map((step, i) => (
            <div key={step.num} style={{
              background: "var(--surface)", borderRadius: 16,
              padding: "32px 28px",
              border: "1px solid var(--border)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 20, right: 24,
                fontSize: 48, fontWeight: 900, color: "rgba(124,92,252,0.07)",
                letterSpacing: "-2px", lineHeight: 1,
              }}>
                {step.num}
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 20,
              }}>
                {i + 1}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.3px" }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Download ────────────────────────────────────────────────────── */}
      <section id="download" style={{ padding: "80px 24px" }}>
        <div style={{
          maxWidth: 700, margin: "0 auto",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 24, padding: "60px 40px",
          textAlign: "center",
          position: "relative", overflow: "hidden",
        }}>
          {/* Glow behind CTA */}
          <div style={{
            position: "absolute", bottom: -60, left: "50%",
            transform: "translateX(-50%)",
            width: 400, height: 200,
            background: "radial-gradient(ellipse, rgba(124,92,252,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ marginBottom: 16 }}>
            <ScryLogo size={48} />
          </div>

          <h2 style={{
            fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800,
            letterSpacing: "-0.03em", color: "var(--text)",
            lineHeight: 1.1, marginBottom: 16,
          }}>
            Start scanning smarter.
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
            Download the Scry APK for Android. Free to use — no account required.
          </p>

          <a href="/download/Scry.apk" download style={{ textDecoration: "none" }}>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "var(--text)", color: "#0a0a0a",
              border: "none", borderRadius: 12, padding: "16px 36px",
              fontSize: 16, fontWeight: 700, cursor: "pointer",
              transition: "transform 0.15s, opacity 0.15s",
              marginBottom: 20,
            }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.opacity = "0.9"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.opacity = "1"; }}
            >
              <IconDownload />
              Download Scry APK
              <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 500, marginLeft: 2 }}>v1.0.0</span>
            </button>
          </a>

          <div style={{ marginTop: 28 }}>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Installation
            </p>
            <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Enable \"Install unknown apps\" in Android Settings",
                "Open the downloaded Scry.apk file",
                "Tap Install and grant camera + storage permissions",
              ].map((step, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 99,
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    fontSize: 11, fontWeight: 700, color: "var(--text-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-2)" }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <p style={{ marginTop: 24, fontSize: 11, color: "var(--text-3)" }}>
            Requires Android 10+  ·  No Google Play required  ·  65 MB
          </p>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "32px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ScryLogo size={22} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Scry</span>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "Privacy", href: "#" },
            { label: "GitHub", href: "#" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{ fontSize: 13, color: "var(--text-3)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "var(--text-2)")}
              onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-3)")}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
          Built with Gemini AI · {new Date().getFullYear()}
        </div>
      </footer>

    </div>
  );
}
