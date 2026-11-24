/* GitHub publishing for the admin console.
   Sign-in uses a fine-grained personal access token limited to the one
   portfolio repo (Contents: read & write). The token never leaves this
   browser except in requests to api.github.com.
   Publishing writes content.json plus any newly uploaded images as ONE
   commit (Git Data API), which GitHub Pages then redeploys. */
(function () {
  const API = "https://api.github.com";
  const CFG_KEY = "amp.gh", TOKEN_KEY = "amp.ghToken";
  const CONTENT_PATH = "content.json";

  function readCfg() { try { return JSON.parse(localStorage.getItem(CFG_KEY)) || null; } catch (e) { return null; } }
  function readToken() {
    try { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  }

  // Guess owner/repo when the admin itself is served from <owner>.github.io/<repo>/
  function guessRepo() {
    const m = location.hostname.match(/^([\w-]+)\.github\.io$/i);
    if (!m) return null;
    const seg = location.pathname.split("/").filter(Boolean)[0];
    return { owner: m[1], repo: seg && !seg.endsWith(".html") ? seg : `${m[1]}.github.io`, branch: "main" };
  }

  const b64ToText = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
  const textToB64 = (txt) => { const bytes = new TextEncoder().encode(txt); let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };

  class GitHubError extends Error { constructor(msg, status, code) { super(msg); this.status = status; this.code = code; } }

  async function api(path, opts = {}, token = readToken()) {
    const res = await fetch(path.startsWith("http") ? path : API + path, {
      method: opts.method || "GET",
      headers: Object.assign({ Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
        token ? { Authorization: `Bearer ${token}` } : {}, opts.body ? { "Content-Type": "application/json" } : {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store"
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = res.status === 401 ? "GitHub rejected the token (expired or mistyped)."
        : res.status === 403 ? (data.message || "The token doesn't have permission for this.")
        : res.status === 404 ? "Not found — check the repository name, and that the token has access to it."
        : data.message || `GitHub error ${res.status}`;
      throw new GitHubError(msg, res.status);
    }
    return data;
  }

  const repoPath = (c = readCfg()) => `/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}`;

  // Replace every data: URL in the content with a repo path; returns the files to commit.
  async function extractUploads(content) {
    const files = [];
    const seen = new Map();
    async function walk(node) {
      if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) node[i] = await visit(node[i]); return node; }
      if (node && typeof node === "object") { for (const k of Object.keys(node)) node[k] = await visit(node[k]); return node; }
      return node;
    }
    async function visit(v) {
      if (typeof v === "string" && v.startsWith("data:image/")) {
        if (seen.has(v)) return seen.get(v);
        const m = v.match(/^data:image\/([\w+.-]+);base64,(.*)$/);
        if (!m) return v;
        const ext = m[1] === "jpeg" ? "jpg" : m[1].replace("svg+xml", "svg");
        const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
        const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
        const path = `assets/uploads/${hash}.${ext}`;
        files.push({ path, base64: m[2], dataUrl: v });
        seen.set(v, path);
        return path;
      }
      return walk(v);
    }
    await walk(content);
    return files;
  }

  window.GitHub = {
    GitHubError,
    config: () => readCfg() || guessRepo(),
    isSignedIn: () => !!(readToken() && readCfg()),
    session: () => { try { return JSON.parse(sessionStorage.getItem("amp.ghUser") || localStorage.getItem("amp.ghUser")) || null; } catch (e) { return null; } },

    /** Verify the token can push to the repo, then remember it. */
    async signIn({ owner, repo, branch, token, remember }) {
      owner = owner.trim(); repo = repo.trim(); branch = (branch || "main").trim(); token = token.trim();
      if (!owner || !repo || !token) throw new GitHubError("Repository and token are both required.");
      const cfg = { owner, repo, branch };
      const user = await api("/user", {}, token);
      const r = await api(repoPath(cfg), {}, token);
      if (!r.permissions || !r.permissions.push) throw new GitHubError(`Signed in as ${user.login}, but this token can't write to ${owner}/${repo}. Give it “Contents: Read and write” for this repository.`, 403, "no-push");
      await api(`${repoPath(cfg)}/branches/${encodeURIComponent(branch)}`, {}, token);
      const who = { login: user.login, avatar: user.avatar_url, repoUrl: r.html_url, private: r.private };
      try {
        localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
        (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
        (remember ? localStorage : sessionStorage).setItem("amp.ghUser", JSON.stringify(who));
      } catch (e) {}
      return who;
    },
    signOut() { try { [sessionStorage, localStorage].forEach((s) => { s.removeItem(TOKEN_KEY); s.removeItem("amp.ghUser"); }); } catch (e) {} },

    /** Current content.json on the branch: { sha, content } or null if it doesn't exist yet. */
    async getContent(ref) {
      const c = readCfg();
      try {
        const f = await api(`${repoPath(c)}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(ref || c.branch)}`);
        return { sha: f.sha, content: JSON.parse(b64ToText(f.content)) };
      } catch (e) { if (e.status === 404) return null; throw e; }
    },

    /** Commit content (and uploads) in one go. Throws code "conflict" if content.json changed since expectedSha. */
    async publish(draft, { message, expectedSha, force } = {}) {
      const c = readCfg(), rp = repoPath(c);
      const content = JSON.parse(JSON.stringify(draft));
      delete content.__source;
      content.meta = Object.assign({}, content.meta, { updatedAt: new Date().toISOString() });

      const ref = await api(`${rp}/git/ref/heads/${encodeURIComponent(c.branch)}`);
      const parent = await api(`${rp}/git/commits/${ref.object.sha}`);
      if (!force) {
        const now = await this.getContent(ref.object.sha);
        if (now && expectedSha && now.sha !== expectedSha) throw new GitHubError("Someone published a newer version since you started editing.", 409, "conflict");
      }

      const uploads = await extractUploads(content);
      const tree = [];
      for (const u of uploads) {
        const blob = await api(`${rp}/git/blobs`, { method: "POST", body: { content: u.base64, encoding: "base64" } });
        tree.push({ path: u.path, mode: "100644", type: "blob", sha: blob.sha });
      }
      const json = JSON.stringify(content, null, 2) + "\n";
      const cblob = await api(`${rp}/git/blobs`, { method: "POST", body: { content: textToB64(json), encoding: "base64" } });
      tree.push({ path: CONTENT_PATH, mode: "100644", type: "blob", sha: cblob.sha });

      const newTree = await api(`${rp}/git/trees`, { method: "POST", body: { base_tree: parent.tree.sha, tree } });
      const commit = await api(`${rp}/git/commits`, { method: "POST", body: { message: message || "Update portfolio content", tree: newTree.sha, parents: [ref.object.sha] } });
      await api(`${rp}/git/refs/heads/${encodeURIComponent(c.branch)}`, { method: "PATCH", body: { sha: commit.sha } });

      return { content, contentSha: cblob.sha, commitSha: commit.sha, commitUrl: commit.html_url || `https://github.com/${c.owner}/${c.repo}/commit/${commit.sha}`, uploads: uploads.length, uploaded: uploads.map((u) => ({ path: u.path, dataUrl: u.dataUrl })) };
    },

    /** Recent commits that touched content.json. */
    async history(n = 10) {
      const c = readCfg();
      const list = await api(`${repoPath(c)}/commits?path=${CONTENT_PATH}&sha=${encodeURIComponent(c.branch)}&per_page=${n}`);
      return list.map((x) => ({ sha: x.sha, message: x.commit.message, date: x.commit.author && x.commit.author.date, author: (x.author && x.author.login) || (x.commit.author && x.commit.author.name), url: x.html_url }));
    },

    /** GitHub Pages: site URL and latest build status (null if Pages isn't set up or not visible to the token). */
    async pages() {
      const rp = repoPath();
      let site = null, build = null;
      try { site = await api(`${rp}/pages`); } catch (e) { return null; }
      try { build = await api(`${rp}/pages/builds/latest`); } catch (e) {}
      return { url: site.html_url, status: build ? build.status : site.status, commit: build && build.commit, updated: build && build.updated_at };
    }
  };
})();
