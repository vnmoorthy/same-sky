import type { Artist, Postcard, Senses } from "../types";
import { runtimeEnv } from "./db";

type PostcardInput = {
  sessionCode: string;
  artist: Artist;
  stageName: string;
  observation: string;
  senses: Senses;
  photoDataUrl?: string | null;
};

type GeneratedPostcard = {
  postcard: Postcard;
  mode: "openai" | "festival-safe";
};

const PALETTES: Array<[string, string, string]> = [
  ["#17152f", "#6d63ff", "#ff7a61"],
  ["#071f2b", "#2bb8a7", "#e9d985"],
  ["#261330", "#bd5cff", "#ff9d72"],
  ["#09172f", "#3d8dff", "#c8e0ff"],
];

function hashText(value: string): number {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function clean(value: string, limit: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}

function fallbackPostcard(input: PostcardInput): Postcard {
  const seed = hashText(`${input.sessionCode}:${input.artist.name}:${input.observation}`);
  const palette = PALETTES[seed % PALETTES.length];
  const energyWord = input.senses.energy > 78 ? "high" : input.senses.energy > 48 ? "steady" : "low";
  const tagLine = input.senses.tags.slice(0, 2).join(" and ") || "the open field";
  const observation = clean(input.observation, 180).replace(/[.!?]+$/, "");
  const titleStarts = ["A signal from the field", "A small piece of right now", "What the camera cannot carry", "One person, here now"];
  const title = titleStarts[seed % titleStarts.length];
  const body = `${observation || `The ${input.artist.name} set is visible from ${input.stageName}`}. The sender describes ${clean(input.senses.air, 40)} air, ${clean(input.senses.light, 40)} light, and ${tagLine}. Their own energy estimate is ${energyWord}: ${input.senses.energy} out of 100. This is one person’s signal from the field; no performance audio was recorded or sent.`;

  return {
    title,
    body,
    altText: `An abstract festival postcard for ${input.artist.name}, using ${input.senses.light} light alongside the sender’s energy estimate of ${input.senses.energy} out of 100.`,
    signal: `${input.senses.energy}/100 energy · ${input.senses.air} air · ${input.senses.light} light`,
    palette,
  };
}

function validPostcard(value: unknown): value is Postcard {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === "string" &&
    typeof candidate.body === "string" &&
    typeof candidate.altText === "string" &&
    typeof candidate.signal === "string" &&
    Array.isArray(candidate.palette) &&
    candidate.palette.length === 3 &&
    candidate.palette.every((color) => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color))
  );
}

function extractOutputText(response: Record<string, unknown>): string | null {
  if (typeof response.output_text === "string") return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") return text;
    }
  }
  return null;
}

export async function generatePostcard(input: PostcardInput): Promise<GeneratedPostcard> {
  const fallback = fallbackPostcard(input);
  const { OPENAI_API_KEY, OPENAI_MODEL } = runtimeEnv();
  if (!OPENAI_API_KEY) return { postcard: fallback, mode: "festival-safe" };

  const content: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text: JSON.stringify({
        artist: input.artist.name,
        stage: input.stageName,
        firsthand_observation: clean(input.observation, 600),
        sender_reported_energy_0_to_100: input.senses.energy,
        uncalibrated_on_device_ambient_intensity_estimate_0_to_100: input.senses.soundLevel,
        observer_tags: input.senses.tags.slice(0, 6),
        observer_light_description: clean(input.senses.light, 60),
        observer_air_description: clean(input.senses.air, 60),
      }),
    },
  ];
  if (input.photoDataUrl?.startsWith("data:image/")) {
    content.push({ type: "input_image", image_url: input.photoDataUrl, detail: "low" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL || "gpt-5.6-terra",
        reasoning: { effort: "low" },
        store: false,
        safety_identifier: `same-sky-${input.sessionCode.toLowerCase()}`,
        instructions:
          "Create one restrained sensory postcard from a festival attendee to a remote viewer. Use only details explicitly supplied or plainly visible in the image. Never identify or describe individual people, infer private traits or emotions, quote lyrics, invent weather, claim artist endorsement, or imply that audio was recorded. Write with human specificity, not advertising language. The body must be 45–70 words. Alt text must be objective and useful. Return only the requested JSON.",
        input: [{ role: "user", content }],
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "same_sky_postcard",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["title", "body", "altText", "signal", "palette"],
              properties: {
                title: { type: "string", minLength: 4, maxLength: 52 },
                body: { type: "string", minLength: 80, maxLength: 520 },
                altText: { type: "string", minLength: 20, maxLength: 280 },
                signal: { type: "string", minLength: 8, maxLength: 120 },
                palette: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                },
              },
            },
          },
        },
        max_output_tokens: 700,
      }),
      signal: AbortSignal.timeout(5_500),
    });

    if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);
    const result = (await response.json()) as Record<string, unknown>;
    const outputText = extractOutputText(result);
    if (!outputText) throw new Error("OpenAI returned no postcard text");
    const parsed = JSON.parse(outputText) as unknown;
    if (!validPostcard(parsed)) throw new Error("OpenAI postcard failed validation");
    return {
      postcard: {
        ...parsed,
        title: clean(parsed.title, 52),
        body: clean(parsed.body, 520),
        altText: clean(parsed.altText, 280),
        signal: clean(parsed.signal, 120),
      },
      mode: "openai",
    };
  } catch (error) {
    console.warn("Same Sky used its festival-safe postcard generator", error);
    return { postcard: fallback, mode: "festival-safe" };
  }
}
