// An in-process stand-in for the parts of Google Drive API v3 that DriveRemoteStore uses.
// It encodes the documented behavior (appProperties queries, parents, trashed, versions) so the
// adapter can be tested without a Google account; a real-account run is still on the device checklist.

export const FOLDER = "application/vnd.google-apps.folder";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  appProperties: Record<string, string>;
  trashed: boolean;
  createdTime: string;
  version: number;
  content?: Uint8Array;
}

export class FakeDrive {
  files: DriveFile[] = [];
  token = "valid-token";
  /** Respond to the next request with this error status instead of handling it. */
  failNext: { status: number; body?: object } | null = null;
  requests: { method: string; path: string; authorization: string | null }[] = [];
  private nextId = 1;
  private clock = 0;

  fetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(String(input));
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    this.requests.push({ method, path: url.pathname, authorization: headers.get("authorization") });

    if (this.failNext) {
      const { status, body } = this.failNext;
      this.failNext = null;
      return Response.json(body ?? { error: { code: status } }, { status });
    }
    if (headers.get("authorization") !== `Bearer ${this.token}`) return Response.json({ error: { code: 401 } }, { status: 401 });

    const upload = url.pathname.startsWith("/upload/drive/v3/files");
    const match = /\/drive\/v3\/files\/([^/]+)$/.exec(url.pathname) ?? /\/upload\/drive\/v3\/files\/([^/]+)$/.exec(url.pathname);
    const id = match?.[1];

    if (method === "GET" && !id) return this.list(url);
    if (method === "POST" && !upload) return this.create(JSON.parse(String(init.body)));
    if (method === "POST" && upload) return this.createWithContent(headers.get("content-type") ?? "", await bytes(init.body));
    if (method === "PATCH" && upload && id) return this.replaceContent(id, await bytes(init.body));
    if (method === "GET" && id) return this.get(id, url);
    if (method === "DELETE" && id) return this.remove(id);
    return Response.json({ error: { code: 400, message: `Unhandled ${method} ${url.pathname}` } }, { status: 400 });
  };

  private add(meta: Partial<DriveFile>, content?: Uint8Array): DriveFile {
    const file: DriveFile = {
      id: `id-${this.nextId++}`,
      name: meta.name ?? "untitled",
      mimeType: meta.mimeType ?? "application/octet-stream",
      parents: meta.parents ?? [],
      appProperties: meta.appProperties ?? {},
      trashed: false,
      createdTime: new Date(Date.UTC(2026, 0, 1, 0, 0, this.clock++)).toISOString(),
      version: 1,
      content,
    };
    this.files.push(file);
    return file;
  }

  private list(url: URL) {
    const q = url.searchParams.get("q") ?? "";
    const prop = /appProperties has \{ key='([^']+)' and value='([^']+)' \}/.exec(q);
    const parent = /'([^']+)' in parents/.exec(q);
    const mime = /mimeType='([^']+)'/.exec(q);
    const name = /name='([^']+)'/.exec(q);
    const found = this.files
      .filter((f) => !/trashed=false/.test(q) || !f.trashed)
      .filter((f) => !prop || f.appProperties[prop[1]] === prop[2])
      .filter((f) => !parent || f.parents.includes(parent[1]))
      .filter((f) => !mime || f.mimeType === mime[1])
      .filter((f) => !name || f.name === name[1])
      .sort((a, b) => a.createdTime.localeCompare(b.createdTime));
    return Response.json({ files: found.map(summary) });
  }

  private create(meta: Partial<DriveFile>) {
    return Response.json(summary(this.add(meta)));
  }

  private createWithContent(contentType: string, body: Uint8Array) {
    const boundary = /boundary=(.+)$/.exec(contentType)?.[1];
    if (!boundary) return Response.json({ error: { code: 400 } }, { status: 400 });
    const text = new TextDecoder("latin1").decode(body);
    const parts = text.split(`--${boundary}`).slice(1, -1);
    const [metaPart, mediaPart] = parts.map((p) => p.replace(/^\r\n/, "").replace(/\r\n$/, "").split("\r\n\r\n"));
    const meta = JSON.parse(metaPart.slice(1).join("\r\n\r\n"));
    const content = Uint8Array.from(mediaPart.slice(1).join("\r\n\r\n"), (c) => c.charCodeAt(0));
    return Response.json(summary(this.add(meta, content)));
  }

  private replaceContent(id: string, body: Uint8Array) {
    const file = this.files.find((f) => f.id === id);
    if (!file) return Response.json({ error: { code: 404 } }, { status: 404 });
    file.content = body;
    file.version++;
    return Response.json(summary(file));
  }

  private get(id: string, url: URL) {
    const file = this.files.find((f) => f.id === id);
    if (!file) return Response.json({ error: { code: 404 } }, { status: 404 });
    if (url.searchParams.get("alt") === "media") return new Response(file.content as BodyInit);
    return Response.json(summary(file));
  }

  private remove(id: string) {
    const index = this.files.findIndex((f) => f.id === id);
    if (index < 0) return Response.json({ error: { code: 404 } }, { status: 404 });
    this.files.splice(index, 1);
    return new Response(null, { status: 204 });
  }

  /** Test helpers: what the user does in Drive. */
  folders(name: string) {
    return this.files.filter((f) => f.mimeType === FOLDER && f.name === name && !f.trashed);
  }
  named(name: string) {
    return this.files.filter((f) => f.name === name);
  }
  text(file: DriveFile) {
    return new TextDecoder().decode(file.content);
  }
}

function summary(f: DriveFile) {
  return {
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    parents: f.parents,
    appProperties: f.appProperties,
    trashed: f.trashed,
    createdTime: f.createdTime,
    version: String(f.version),
  };
}

async function bytes(body: BodyInit | null | undefined): Promise<Uint8Array> {
  if (body === undefined || body === null) return new Uint8Array();
  return new Uint8Array(await new Response(body).arrayBuffer());
}
