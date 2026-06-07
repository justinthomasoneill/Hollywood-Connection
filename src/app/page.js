"use client";

import { useState } from "react";

const DIFFICULTIES = {
  Easy: {
    label: "Easy",
    desc: "Hollywood A-listers, well-known films",
    pairs: [
      ["Tom Hanks", "Meryl Streep"],
      ["Leonardo DiCaprio", "Julia Roberts"],
      ["Brad Pitt", "Cate Blanchett"],
      ["Will Smith", "Charlize Theron"],
      ["Denzel Washington", "Sandra Bullock"],
    ],
  },
  Medium: {
    label: "Medium",
    desc: "Broader filmographies, trickier links",
    pairs: [
      ["Christopher Walken", "Natalie Portman"],
      ["Jeff Bridges", "Halle Berry"],
      ["Gary Oldman", "Reese Witherspoon"],
      ["John Cusack", "Sigourney Weaver"],
      ["Willem Dafoe", "Cameron Diaz"],
    ],
  },
  Hard: {
    label: "Hard",
    desc: "Character actors, cult films, obscure links",
    pairs: [
      ["Harvey Keitel", "Tilda Swinton"],
      ["Steve Buscemi", "Helen Mirren"],
      ["John Malkovich", "Julianne Moore"],
      ["Tim Roth", "Naomi Watts"],
      ["Michael Shannon", "Emily Blunt"],
    ],
  },
};

async function validateStep(actor1, movie, actor2) {
  const res = await fetch("/api/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor1, movie, actor2 }),
  });
  return res.json();
}

async function getHint(fromActor, targetActor, chainSoFar) {
  const res = await fetch("/api/hint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromActor, targetActor, chainSoFar }),
  });
  const data = await res.json();
  return data.hint;
}

function FilmStrip({ top }) {
  const holes = Array.from({ length: 20 });
  return (
    <div style={{
      position: "fixed",
      [top ? "top" : "bottom"]: 0,
      left: 0, right: 0,
      height: 28,
      background: "#111",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 8px",
      zIndex: 100,
      overflowX: "hidden",
    }}>
      {holes.map((_, i) => (
        <div key={i} style={{
          width: 14, height: 10,
          borderRadius: 2,
          background: "#2a2a2a",
          border: "1px solid #333",
          flexShrink: 0,
        }} />
      ))}
    </div>
  );
}

function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: (i * 37.7) % 100,
    y: (i * 23.1) % 100,
    size: (i % 3) + 0.5,
    opacity: ((i % 5) + 1) * 0.08,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {stars.map((s) => (
        <div key={s.id} style={{
          position: "absolute",
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.size,
          height: s.size,
          borderRadius: "50%",
          background: "#fff",
          opacity: s.opacity,
        }} />
      ))}
    </div>
  );
}

function ChainDisplay({ chain, targetActor }) {
  if (chain.length === 0) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        {chain.map((link, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              background: "rgba(212,175,55,0.15)",
              border: "1px solid #d4af37",
              color: "#d4af37",
              borderRadius: 6,
              padding: "3px 10px",
              fontFamily: "'Playfair Display', serif",
              fontSize: 13,
              fontWeight: 600,
            }}>{link.actor}</span>
            <span style={{ color: "#666", fontSize: 12 }}>in</span>
            <span style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid #3a3a3a",
              color: "#bbb",
              borderRadius: 6,
              padding: "3px 10px",
              fontFamily: "'Courier Prime', monospace",
              fontSize: 12,
              fontStyle: "italic",
            }}>{link.movie}</span>
            <span style={{ color: "#444", fontSize: 18 }}>→</span>
          </span>
        ))}
        {targetActor && (
          <span style={{
            background: "rgba(255,100,100,0.1)",
            border: "1px solid #c05050",
            color: "#e08080",
            borderRadius: 6,
            padding: "3px 10px",
            fontFamily: "'Playfair Display', serif",
            fontSize: 13,
            fontWeight: 600,
          }}>{targetActor} (?)</span>
        )}
      </div>
    </div>
  );
}

function StepInput({ currentActor, targetActor, onSubmit, loading }) {
  const [actor2, setActor2] = useState("");
  const [movie, setMovie] = useState("");

  const handleSubmit = () => {
    if (!actor2.trim() || !movie.trim()) return;
    onSubmit(movie.trim(), actor2.trim());
    setActor2("");
    setMovie("");
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid #3a3a3a",
    borderRadius: 8,
    color: "#f0e6c8",
    padding: "10px 14px",
    fontFamily: "'Courier Prime', monospace",
    fontSize: 14,
    outline: "none",
    width: "100%",
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid #2a2a2a",
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ color: "#999", fontSize: 13, marginBottom: 16, fontFamily: "'Courier Prime', monospace" }}>
        Connect <span style={{ color: "#d4af37", fontWeight: 600 }}>{currentActor}</span> toward{" "}
        <span style={{ color: "#e08080", fontWeight: 600 }}>{targetActor}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ color: "#666", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, display: "block", fontFamily: "'Courier Prime', monospace" }}>
            Movie / Film
          </label>
          <input
            style={inputStyle}
            placeholder={`A film with ${currentActor}...`}
            value={movie}
            onChange={(e) => setMovie(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={loading}
          />
        </div>
        <div>
          <label style={{ color: "#666", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, display: "block", fontFamily: "'Courier Prime', monospace" }}>
            Co-star in that film
          </label>
          <input
            style={inputStyle}
            placeholder="Their co-star..."
            value={actor2}
            onChange={(e) => setActor2(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={loading}
          />
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading || !actor2.trim() || !movie.trim()}
        style={{
          background: loading ? "#222" : "linear-gradient(135deg, #d4af37, #9a7318)",
          border: "none",
          borderRadius: 8,
          color: loading ? "#555" : "#1a1208",
          padding: "11px 24px",
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: 14,
          cursor: loading ? "not-allowed" : "pointer",
          letterSpacing: "0.05em",
          width: "100%",
        }}
      >
        {loading ? "Checking the archives..." : "Confirm Connection →"}
      </button>
    </div>
  );
}

export default function HollywoodConnections() {
  const [screen, setScreen] = useState("menu");
  const [difficulty, setDifficulty] = useState(null);
  const [actorA, setActorA] = useState("");
  const [actorB, setActorB] = useState("");
  const [chain, setChain] = useState([]);
  const [currentActor, setCurrentActor] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [moves, setMoves] = useState(0);
  const [bestScores, setBestScores] = useState({});

  const startGame = (diff) => {
    const pairs = DIFFICULTIES[diff].pairs;
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    setDifficulty(diff);
    setActorA(pair[0]);
    setActorB(pair[1]);
    setCurrentActor(pair[0]);
    setChain([]);
    setMoves(0);
    setMessage(null);
    setHint(null);
    setScreen("game");
  };

  const handleStep = async (movie, actor2) => {
    setLoading(true);
    setMessage(null);
    setHint(null);
    try {
      const result = await validateStep(currentActor, movie, actor2);
      if (result.valid) {
        const newChain = [...chain, { actor: currentActor, movie: result.confirmed_movie || movie }];
        const newMoves = moves + 1;
        setChain(newChain);
        setMoves(newMoves);
        const normalize = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
        if (normalize(actor2).includes(normalize(actorB)) || normalize(actorB).includes(normalize(actor2))) {
          setBestScores((prev) => {
            const prev_score = prev[difficulty];
            if (!prev_score || newMoves < prev_score) return { ...prev, [difficulty]: newMoves };
            return prev;
          });
          setScreen("win");
        } else {
          setCurrentActor(actor2);
          setMessage({ text: result.reason || "Correct! Keep going.", type: "ok" });
        }
      } else {
        setMessage({ text: result.reason || "That connection doesn't check out. Try again.", type: "err" });
      }
    } catch {
      setMessage({ text: "Server error. Please try again.", type: "err" });
    }
    setLoading(false);
  };

  const handleHint = async () => {
    setHintLoading(true);
    const chainDesc = chain.map((l) => `${l.actor} → ${l.movie}`).join(", ");
    const h = await getHint(currentActor, actorB, chainDesc);
    setHint(h);
    setHintLoading(false);
  };

  // ── MENU ────────────────────────────────────────────────────────────────
  if (screen === "menu") return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 20%, #1a1005 0%, #080808 70%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 20px",
      position: "relative",
    }}>
      <StarField />
      <FilmStrip top />
      <FilmStrip />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 560, width: "100%" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.4em", color: "#d4af37", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Courier Prime', monospace" }}>
          ★ A Hollywood Quiz Game ★
        </div>
        <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)", fontWeight: 900, color: "#f0e6c8", margin: 0, lineHeight: 1, textShadow: "0 0 60px rgba(212,175,55,0.3)" }}>
          Hollywood
        </h1>
        <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)", fontWeight: 900, color: "#d4af37", margin: "0 0 16px", lineHeight: 1 }}>
          Connections
        </h1>
        <p style={{ color: "#777", fontFamily: "'Courier Prime', monospace", fontSize: 14, margin: "0 0 36px", lineHeight: 1.7 }}>
          Connect two stars of the silver screen by naming their co-stars and shared films. Fewer moves = better score.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
          {Object.entries(DIFFICULTIES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => startGame(key)}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #2a2a2a",
                borderRadius: 12,
                padding: "20px 12px",
                cursor: "pointer",
                color: "#f0e6c8",
                textAlign: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.08)"; e.currentTarget.style.borderColor = "#d4af37"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "#2a2a2a"; }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}>{key === "Easy" ? "🎬" : key === "Medium" ? "🎭" : "🏆"}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{key}</div>
              <div style={{ color: "#555", fontSize: 11, fontFamily: "'Courier Prime', monospace" }}>{val.desc}</div>
              {bestScores[key] && (
                <div style={{ color: "#d4af37", fontSize: 11, marginTop: 8, fontFamily: "'Courier Prime', monospace" }}>
                  Best: {bestScores[key]} move{bestScores[key] !== 1 ? "s" : ""}
                </div>
              )}
            </button>
          ))}
        </div>
        <div style={{ color: "#444", fontSize: 12, fontFamily: "'Courier Prime', monospace", lineHeight: 1.8 }}>
          e.g. <span style={{ color: "#888" }}>Hugo Weaving</span> → <em>The Matrix</em> → <span style={{ color: "#888" }}>Keanu Reeves</span> → <em>Speed</em> → <span style={{ color: "#888" }}>Sandra Bullock</span> ✓
        </div>
      </div>
    </div>
  );

  // ── WIN ─────────────────────────────────────────────────────────────────
  if (screen === "win") return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 30%, #1a1208 0%, #080808 70%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 20px",
      position: "relative",
    }}>
      <StarField />
      <FilmStrip top />
      <FilmStrip />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 560, width: "100%" }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
        <h2 style={{ color: "#d4af37", fontSize: "2rem", margin: "0 0 8px" }}>Connected!</h2>
        <p style={{ color: "#777", fontFamily: "'Courier Prime', monospace", fontSize: 14, marginBottom: 24 }}>
          {actorA} → {actorB} in {moves} move{moves !== 1 ? "s" : ""}
        </p>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          textAlign: "left",
        }}>
          <div style={{ color: "#555", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Courier Prime', monospace" }}>Your path</div>
          {chain.map((link, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 14 }}>{link.actor}</span>
              <span style={{ color: "#555", fontSize: 12 }}>in</span>
              <span style={{ color: "#aaa", fontStyle: "italic", fontFamily: "'Courier Prime', monospace", fontSize: 13 }}>{link.movie}</span>
            </div>
          ))}
          <div style={{ color: "#e08080", fontWeight: 700, fontSize: 14, marginTop: 4 }}>→ {actorB} ✓</div>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => startGame(difficulty)}
            style={{
              background: "linear-gradient(135deg, #d4af37, #9a7318)",
              border: "none", borderRadius: 8,
              color: "#1a1208", padding: "12px 28px",
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}
          >Play Again</button>
          <button
            onClick={() => setScreen("menu")}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid #333", borderRadius: 8,
              color: "#aaa", padding: "12px 28px",
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}
          >Menu</button>
        </div>
      </div>
    </div>
  );

  // ── GAME ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 10%, #120e05 0%, #080808 70%)",
      padding: "48px 20px",
      position: "relative",
    }}>
      <StarField />
      <FilmStrip top />
      <FilmStrip />
      <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button
            onClick={() => setScreen("menu")}
            style={{
              background: "none", border: "1px solid #2a2a2a", borderRadius: 6,
              color: "#555", padding: "6px 14px",
              fontFamily: "'Courier Prime', monospace", fontSize: 12, cursor: "pointer",
            }}
          >← Menu</button>
          <div style={{ color: "#d4af37", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Courier Prime', monospace" }}>
            {difficulty} · {moves} move{moves !== 1 ? "s" : ""}
          </div>
          <button
            onClick={handleHint}
            disabled={hintLoading}
            style={{
              background: "none", border: "1px solid #2a2a2a", borderRadius: 6,
              color: hintLoading ? "#444" : "#777", padding: "6px 14px",
              fontFamily: "'Courier Prime', monospace", fontSize: 12,
              cursor: hintLoading ? "not-allowed" : "pointer",
            }}
          >{hintLoading ? "..." : "💡 Hint"}</button>
        </div>

        <div style={{
          textAlign: "center", marginBottom: 28, padding: "20px",
          background: "rgba(255,255,255,0.02)", border: "1px solid #1e1e1e", borderRadius: 12,
        }}>
          <div style={{ color: "#444", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Courier Prime', monospace", marginBottom: 10 }}>Connect the Stars</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ color: "#d4af37", fontWeight: 900, fontSize: "clamp(1.1rem, 4vw, 1.5rem)" }}>{actorA}</span>
            <span style={{ color: "#333", fontSize: "1.5rem" }}>⟷</span>
            <span style={{ color: "#e08080", fontWeight: 900, fontSize: "clamp(1.1rem, 4vw, 1.5rem)" }}>{actorB}</span>
          </div>
        </div>

        <ChainDisplay chain={chain} targetActor={chain.length > 0 ? actorB : null} />

        <StepInput
          currentActor={currentActor}
          targetActor={actorB}
          onSubmit={handleStep}
          loading={loading}
        />

        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 8, marginBottom: 12,
            background: message.type === "ok" ? "rgba(80,160,80,0.08)" : "rgba(180,60,60,0.08)",
            border: `1px solid ${message.type === "ok" ? "#2a5a2a" : "#5a2020"}`,
            color: message.type === "ok" ? "#6ab46a" : "#b06060",
            fontFamily: "'Courier Prime', monospace", fontSize: 13,
          }}>
            {message.type === "ok" ? "✓ " : "✗ "}{message.text}
          </div>
        )}

        {hint && (
          <div style={{
            padding: "12px 16px", borderRadius: 8, marginBottom: 12,
            background: "rgba(212,175,55,0.05)", border: "1px solid #3a3010",
            color: "#a08020", fontFamily: "'Courier Prime', monospace",
            fontSize: 13, fontStyle: "italic",
          }}>
            💡 {hint}
          </div>
        )}

        <div style={{
          marginTop: 24, padding: "14px 16px", borderRadius: 8,
          background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a",
        }}>
          <div style={{ color: "#444", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Courier Prime', monospace", marginBottom: 6 }}>How to play</div>
          <div style={{ color: "#444", fontSize: 12, fontFamily: "'Courier Prime', monospace", lineHeight: 1.7 }}>
            Name a <span style={{ color: "#888" }}>movie</span> featuring <span style={{ color: "#d4af37" }}>{currentActor}</span>, then name a <span style={{ color: "#888" }}>co-star</span> from that film. Keep chaining until you reach <span style={{ color: "#e08080" }}>{actorB}</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
