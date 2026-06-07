import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

export async function POST(request) {
  try {
    const { actor1, movie, actor2 } = await request.json();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify({ actor1, movie, actor2 }) }],
    });

    const text = message.content.map((b) => b.text || "").join("");
    const result = JSON.parse(text.replace(/```json|```/g, "").trim());
    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json({ valid: false, reason: "Server error. Please try again." }, { status: 500 });
  }
}
