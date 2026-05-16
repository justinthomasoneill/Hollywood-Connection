import { useState, useEffect, useRef } from "react";

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

const SYSTEM_PROMPT = `You are the game engine for "Hollywood Connections," a Six Degrees of Separation quiz game.

The player is trying to connect two actors by naming cast members and movies in a chain.
Each step of the chain is: Actor A → [Movie they share] → Actor B.

Your job is to VALIDATE each individual step the player proposes.

You will receive JSON with:
- "actor1": the actor the player is connecting FROM in this step
- "actor2": the actor the player claims was in the same movie
- "movie": the movie the player claims they share

Respond ONLY with a JSON object (no markdown, no explanation) in this format:
{
  "valid": true | false,
  "reason": "brief friendly explanation if invalid, or a fun confirmation fact if valid",
  "confirmed_movie": "the canonical movie title if valid"
}

Be lenient with spelling/capitalization. Use your knowledge of actual film casts. If the claim is real and accurate, mark it valid. If the movie exists but one of the actors wasn't in it, or the movie doesn't exist, mark it invalid.`;

async function validateStep(actor1, movie, actor2) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify({ actor1, movie, actor2 }),
        },
      ],
    }),
  });
  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("") || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { valid: false, reason: "Couldn't verify that connection. Try again." };
  }
}

async function getHint(fromActor, targetActor, chainSoFar) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `In the Hollywood Connections game, the player needs to connect "${fromActor}" to "${targetActor}".
Chain so far: ${chainSoFar || "none yet"}.
Give ONE helpful hint — suggest a movie or actor they might think about — without giving the full answer. Keep it to 1-2 sentences, playful tone. No JSON needed.`,
        },
      ],
    }),
  });
  const data = await response.json();
  return data.content?.map((b) => b.text || "").join("") || "Think about blockbusters from the 90s...";
}

// ─── Film strip decoration ───────────────────────────────────────────────────
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

// ─── Star field background ───────────────────────────────────────────────────
function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.1,
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

// ─── Chain link display ──────────────────────────────────────────────────────
function ChainDisplay({ chain, targetActor }) {
  if (chain.length === 0) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
        {chain.map((link, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
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
            <span style={{ color: "#888", fontSize: 12 }}>in</span>
            <span style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid #444",
              color: "#ccc",
              borderRadius: 6,
              padding: "3px 10px",
              fontFamily: "'Courier Prime', monospace",
              fontSize: 12,
              fontStyle: "italic",
            }}>{link.movie}</span>
            <span style={{ color: "#555", fontSize: 18 }}>→</span>
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

// ─── Input form ──────────────────────────────────────────────────────────────
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
    border: "1px solid #444",
    borderRadius: 8,
    color: "#f0e6c8",
    padding: "10px 14px",
    fontFamily: "'Courier Prime', monospace",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    color: "#888",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid #333",
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ color: "#aaa", fontSize: 13, marginBottom: 16, fontFamily: "'Courier Prime', monospace" }}>
        Connect <span style={{ color: "#d4af37", fontWeight: 600 }}>{currentActor}</span> to{" "}
        <span style={{ color: "#e08080", fontWeight: 600 }}>{targetActor}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Movie / Film</label>
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
          <label style={labelStyle}>Co-star in that film</label>
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
          background: loading ? "#333" : "linear-gradient(135deg, #d4af37, #a07820)",
          border: "none",
          borderRadius: 8,
          color: loading ? "#666" : "#1a1208",
          padding: "10px 24px",
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: 14,
          cursor: loading ? "not-allowed" : "pointer",
          letterSpacing: "0.05em",
          transition: "all 0.2s",
          width: "100%",
        }}
      >
        {loading ? "Checking the archives..." : "Confirm Connection →"}
      </button>
    </div>
  );
}

// ─── Main game ───────────────────────────────────────────────────────────────
export default function HollywoodConnections() {
  const [screen, setScreen] = useState("menu"); // menu | game | win
  const [difficulty, setDifficulty] = useState(null);
  const [actorA, setActorA] = useState("");
  const [actorB, setActorB] = useState("");
  const [chain, setChain] = useState([]); // [{actor, movie}]
  const [currentActor, setCurrentActor] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // {text, type: ok|err}
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

        // Check if actor2 matches actorB (case-insensitive, fuzzy)
        const normalize = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
        if (normalize(actor2).includes(normalize(actorB)) || normalize(actorB).includes(normalize(actor2))) {
          // Win!
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
      setMessage({ text: "Network hiccup. Try again.", type: "err" });
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

  // ── MENU ──────────────────────────────────────────────────────────────────
  if (screen === "menu") return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 20%, #1a1005 0%, #0a0a0a 70%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Playfair Display', serif",
      padding: "40px 20px",
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      <StarField />
      <FilmStrip top />
      <FilmStrip />

      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 560 }}>
        {/* Logo */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            fontSize: 11,
            letterSpacing: "0.4em",
            color: "#d4af37",
            textTransform: "uppercase",
            marginBottom: 12,
            fontFamily: "'Courier Prime', monospace",
          }}>★ A Hollywood Quiz Game ★</div>
          <h1 style={{
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            fontWeight: 900,
            color: "#f0e6c8",
            margin: 0,
            lineHeight: 1,
            textShadow: "0 0 60px rgba(212,175,55,0.3)",
            letterSpacing: "-0.01em",
          }}>Hollywood</h1>
          <h1 style={{
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            fontWeight: 900,
            color: "#d4af37",
            margin: 0,
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}>Connections</h1>
        </div>

        <p style={{
          color: "#888",
          fontFamily: "'Courier Prime', monospace",
          fontSize: 14,
          margin: "20px 0 40px",
          lineHeight: 1.7,
        }}>
          Connect two stars of the silver screen by naming their co-stars and shared films.
          The fewer moves, the better. Lights, camera, action.
        </p>

        {/* Difficulty cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
          {Object.entries(DIFFICULTIES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => startGame(key)}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #333",
                borderRadius: 12,
                padding: "20px 12px",
                cursor: "pointer",
                color: "#f0e6c8",
                transition: "all 0.2s",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(212,175,55,0.08)";
                e.currentTarget.style.borderColor = "#d4af37";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "#333";
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>
                {key === "Easy" ? "🎬" : key === "Medium" ? "🎭" : "🏆"}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{key}</div>
              <div style={{ color: "#666", fontSize: 11, fontFamily: "'Courier Prime', monospace" }}>{val.desc}</div>
              {bestScores[key] && (
                <div style={{ color: "#d4af37", fontSize: 11, marginTop: 8, fontFamily: "'Courier Prime', monospace" }}>
                  Best: {bestScores[key]} move{bestScores[key] !== 1 ? "s" : ""}
                </div>
              )}
            </button>
          ))}
        </div>

        <div style={{
          color: "#555",
          fontSize: 12,
          fontFamily: "'Courier Prime', monospace",
          lineHeight: 1.8,
        }}>
          Example: <span style={{ color: "#888" }}>Hugo Weaving</span> → <em>The Matrix</em> → <span style={{ color: "#888" }}>Keanu Reeves</span> → <em>Speed</em> → <span style={{ color: "#888" }}>Sandra Bullock</span> ✓
        </div>
      </div>
    </div>
  );

  // ── WIN ───────────────────────────────────────────────────────────────────
  if (screen === "win") return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 30%, #1a1208 0%, #0a0a0a 70%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Playfair Display', serif",
      padding: "40px 20px",
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      <StarField />
      <FilmStrip top />
      <FilmStrip />

      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 560 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
        <h2 style={{ color: "#d4af37", fontSize: "2rem", margin: "0 0 8px" }}>You're Connected!</h2>
        <p style={{ color: "#888", fontFamily: "'Courier Prime', monospace", fontSize: 14 }}>
          {actorA} → {actorB} in {moves} move{moves !== 1 ? "s" : ""}
        </p>

        {/* Chain replay */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid #333",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          textAlign: "left",
        }}>
          <div style={{ color: "#666", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Courier Prime', monospace" }}>Your path</div>
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
              background: "linear-gradient(135deg, #d4af37, #a07820)",
              border: "none", borderRadius: 8,
              color: "#1a1208", padding: "12px 24px",
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}
          >Play Again</button>
          <button
            onClick={() => setScreen("menu")}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid #444", borderRadius: 8,
              color: "#aaa", padding: "12px 24px",
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}
          >Main Menu</button>
        </div>
      </div>
    </div>
  );

  // ── GAME ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 10%, #120e05 0%, #080808 70%)",
      fontFamily: "'Playfair Display', serif",
      padding: "50px 20px 50px",
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      <StarField />
      <FilmStrip top />
      <FilmStrip />

      <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 10 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button
            onClick={() => setScreen("menu")}
            style={{
              background: "none", border: "1px solid #333", borderRadius: 6,
              color: "#666", padding: "6px 12px",
              fontFamily: "'Courier Prime', monospace", fontSize: 12,
              cursor: "pointer",
            }}
          >← Menu</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#d4af37", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Courier Prime', monospace" }}>
              {difficulty} · {moves} move{moves !== 1 ? "s" : ""}
            </div>
          </div>
          <button
            onClick={handleHint}
            disabled={hintLoading}
            style={{
              background: "none", border: "1px solid #333", borderRadius: 6,
              color: hintLoading ? "#444" : "#888", padding: "6px 12px",
              fontFamily: "'Courier Prime', monospace", fontSize: 12,
              cursor: hintLoading ? "not-allowed" : "pointer",
            }}
          >{hintLoading ? "..." : "💡 Hint"}</button>
        </div>

        {/* Challenge banner */}
        <div style={{
          textAlign: "center",
          marginBottom: 28,
          padding: "20px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
        }}>
          <div style={{ color: "#555", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Courier Prime', monospace", marginBottom: 10 }}>Connect the Stars</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ color: "#d4af37", fontWeight: 900, fontSize: "clamp(1.1rem, 4vw, 1.5rem)" }}>{actorA}</span>
            <span style={{ color: "#444", fontSize: "1.5rem" }}>⟷</span>
            <span style={{ color: "#e08080", fontWeight: 900, fontSize: "clamp(1.1rem, 4vw, 1.5rem)" }}>{actorB}</span>
          </div>
        </div>

        {/* Chain so far */}
        <ChainDisplay chain={chain} targetActor={chain.length > 0 ? actorB : null} />

        {/* Input */}
        <StepInput
          currentActor={currentActor}
          targetActor={actorB}
          onSubmit={handleStep}
          loading={loading}
        />

        {/* Message */}
        {message && (
          <div style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: message.type === "ok" ? "rgba(100,200,100,0.08)" : "rgba(200,80,80,0.08)",
            border: `1px solid ${message.type === "ok" ? "#3a6a3a" : "#6a2a2a"}`,
            color: message.type === "ok" ? "#7cc47c" : "#c07070",
            fontFamily: "'Courier Prime', monospace",
            fontSize: 13,
            marginBottom: 12,
          }}>
            {message.type === "ok" ? "✓ " : "✗ "}{message.text}
          </div>
        )}

        {/* Hint */}
        {hint && (
          <div style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(212,175,55,0.06)",
            border: "1px solid #4a3a10",
            color: "#b09030",
            fontFamily: "'Courier Prime', monospace",
            fontSize: 13,
            marginBottom: 12,
            fontStyle: "italic",
          }}>
            💡 {hint}
          </div>
        )}

        {/* How to play */}
        <div style={{
          marginTop: 24,
          padding: "14px 16px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid #222",
        }}>
          <div style={{ color: "#555", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Courier Prime', monospace", marginBottom: 8 }}>How to play</div>
          <div style={{ color: "#555", fontSize: 12, fontFamily: "'Courier Prime', monospace", lineHeight: 1.7 }}>
            Name a <span style={{ color: "#aaa" }}>movie</span> featuring <span style={{ color: "#d4af37" }}>{currentActor}</span>, then name a <span style={{ color: "#aaa" }}>co-star</span> from that film.
            Keep chaining until you reach <span style={{ color: "#e08080" }}>{actorB}</span>. Fewer moves = better score.
          </div>
        </div>
      </div>
    </div>
  );
}
