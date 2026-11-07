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
  "Report only what you can read or identify with confidence, and leave out anything you cannot see.";

const text = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);
const integer = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : undefined);

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
  return clean(call.input);
}
