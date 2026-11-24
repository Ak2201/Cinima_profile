/* Content store shared by the public site and the admin console.
   - Published content = content.json in the repo (served by GitHub Pages).
     data/content.js is only a fallback when content.json can't be fetched
     (e.g. opening index.html straight from disk).
   - The admin's working draft lives in this browser (localStorage) until
     it is published as a commit to GitHub. */
(function () {
  const KEYS = { draft: "amp.draft", draftBase: "amp.draftBase", enquiries: "amp.enquiries" };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function read(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn("Storage write failed", e); return false; }
  }
  function remove(key) { try { localStorage.removeItem(key); } catch (e) {} }

  // Fill in any keys missing from stored content (e.g. after a schema update)
  function withDefaults(c) {
    const d = clone(window.PORTFOLIO_DEFAULT);
    if (!c || typeof c !== "object") return d;
    for (const k of Object.keys(d)) if (c[k] === undefined) c[k] = d[k];
    return c;
  }

  let publishedCache = null;

  window.Store = {
    KEYS,
    clone,
    withDefaults,
    defaults: () => clone(window.PORTFOLIO_DEFAULT),

    /** Fetch the live content.json (bypassing caches). Falls back to bundled defaults. */
    async loadPublished() {
      try {
        const res = await fetch(`content.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(res.status);
        publishedCache = withDefaults(await res.json());
        publishedCache.__source = "content.json";
      } catch (e) {
        publishedCache = this.defaults();
        publishedCache.__source = "bundled";
      }
      return clone(publishedCache);
    },
    published: () => clone(publishedCache || withDefaults(null)),
    setPublished(c) { publishedCache = clone(c); },

    /** Draft = local working copy, or the published content if none. */
    draft(base) { return withDefaults(read(KEYS.draft) || clone(base || publishedCache || window.PORTFOLIO_DEFAULT)); },
    hasLocalDraft: () => !!read(KEYS.draft),
    saveDraft(c) { const s = clone(c); delete s.__source; return write(KEYS.draft, s); },
    discardDraft() { remove(KEYS.draft); remove(KEYS.draftBase); },
    /** SHA of content.json the draft was started from — used to detect someone else publishing meanwhile. */
    draftBase: () => read(KEYS.draftBase),
    setDraftBase: (sha) => write(KEYS.draftBase, sha),
    differs(a, b) { return JSON.stringify(strip(clone(a))) !== JSON.stringify(strip(clone(b))); },

    enquiries: () => read(KEYS.enquiries) || [],
    addEnquiry(e) { const list = this.enquiries(); list.unshift(e); write(KEYS.enquiries, list); },
    setEnquiries(list) { write(KEYS.enquiries, list); },
    bytesUsed() {
      let n = 0;
      try { for (const k of Object.values(KEYS)) n += (localStorage.getItem(k) || "").length * 2; } catch (e) {}
      return n;
    }
  };

  function strip(c) {
    delete c.__source;
    if (c.meta) delete c.meta.updatedAt;
    return c;
  }
})();
