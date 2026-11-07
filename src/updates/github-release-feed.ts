import type { ReleaseFeed } from "../ports";

interface GitHubRelease {
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
}

export class GitHubReleaseFeed implements ReleaseFeed {
  constructor(
    private repo: string,
    private fetchFn: typeof fetch = (...args) => fetch(...args),
  ) {}

  async latest() {
    // Anonymous on purpose: no card data, photos, cookies or Google credentials go to GitHub.
    const response = await this.fetchFn(`https://api.github.com/repos/${this.repo}/releases/latest`, {
      credentials: "omit",
      headers: { accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
    const release = (await response.json()) as GitHubRelease;
    const apk = release.assets.find((asset) => asset.name.endsWith(".apk"));
    if (!apk) throw new Error("The latest release has no APK");
    return { version: release.tag_name.replace(/^v/, ""), apkUrl: apk.browser_download_url };
  }
}
