import { describe, expect, test, vi } from "vitest";
import { AuthExpiredError, DailyLimitError } from "../ports";
import { ClaudeRecognizer } from "./claude-recognizer";

const blob = (text: string) => new Blob([text], { type: "image/webp" });

function recognizer(respond: () => Response | Promise<Response>, getIdToken = async () => "id-token") {
  const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => respond());
  const claude = new ClaudeRecognizer({ url: "https://proxy.example.test", getIdToken, fetch: fetchMock as unknown as typeof fetch });
  return { claude, fetchMock };
}

describe("ClaudeRecognizer", () => {
  test("sends both photos and the Google ID token to the proxy and returns the suggestion", async () => {
    const { claude, fetchMock } = recognizer(() =>
      Response.json({ suggestion: { player: "Ronald Acuña Jr.", year: 2024 }, lowConfidence: ["year"] }),
    );
    const result = await claude.recognize({ front: blob("f"), back: blob("b") });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://proxy.example.test/identify");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).authorization).toBe("Bearer id-token");
    const form = init?.body as FormData;
    expect([...form.keys()].sort()).toEqual(["back", "front"]);
    expect(result).toEqual({ player: "Ronald Acuña Jr.", year: 2024, lowConfidence: ["year"] });
  });

  test("sends only the photos that exist", async () => {
    const { claude, fetchMock } = recognizer(() => Response.json({ suggestion: {}, lowConfidence: [] }));
    await claude.recognize({ front: blob("f") });
    expect([...(fetchMock.mock.calls[0][1]?.body as FormData).keys()]).toEqual(["front"]);
  });

  test("the daily limit response becomes a DailyLimitError", async () => {
    const { claude } = recognizer(() => Response.json({ error: "daily_limit" }, { status: 429 }));
    await expect(claude.recognize({ front: blob("f") })).rejects.toBeInstanceOf(DailyLimitError);
  });

  test("other failures are reported without exposing the response body", async () => {
    const { claude } = recognizer(() => new Response("secret upstream detail", { status: 502 }));
    const error = await claude.recognize({ front: blob("f") }).catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain("secret");
  });

  test("an expired Google session is passed through so the app can ask to sign in again", async () => {
    const { claude, fetchMock } = recognizer(
      () => Response.json({}),
      async () => {
        throw new AuthExpiredError("Sign in again");
      },
    );
    await expect(claude.recognize({ front: blob("f") })).rejects.toBeInstanceOf(AuthExpiredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
