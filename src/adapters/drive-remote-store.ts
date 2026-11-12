import type { CollectionFile } from "../domain/card";
import { AuthExpiredError, type RemoteStore } from "../ports";

const API = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const FOLDER = "application/vnd.google-apps.folder";

// The dev build uses its own folder so testing never touches the real collection.
const ROOTS = {
  release: { name: "The Binder", marker: "root" },
  dev: { name: "The Binder (dev)", marker: "root-dev" },
} as const;

interface Options {
  root: keyof typeof ROOTS;
  getAccessToken: () => Promise<string>;
  /** Called on a 401 before the one retry, so the cached token is dropped. */
  onUnauthorized?: () => Promise<void>;
  fetch?: typeof fetch;
}

interface Listed {
  id: string;
}

function multipart(metadata: object, media: Blob) {
  const boundary = `binder-${crypto.randomUUID()}`;
  const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaHead = `--${boundary}\r\nContent-Type: ${media.type || "application/octet-stream"}\r\n\r\n`;
  return {
    body: new Blob([head, mediaHead, media, `\r\n--${boundary}--`]),
    contentType: `multipart/related; boundary=${boundary}`,
  };
}

export class DriveRemoteStore implements RemoteStore {
  private ids: { root?: string; photos?: string; thumbs?: string; data?: string } = {};
  private fetchFn: typeof fetch;

  constructor(private options: Options) {
    this.fetchFn = options.fetch ?? ((...args) => fetch(...args));
  }

  async version() {
    return (await this.dataMeta())?.version ?? null;
  }

  async readCollection() {
    const meta = await this.dataMeta();
    if (!meta) return null;
    const response = await this.request(`${API}/${meta.id}?alt=media`);
    if (!response.ok) throw new Error(`Drive responded ${response.status}`);
    return { file: (await response.json()) as CollectionFile, version: meta.version };
  }

  async writeCollection(file: CollectionFile) {
    const content = JSON.stringify(file, null, 2);
    const meta = await this.dataMeta();
    if (meta) {
      const response = await this.request(`${UPLOAD}/${meta.id}?uploadType=media&fields=version`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: content,
      });
      if (response.ok) return ((await response.json()) as { version: string }).version;
      if (response.status !== 404) throw new Error(`Drive responded ${response.status}`);
      this.ids.data = undefined;
    }

    // First sign-in: the folder, its photos folders and the data file are all created together.
    const root = await this.rootId(true);
    await this.subfolder("thumbs");
    const { body, contentType } = multipart(
      { name: "collection.json", mimeType: "application/json", parents: [root], appProperties: { thebinder: "data" } },
      new Blob([content], { type: "application/json" }),
    );
    const created = await this.send<{ id: string; version: string }>(`${UPLOAD}?uploadType=multipart&fields=id,version`, body, contentType);
    this.ids.data = created.id;
    return created.version;
  }

  async uploadPhoto(name: string, blob: Blob, kind: "full" | "thumb") {
    const parent = await this.subfolder(kind === "full" ? "photos" : "thumbs");
    const { body, contentType } = multipart({ name, parents: [parent] }, blob);
    return (await this.send<{ id: string }>(`${UPLOAD}?uploadType=multipart&fields=id`, body, contentType)).id;
  }

  async downloadPhoto(fileId: string) {
    const response = await this.request(`${API}/${fileId}?alt=media`);
    if (!response.ok) throw new Error(`Drive responded ${response.status}`);
    return response.blob();
  }

  async deletePhoto(fileId: string) {
    const response = await this.request(`${API}/${fileId}`, { method: "DELETE" });
    if (!response.ok && response.status !== 404) throw new Error(`Drive responded ${response.status}`);
  }

  private async request(url: string, init: RequestInit = {}, retried = false): Promise<Response> {
    const token = await this.options.getAccessToken();
    const response = await this.fetchFn(url, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), authorization: `Bearer ${token}` },
    });
    if (response.status !== 401) return response;
    if (retried) throw new AuthExpiredError("Sign in again");
    await this.options.onUnauthorized?.();
    return this.request(url, init, true);
  }

  private async send<T>(url: string, body: BodyInit, contentType: string): Promise<T> {
    const response = await this.request(url, { method: "POST", headers: { "content-type": contentType }, body });
    if (!response.ok) throw new Error(`Drive responded ${response.status}`);
    return response.json() as Promise<T>;
  }

  private async list(q: string): Promise<Listed[]> {
    const params = new URLSearchParams({ q, fields: "files(id,createdTime)", orderBy: "createdTime", spaces: "drive", pageSize: "10" });
    const response = await this.request(`${API}?${params}`);
    if (!response.ok) throw new Error(`Drive responded ${response.status}`);
    return ((await response.json()) as { files: Listed[] }).files;
  }

  private async createFolder(name: string, parent?: string, appProperties?: Record<string, string>): Promise<Listed> {
    const response = await this.request(`${API}?fields=id`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, mimeType: FOLDER, parents: parent ? [parent] : undefined, appProperties }),
    });
    if (!response.ok) throw new Error(`Drive responded ${response.status}`);
    return response.json() as Promise<Listed>;
  }

  /** The oldest matching folder wins if two installs created one at the same moment. */
  private async rootId(create: false): Promise<string | null>;
  private async rootId(create: true): Promise<string>;
  private async rootId(create: boolean): Promise<string | null> {
    if (this.ids.root) return this.ids.root;
    const { name, marker } = ROOTS[this.options.root];
    const [oldest] = await this.list(`appProperties has { key='thebinder' and value='${marker}' } and mimeType='${FOLDER}' and trashed=false`);
    if (oldest) return (this.ids.root = oldest.id);
    if (!create) return null;
    return (this.ids.root = (await this.createFolder(name, undefined, { thebinder: marker })).id);
  }

  private async subfolder(kind: "photos" | "thumbs"): Promise<string> {
    const cached = this.ids[kind];
    if (cached) return cached;
    const parent = kind === "photos" ? await this.rootId(true) : await this.subfolder("photos");
    const [found] = await this.list(`'${parent}' in parents and name='${kind}' and mimeType='${FOLDER}' and trashed=false`);
    return (this.ids[kind] = found?.id ?? (await this.createFolder(kind, parent)).id);
  }

  /** The data file's id and version, or null when it is missing, deleted or trashed. */
  private async dataMeta(retry = true): Promise<{ id: string; version: string } | null> {
    if (!this.ids.data) {
      const root = await this.rootId(false);
      if (!root) return null;
      const [file] = await this.list(`'${root}' in parents and appProperties has { key='thebinder' and value='data' } and trashed=false`);
      if (!file) return null;
      this.ids.data = file.id;
    }
    const id = this.ids.data;
    const response = await this.request(`${API}/${id}?fields=version,trashed`);
    const meta = response.ok ? ((await response.json()) as { version: string; trashed?: boolean }) : null;
    if (meta && !meta.trashed) return { id, version: meta.version };
    if (response.ok || response.status === 404) {
      this.ids.data = undefined;
      return retry ? this.dataMeta(false) : null;
    }
    throw new Error(`Drive responded ${response.status}`);
  }
}
