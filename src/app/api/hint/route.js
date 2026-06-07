import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { fromActor, targetActor, chainSoFar } = await request.json();

    const message = await client.messages.create({
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
    });

    const hint = message.content.map((b) => b.text || "").join("");
    return Response.json({ hint });
  } catch (err) {
    console.error(err);
    return Response.json({ hint: "Think about big blockbusters from the 90s..." }, { status: 500 });
  }
}
