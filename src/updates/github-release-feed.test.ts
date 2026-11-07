import { describe, expect, test, vi } from "vitest";
import { GitHubReleaseFeed } from "./github-release-feed";

const release = {
  tag_name: "v1.3.0",
  assets: [
    { name: "notes.txt", browser_download_url: "https://example.test/notes.txt" },
    { name: "the-binder-1.3.0.apk", browser_download_url: "https://example.test/the-binder-1.3.0.apk" },
  ],
};

function feed(respond: () => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => respond());
  return { feed: new GitHubReleaseFeed("kevinMgreer/the-binder", fetchMock as unknown as typeof fetch), fetchMock };
}

describe("GitHubReleaseFeed", () => {
  test("returns the version without the v and the APK download link", async () => {
    const { feed: f } = feed(() => Response.json(release));
    expect(await f.latest()).toEqual({ version: "1.3.0", apkUrl: "https://example.test/the-binder-1.3.0.apk" });
  });

  test("asks only for the latest release of this repository, with no card data, credentials or cookies", async () => {
    const { feed: f, fetchMock } = feed(() => Response.json(release));
    await f.latest();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.github.com/repos/kevinMgreer/the-binder/releases/latest");
    expect(init?.body).toBeUndefined();
    expect(init?.credentials).toBe("omit");
    const headers = new Headers(init?.headers);
    expect(headers.has("authorization")).toBe(false);
  });

  test("a release without an APK is an error", async () => {
    const { feed: f } = feed(() => Response.json({ tag_name: "v1.3.0", assets: [] }));
    await expect(f.latest()).rejects.toThrow();
  });

  test("a failed request is an error", async () => {
    const { feed: f } = feed(() => new Response("rate limited", { status: 403 }));
    await expect(f.latest()).rejects.toThrow();
  });
});
