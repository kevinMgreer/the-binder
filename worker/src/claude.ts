export interface ClaudeEnv {
  ANTHROPIC_API_KEY: string;
  MODEL: string;
}

export interface CardSuggestion {
  suggestion: {
    player?: string;
    team?: string;
    year?: number;
    manufacturer?: string;
    set?: string;
    cardNumber?: string;
    parallel?: { name: string; serial: number | null; serialLegible: boolean; printRun: number | null };
  };
  lowConfidence: string[];
}

const TOOL = {
  name: "report_card",
  description: "Report the baseball card details visible in the photos.",
  input_schema: {
    type: "object",
    properties: {
      player: { type: "string" },
      team: { type: "string" },
      year: { type: "integer" },
      manufacturer: { type: "string" },
      set: { type: "string" },
      cardNumber: { type: "string" },
      parallel: {
        type: "object",
        description: "Only for parallels or serial-numbered cards such as Gold 23/2026.",
        properties: {
          name: { type: "string" },
          serial: { type: "integer", description: "The 23 in 23/2026. Omit when not legible." },
          serialLegible: { type: "boolean" },
          printRun: { type: "integer", description: "The 2026 in 23/2026." },
        },
      },
      confidence: {
        type: "object",
        description: "For each field you reported, 'high' or 'low'. Use 'low' when you are guessing.",
        additionalProperties: { type: "string", enum: ["high", "low"] },
      },
    },
    required: ["confidence"],
  },
};

const PROMPT =
  "These are the front and the back (when present) of one baseball card. Report its details by calling report_card. " +
  "Fill in every field you can, and give your best guess rather than leaving a field out: report guesses with confidence \"low\" (the app flags those for the owner to check) and reserve omission for fields with no evidence at all. " +
  "player: the name as printed on the front. team: the team shown on the card. " +
  "year: the season or the copyright year on the back (the line with a (c) or copyright symbol, often next to the manufacturer); if only a copyright year is visible, use it. " +
  "manufacturer and set: from the logos and set name on the front or back (for example Topps, Series 1). " +
  "cardNumber: the number on the back. Use the parallel field only for parallels or serial-numbered cards (for example 23/2026).";

const text = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);
// Models sometimes send "1989" for an integer field; dropping it silently lost the year.
const integer = (v: unknown) => {
  const n = typeof v === "string" && /^\s*\d+\s*$/.test(v) ? Number(v) : v;
  return typeof n === "number" && Number.isInteger(n) ? n : undefined;
};

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function clean(input: Record<string, any>): CardSuggestion {
  const suggestion: CardSuggestion["suggestion"] = {
    player: text(input.player),
    team: text(input.team),
    year: integer(input.year),
    manufacturer: text(input.manufacturer),
    set: text(input.set),
    cardNumber: text(input.cardNumber) ?? (integer(input.cardNumber) !== undefined ? String(input.cardNumber) : undefined),
  };
  const p = input.parallel;
  if (p && typeof p === "object") {
    const serial = integer(p.serial) ?? null;
    suggestion.parallel = {
      name: text(p.name) ?? "",
      serial,
      serialLegible: typeof p.serialLegible === "boolean" ? p.serialLegible : serial !== null,
      printRun: integer(p.printRun) ?? null,
    };
  }
  for (const key of Object.keys(suggestion) as (keyof typeof suggestion)[]) {
    if (suggestion[key] === undefined) delete suggestion[key];
  }
  const confidence = input.confidence && typeof input.confidence === "object" ? input.confidence : {};
  const lowConfidence = Object.keys(suggestion).filter((key) => confidence[key] === "low");
  return { suggestion, lowConfidence };
}

export async function identifyCard(images: File[], env: ClaudeEnv): Promise<CardSuggestion> {
  const blocks = await Promise.all(
    images.map(async (file) => ({
      type: "image",
      source: { type: "base64", media_type: file.type || "image/webp", data: toBase64(new Uint8Array(await file.arrayBuffer())) },
    })),
  );
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: env.MODEL,
      max_tokens: 1024,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: [...blocks, { type: "text", text: PROMPT }] }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic responded ${response.status}`);
  const data = (await response.json()) as { content?: { type: string; input?: Record<string, any> }[] };
  const call = data.content?.find((block) => block.type === "tool_use");
  if (!call?.input) throw new Error("Anthropic returned no card details");
  const result = clean(call.input);
  // Field names only, never values: shows in `wrangler tail` what the model sent and what survived cleaning.
  console.log(`identify returned=[${Object.keys(call.input)}] kept=[${Object.keys(result.suggestion)}] low=[${result.lowConfidence}]`);
  return result;
}
