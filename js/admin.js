/* Portfolio Studio — schema-driven admin console (prototype).
   Edits a draft copy of the content, saves it to this browser, streams it
   to the live preview, and publishes / exports it on demand. */
(function () {
  let D = Store.defaults();        // working draft (replaced at boot)
  let BASE = Store.defaults();     // last published content
  let baseSha = null;              // blob SHA of content.json on GitHub
  let pagesInfo = null, historyCache = null, lastPublish = null, busy = false;
  const isDirty = () => Store.differs(D, BASE);

  // Images uploaded in the last publish exist on GitHub before Pages has redeployed them.
  // Keep their data so the preview and thumbnails still show them meanwhile.
  const UC_KEY = "amp.uploadCache";
  let uploadCache = {};
  try { uploadCache = JSON.parse(localStorage.getItem(UC_KEY)) || {}; } catch (e) {}
  for (const [k, v] of Object.entries(uploadCache)) if (Date.now() - v.at > 6 * 3600e3) delete uploadCache[k];
  const res = (v) => (uploadCache[v] ? uploadCache[v].data : v);
  function saveUploadCache() { try { localStorage.setItem(UC_KEY, JSON.stringify(uploadCache)); } catch (e) { uploadCache = {}; } }
  function resolveDeep(o) { return JSON.parse(JSON.stringify(o), (k, v) => (typeof v === "string" && uploadCache[v] ? uploadCache[v].data : v)); }
  let current = (location.hash || "#dashboard").slice(1);
  let previewLens = "all";
  const open = new Set();

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const set = (o, path, v) => { const ks = path.split("."); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; };
  const ytId = (v) => { v = String(v || "").trim(); const m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : v; };

  const LIB = ["hero", "headshot", "exp-still", "exp-trending", "react-01", "react-02", "react-03", "comments-01", "comments-02", "comments-03", "comments-04",
    "bts-01", "bts-02", "bts-03", "bts-04", "bts-05", "bts-clip-01", "bts-clip-02", "bts-clip-03", "bts-clip-04", "bts-clip-05", "bts-clip-06", "bts-clip-07",
    "event-01", "event-02", "event-03", "event-04", "event-05", "event-06", "event-07", "event-08"].map((n) => `assets/img/${n}.webp`);

  const SECTION_NAMES = { featured: "Featured film", about: "About & casting sheet", direction: "Direction work", gallery: "Acting gallery", bts: "Behind the scenes", anchoring: "Anchoring", voices: "Testimonials", credits: "Credits", contact: "Contact" };
  const LENS_OPTS = [["actor", "Actor"], ["director", "Director"], ["anchor", "Anchor"]];

  /* ---------------- Schemas ---------------- */
  const F = (k, label, type = "text", extra = {}) => Object.assign({ k, label, type }, extra);
  const SCHEMA = {
    profile: { title: "Profile & hero", lede: "Your name, intro and the first thing visitors see.", focus: "top", panels: [
      { title: "Identity", fields: [F("profile.firstName", "First name"), F("profile.lastName", "Last name"), F("profile.monogram", "Monogram"), F("profile.roles", "Roles", "tags", { hint: "Comma separated", wide: true })] },
      { title: "Hero", fields: [F("profile.heroLine", "Hero line", "text", { wide: true }), F("profile.heroImage", "Hero background", "image", { wide: true }),
        F("profile.showreel.youtube", "Showreel video", "youtube"), F("profile.showreel.label", "Button label"),
        F("profile.showreel.isDedicatedReel", "This is a dedicated showreel (not a film teaser)", "checkbox", { wide: true })] },
      { title: "Bio", fields: [F("profile.headshot", "Headshot", "image", { wide: true }), F("profile.bioLead", "Opening line", "textarea", { wide: true }),
        F("profile.bio", "Paragraphs", "strings", { wide: true, area: true }), F("profile.quote", "Signature quote", "textarea", { wide: true }),
        F("profile.birthYear", "Birth year", "number", { hint: "Age is calculated automatically" }), F("profile.playingRange", "Playing age range")] }
    ]},
    statsheet: { title: "Casting sheet & skills", lede: "Measurements and skills shown to casting directors — also printed on the comp card.", focus: "stat-sheet", lens: "actor", panels: [
      { title: "Casting sheet", fields: [F("statSheet", "", "list", { titleKey: "label", subKey: "value", make: () => ({ label: "New field", value: "", note: "" }),
        fields: [F("label", "Label"), F("value", "Value"), F("note", "Note")] })] },
      { title: "Skills", fields: [F("skills", "", "list", { titleKey: "group", make: () => ({ group: "New group", items: [] }),
        fields: [F("group", "Group name"), F("items", "Skills", "tags", { wide: true, hint: "Comma separated" })] })] }
    ]},
    featured: { title: "Featured film", lede: "The headline case study — currently Expectation.", focus: "featured", panels: [
      { title: "Story", fields: [F("featured.title", "Title"), F("featured.kicker", "Kicker"), F("featured.roles", "Your roles", "text", { wide: true }),
        F("featured.logline", "Logline", "textarea", { wide: true }), F("featured.still", "Poster / still", "image", { wide: true })] },
      { title: "Videos", fields: [F("featured.videos", "", "list", { titleKey: "label", make: () => ({ label: "New video", youtube: "" }), fields: [F("label", "Tab label"), F("youtube", "YouTube", "youtube")] })] },
      { title: "Numbers", fields: [F("featured.statsUrl", "Stats link", "text", { wide: true }), F("featured.stats", "", "list", { wide: true, titleKey: "value", subKey: "label", make: () => ({ value: "0", label: "Metric" }), fields: [F("value", "Value"), F("label", "Label")] })] },
      { title: "Recognition", fields: [F("featured.badges", "Badges", "strings", { wide: true }), F("featured.proofImage", "Proof screenshot", "image", { wide: true }), F("featured.reactionImages", "Reaction screenshots", "images", { wide: true })] }
    ]},
    projects: { title: "Projects", lede: "Direction and production work. Paste a YouTube link and the thumbnail fills itself in.", focus: "direction", lens: "director", panels: [
      { title: "All projects", fields: [F("projects", "", "list", { titleKey: "title", subKey: "year", thumbKey: "image", ytKey: "youtube", flag: (p) => p.visible === false ? ["Hidden", true] : p.status === "coming-soon" ? ["Coming soon"] : null,
        make: () => ({ id: "p-" + Date.now(), title: "New project", type: "Short film", year: String(new Date().getFullYear()), role: "Director", lens: ["director"], youtube: "", image: "", status: "released", visible: true, description: "" }),
        fields: [F("title", "Title"), F("type", "Type", "select", { opts: ["Short film", "Feature film", "Pilot film", "Web series", "Commercial", "Music video", "Theatre", "Documentary"] }), F("year", "Year"), F("role", "Your role"),
          F("status", "Status", "select", { opts: [["released", "Released"], ["coming-soon", "Coming soon"], ["unreleased", "Unreleased"]] }), F("visible", "Show on site", "checkbox"),
          F("youtube", "YouTube", "youtube", { wide: true }), F("image", "Cover image (optional)", "image", { wide: true }), F("lens", "Show for", "multi", { opts: LENS_OPTS, wide: true }),
          F("description", "Description", "textarea", { wide: true })] })] }
    ]},
    gallery: { title: "Acting gallery", lede: "Empty slots are hidden from visitors but shown in this preview so you know what to shoot next.", focus: "gallery", lens: "actor", panels: [
      { title: "Photos", fields: [F("gallery", "", "list", { titleKey: "caption", subKey: "category", thumbKey: "src", flag: (g) => g.src ? null : ["Open slot"],
        make: () => ({ id: "g" + Date.now(), src: "", caption: "New photo", category: "Photoshoot" }),
        fields: [F("src", "Image", "image", { wide: true }), F("caption", "Caption"), F("category", "Category", "select", { opts: ["Film still", "Photoshoot", "Behind the scenes", "Theatre"] })] })] }
    ]},
    bts: { title: "Behind the scenes", lede: "Set photos and short looping clips.", focus: "bts", lens: "director", panels: [
      { title: "Intro", fields: [F("bts.title", "Title", "text", { wide: true }), F("bts.text", "Text", "textarea", { wide: true })] },
      { title: "Photos (first one is shown large)", fields: [F("bts.photos", "", "list", { titleKey: "caption", thumbKey: "src", make: () => ({ src: "", caption: "New photo" }), fields: [F("src", "Image", "image", { wide: true }), F("caption", "Caption", "text", { wide: true })] })] },
      { title: "Clips", fields: [F("bts.clips", "", "list", { titleKey: "caption", thumbKey: "poster", make: () => ({ src: "", poster: "", caption: "New clip" }), fields: [F("src", "Video file path", "text", { wide: true, hint: "e.g. assets/video/bts-01.mp4 — keep clips short (2–6s, under 1MB)" }), F("poster", "Poster frame", "image", { wide: true }), F("caption", "Caption", "text", { wide: true })] })] }
    ]},
    anchoring: { title: "Anchoring & hosting", lede: "Event work for organisers looking for a host.", focus: "anchoring", lens: "anchor", panels: [
      { title: "Intro", fields: [F("anchoring.intro", "Intro", "textarea", { wide: true })] },
      { title: "Numbers", fields: [F("anchoring.stats", "", "list", { titleKey: "value", subKey: "label", make: () => ({ value: "0", label: "Metric" }), fields: [F("value", "Value"), F("label", "Label")] })] },
      { title: "Event photos", fields: [F("anchoring.events", "", "list", { titleKey: "title", subKey: "category", thumbKey: "src", make: () => ({ src: "", title: "New event", category: "Corporate" }),
        fields: [F("src", "Image", "image", { wide: true }), F("title", "Title"), F("category", "Category", "select", { opts: ["Corporate", "College fest", "Cultural", "Wedding", "Award show"] })] })] }
    ]},
    testimonials: { title: "Testimonials", lede: "Named, specific quotes carry far more weight than anonymous ones.", focus: "voices", panels: [
      { title: "Quotes", fields: [F("testimonials", "", "list", { titleKey: "author", subKey: "source", flag: (t) => /^(viewer|event organizer)$/i.test(t.author) ? ["Anonymous"] : null,
        make: () => ({ quote: "", author: "", source: "Instagram", lens: "director" }),
        fields: [F("quote", "Quote", "textarea", { wide: true }), F("author", "Name"), F("source", "Source"), F("lens", "Shown for", "select", { opts: LENS_OPTS })] })] }
    ]},
    timeline: { title: "Credits", lede: "The filmography table. Newest first.", focus: "credits", panels: [
      { title: "Credits", fields: [F("timeline", "", "list", { titleKey: "title", subKey: "year", make: () => ({ year: String(new Date().getFullYear()), category: "Film", title: "New credit", role: "", note: "" }),
        fields: [F("year", "Year"), F("category", "Type"), F("title", "Title"), F("role", "Role"), F("note", "Note", "text", { wide: true })] })] }
    ]},
    contact: { title: "Contact & availability", lede: "How people reach you, and whether you're taking work.", focus: "contact", panels: [
      { title: "Availability", fields: [F("availability.status", "Status", "select", { opts: [["available", "Available"], ["limited", "Limited availability"], ["booked", "Booked"]] }), F("availability.note", "Note", "text", { wide: true })] },
      { title: "Details", fields: [F("contact.email", "Email"), F("contact.phone", "Phone"), F("contact.whatsapp", "WhatsApp number", "text", { hint: "Digits with country code, e.g. 9194…" }), F("contact.instagram", "Instagram handle")] },
      { title: "Contact form delivery", fields: [F("contact.formEndpoint", "Web3Forms access key", "text", { wide: true, hint: "Free key from web3forms.com. Without one, the form opens the visitor's email app instead." })] }
    ]},
    theme: { title: "Theme & SEO", lede: "Look and feel, and how the site appears in search and link previews.", focus: "top", panels: [
      { title: "Look", fields: [F("site.accent", "Accent colour", "color"), F("site.defaultLens", "Default lens", "select", { opts: [["all", "Everything"], ...LENS_OPTS] }), F("site.grain", "Film grain overlay", "checkbox"), F("site.letterbox", "Letterbox bars on hero", "checkbox")] },
      { title: "Search & sharing", fields: [F("site.title", "Page title", "text", { wide: true }), F("site.description", "Description", "textarea", { wide: true, hint: "Aim for 140–160 characters" }), F("site.ogImage", "Share image", "image", { wide: true })] }
    ]}
  };

  const NAV = [
    ["Overview", [["dashboard", "◎", "Dashboard"], ["inbox", "✉", "Enquiries"]]],
    ["Content", [["profile", "☺", "Profile & hero"], ["statsheet", "▤", "Casting sheet"], ["featured", "★", "Featured film"], ["projects", "▶", "Projects"], ["gallery", "▦", "Acting gallery"], ["bts", "◐", "Behind the scenes"], ["anchoring", "◉", "Anchoring"], ["testimonials", "❝", "Testimonials"], ["timeline", "≡", "Credits"]]],
    ["Site", [["lenses", "◈", "Lenses & sections"], ["contact", "☎", "Contact"], ["theme", "◑", "Theme & SEO"], ["publish", "⇪", "Publish"]]]
  ];

  /* ---------------- Field rendering ---------------- */
  function field(f, base) {
    const path = base ? `${base}.${f.k}` : f.k;
    const v = get(D, path);
    const wide = f.wide ? " wide" : "";
    const lab = f.label ? `<span>${esc(f.label)}</span>` : "";
    const hint = f.hint ? `<small>${esc(f.hint)}</small>` : "";
    switch (f.type) {
      case "textarea": return `<label class="f${wide}">${lab}<textarea data-path="${path}">${esc(v)}</textarea>${hint}</label>`;
      case "number": return `<label class="f${wide}">${lab}<input type="number" data-path="${path}" data-type="number" value="${esc(v)}">${hint}</label>`;
      case "color": return `<label class="f${wide}">${lab}<input type="color" data-path="${path}" value="${esc(v)}">${hint}</label>`;
      case "checkbox": return `<label class="check f${wide}" style="display:flex"><input type="checkbox" data-path="${path}" data-type="bool" ${v !== false && v ? "checked" : ""}>${esc(f.label)}</label>`;
      case "select": return `<label class="f${wide}">${lab}<select data-path="${path}">${f.opts.map((o) => { const [val, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${esc(l)}</option>`; }).join("")}</select>${hint}</label>`;
      case "tags": return `<label class="f${wide}">${lab}<input type="text" data-path="${path}" data-type="tags" value="${esc((v || []).join(", "))}">${hint}</label>`;
      case "multi": return `<div class="f${wide}">${lab}<div class="checks">${f.opts.map(([val, l]) => `<label class="check"><input type="checkbox" data-multi="${path}" value="${val}" ${(v || []).includes(val) ? "checked" : ""}>${l}</label>`).join("")}</div></div>`;
      case "youtube": return `<label class="f${wide}">${lab}<div class="yt"><input type="text" data-path="${path}" data-type="yt" value="${esc(v)}" placeholder="Paste a YouTube link or ID">${v ? `<img src="https://i.ytimg.com/vi/${esc(v)}/default.jpg" alt="">` : ""}</div>${hint}</label>`;
      case "image": return `<div class="f${wide}">${lab}${imageCtl(path, v)}${hint}</div>`;
      case "images": return `<div class="f${wide}">${lab}<div class="list">${(v || []).map((src, i) => `<div style="display:grid;grid-template-columns:1fr auto auto auto;gap:6px;align-items:center">${imageCtl(`${path}.${i}`, src)}${moveBtns(path, i)}</div>`).join("")}<button type="button" class="add" data-act="add" data-path="${path}" data-make="string">+ Add image</button></div></div>`;
      case "strings": return `<div class="f${wide}">${lab}<div class="strs">${(v || []).map((s, i) => `<div class="s">${f.area ? `<textarea data-path="${path}.${i}">${esc(s)}</textarea>` : `<input type="text" data-path="${path}.${i}" value="${esc(s)}">`}${moveBtns(path, i)}</div>`).join("")}<button type="button" class="add" data-act="add" data-path="${path}" data-make="string">+ Add</button></div></div>`;
      case "list": return `<div class="f${wide}" style="grid-column:1/-1">${lab}${list(f, path)}</div>`;
      default: return `<label class="f${wide}">${lab}<input type="text" data-path="${path}" value="${esc(v)}">${hint}</label>`;
    }
  }
  function imageCtl(path, v) {
    const isData = String(v || "").startsWith("data:");
    return `<div class="img-field"><div class="thumb ${v ? "has" : ""}" style="${v ? `background-image:url('${esc(res(v))}')` : ""}">${v ? "" : "empty"}</div>
      <div class="ctrl">
        <input type="text" data-path="${path}" data-type="img" value="${isData ? "" : esc(v)}" placeholder="${isData ? "Uploaded image (stored in browser)" : "Image path or URL"}">
        <div class="btns">
          <button type="button" class="mini" data-act="upload" data-path="${path}">Upload…</button>
          <select class="mini" data-lib="${path}" aria-label="Choose from library" style="width:auto"><option value="">Library…</option>${LIB.map((l) => `<option value="${l}">${l.split("/").pop()}</option>`).join("")}</select>
          ${v ? `<button type="button" class="mini" data-act="clear" data-path="${path}">Remove</button>` : ""}
        </div>
      </div></div>`;
  }
  function moveBtns(path, i) {
    return `<button type="button" class="mini" data-act="up" data-path="${path}" data-i="${i}" aria-label="Move up">↑</button><button type="button" class="mini" data-act="down" data-path="${path}" data-i="${i}" aria-label="Move down">↓</button><button type="button" class="mini danger" data-act="del" data-path="${path}" data-i="${i}" aria-label="Delete">✕</button>`;
  }
  const MAKERS = {};
  function list(f, path) {
    MAKERS[path] = f.make;
    const arr = get(D, path) || [];
    return `<div class="list">${arr.map((it, i) => {
      const p = `${path}.${i}`;
      const isOpen = open.has(p);
      const thumb = f.thumbKey ? res(it[f.thumbKey] || "") : f.ytKey && it[f.ytKey] ? `https://i.ytimg.com/vi/${it[f.ytKey]}/default.jpg` : "";
      const th = f.thumbKey || f.ytKey ? `<span class="hthumb ${thumb || (f.ytKey && it[f.ytKey]) ? "has" : ""}" style="${thumb ? `background-image:url('${esc(thumb)}')` : f.ytKey && it[f.ytKey] ? `background-image:url('https://i.ytimg.com/vi/${esc(it[f.ytKey])}/default.jpg')` : ""}"></span>` : "";
      const fl = f.flag && f.flag(it);
      return `<div class="item ${isOpen ? "open" : ""}" data-item="${p}">
        <div class="item-head" data-act="toggle" data-path="${p}">
          <span class="caret">›</span>${th}
          <span class="t"><span data-title-for="${p}.${f.titleKey}">${esc(it[f.titleKey] || "Untitled")}</span>${f.subKey ? `<small data-title-for="${p}.${f.subKey}">${esc(it[f.subKey])}</small>` : ""}</span>
          ${fl ? `<span class="flag ${fl[1] ? "off" : ""}">${esc(fl[0])}</span>` : ""}
          ${moveBtns(path, i)}
        </div>
        <div class="item-body">${isOpen ? `<div class="fields">${f.fields.map((ff) => field(ff, p)).join("")}</div>` : ""}</div>
      </div>`;
    }).join("")}<button type="button" class="add" data-act="add" data-path="${path}">+ Add</button></div>`;
  }

  /* ---------------- Modules ---------------- */
  function renderModule() {
    const ed = $("#editor");
    const s = SCHEMA[current];
    const navItem = NAV.flatMap((g) => g[1]).find((n) => n[0] === current);
    $("#title").textContent = navItem ? navItem[2] : "";
    if (s) {
      ed.innerHTML = `<h1>${esc(s.title)}</h1><p class="lede">${esc(s.lede)}</p>` + s.panels.map((p) => `<div class="panel"><h2>${esc(p.title)}</h2><div class="fields">${p.fields.map((f) => field(f, "")).join("")}</div></div>`).join("");
    } else ed.innerHTML = (CUSTOM[current] || CUSTOM.dashboard)();
    ed.scrollTop = 0;
    if (current === "publish") loadPublishExtras();
  }

  function checks() {
    const c = D, out = [];
    const add = (ok, title, detail, mod, critical) => out.push({ ok, title, detail, mod, critical });
    const empty = c.gallery.filter((g) => !g.src).length;
    add(empty === 0, empty ? `Fill ${empty} open acting-gallery slot${empty > 1 ? "s" : ""}` : "Acting gallery is complete", "Casting directors judge on photos first. Old site used stock images here.", "gallery", empty > 0);
    add(!!c.profile.showreel.isDedicatedReel, c.profile.showreel.isDedicatedReel ? "Dedicated showreel" : "Cut a dedicated 60–90s showreel", "The hero button currently plays the Expectation teaser.", "profile", true);
    add(!!c.contact.formEndpoint, c.contact.formEndpoint ? "Contact form delivers to inbox" : "Connect the contact form", "Without a key, visitors have to send the message from their own email app, and many won't.", "contact", true);
    c.projects.filter((p) => p.visible !== false && !p.youtube).forEach((p) => add(false, `Add a video for “${p.title}”`, "Projects without a watchable link convert poorly.", "projects"));
    c.projects.filter((p) => p.visible !== false && !p.year).forEach((p) => add(false, `Add the year for “${p.title}”`, "", "projects"));
    if (c.projects.some((p) => /youtube web series/i.test(p.title))) add(false, "Give the web series its real name", "“YouTube Web Series” reads as a placeholder.", "projects");
    const anon = c.testimonials.filter((t) => /^(viewer|event organizer)$/i.test(t.author)).length;
    add(anon === 0, anon ? `Attribute ${anon} anonymous testimonial${anon > 1 ? "s" : ""}` : "All testimonials are attributed", "Names (and organisations for events) add credibility.", "testimonials");
    const evCats = new Set(c.anchoring.events.map((e) => e.category));
    add(evCats.size >= 3, evCats.size >= 3 ? "Event photos cover several event types" : "Add corporate / college event photos", "Most event photos are from cultural nights.", "anchoring");
    add(!!c.profile.headshot, "Headshot uploaded", "", "profile");
    add(!!c.site.ogImage, "Share image set for link previews", "", "theme");
    add((c.site.description || "").length >= 100, "Search description written", "", "theme");
    add(!!c.profile.birthYear, "Age auto-calculated from birth year", "", "profile");
    return out;
  }

  const CUSTOM = {
    dashboard() {
      const ch = checks(), done = ch.filter((x) => x.ok).length, pct = Math.round((done / ch.length) * 100);
      const unread = Store.enquiries().filter((e) => !e.read).length;
      const photos = D.gallery.filter((g) => g.src).length + D.anchoring.events.length + D.bts.photos.length;
      const r = 58, circ = 2 * Math.PI * r;
      const todo = [...ch].sort((a, b) => a.ok - b.ok || (b.critical ? 1 : 0) - (a.critical ? 1 : 0));
      return `<h1>Welcome back, ${esc(D.profile.firstName)}</h1><p class="lede">Here's how complete your portfolio is, and what will make the biggest difference next.</p>
      <div class="panel dash-top">
        <div class="ring"><svg width="140" height="140" viewBox="0 0 140 140"><circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(241,235,224,.08)" stroke-width="10"/><circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - pct / 100)}"/></svg><b>${pct}%<small>complete</small></b></div>
        <div class="kpis">
          <div class="kpi"><b>${D.projects.filter((p) => p.visible !== false).length}</b><span>Projects live</span></div>
          <div class="kpi"><b>${photos}</b><span>Photos on site</span></div>
          <div class="kpi"><b>${D.testimonials.length}</b><span>Testimonials</span></div>
          <div class="kpi"><b>${unread}</b><span>Unread enquiries</span></div>
          <div class="kpi"><b>${D.availability.status === "available" ? "Open" : D.availability.status === "limited" ? "Limited" : "Booked"}</b><span>Availability</span></div>
          <div class="kpi"><b>${isDirty() ? "Draft" : "Live"}</b><span>Publish state</span></div>
        </div>
      </div>
      <div class="panel"><h2>Next best actions <span class="muted" style="letter-spacing:0;text-transform:none;font-family:var(--body)">${done}/${ch.length} done</span></h2><div class="todo">
        ${todo.map((x) => `<div class="todo-row ${x.ok ? "ok" : "no"}"><span class="mk">${x.ok ? "✓" : "!"}</span><div class="tt">${esc(x.title)}${!x.ok && x.critical ? `<span class="sev">High impact</span>` : ""}${!x.ok && x.detail ? `<small>${esc(x.detail)}</small>` : ""}</div>${x.ok ? "" : `<button type="button" class="mini" data-go="${x.mod}">Fix →</button>`}</div>`).join("")}
      </div></div>
      <div class="panel"><h2>Share a lens-specific link</h2><div class="fields">
        ${Object.entries(D.lenses).map(([k, l]) => `<label class="f"><span>${esc(l.label)}</span><input type="text" readonly value="${esc(new URL("index.html" + (k === "all" ? "" : "?lens=" + k), location.href).href)}" onclick="this.select()"></label>`).join("")}
      </div><p class="muted" style="margin:10px 0 0">Send the Acting link to casting directors, Direction to producers, Event host to event organisers — each opens the site arranged for them.</p></div>`;
    },
    inbox() {
      const list = Store.enquiries();
      return `<h1>Enquiries</h1><p class="lede">Test messages sent from the preview land here. Real visitors' messages go to your email: through Web3Forms once you add a key in Contact, or through their own email app until then.</p>
      ${list.length ? `<div style="display:flex;gap:8px;margin-bottom:14px"><button class="ghost" type="button" data-act="csv">Export CSV</button><button class="ghost" type="button" data-act="readall">Mark all read</button></div>
        <div class="list">${list.map((e) => `<article class="msg ${e.read ? "" : "unread"}"><header><b>${esc(e.name)} <span class="muted" style="font-weight:400">· ${esc(e.email)}</span></b><span class="flag">${esc(e.kind)}</span></header>
          <span class="muted" style="font-size:12px">${new Date(e.at).toLocaleString()}${e.org ? " · " + esc(e.org) : ""}${e.dates ? " · Dates: " + esc(e.dates) : ""} · via ${esc(e.lens)} lens</span>
          <p>${esc(e.message)}</p>
          <div style="display:flex;gap:6px;margin-top:4px"><a class="mini" style="text-decoration:none" href="mailto:${esc(e.email)}?subject=${encodeURIComponent("Re: " + e.kind)}">Reply</a>${e.read ? "" : `<button class="mini" type="button" data-act="read" data-id="${e.id}">Mark read</button>`}<button class="mini danger" type="button" data-act="delmsg" data-id="${e.id}">Delete</button></div></article>`).join("")}</div>`
        : `<div class="empty-state">No enquiries yet.<br>Try sending one from the contact form in the preview →</div>`}`;
    },
    lenses() {
      return `<h1>Lenses & sections</h1><p class="lede">Each lens re-orders the site for a different visitor. Choose which sections appear and in what order.</p>
      ${Object.entries(D.lenses).map(([k, l]) => {
        const all = Object.keys(SECTION_NAMES); const on = l.sections; const off = all.filter((s) => !on.includes(s));
        return `<div class="panel"><h2>${esc(l.label)} <button class="mini" type="button" data-preview-lens="${k}">Preview this lens</button></h2>
          <div class="fields" style="margin-bottom:14px">${field(F(`lenses.${k}.label`, "Button label"), "")}${field(F(`lenses.${k}.cta`, "Call to action"), "")}${field(F(`lenses.${k}.enquiry`, "Enquiry type"), "")}</div>
          <div class="secs">
            ${on.map((s, i) => `<div class="sec"><label class="check"><input type="checkbox" data-sec="${k}" value="${s}" checked></label><span>${i + 1}. ${SECTION_NAMES[s] || s}</span><button class="mini" type="button" data-act="up" data-path="lenses.${k}.sections" data-i="${i}" aria-label="Move up">↑</button><button class="mini" type="button" data-act="down" data-path="lenses.${k}.sections" data-i="${i}" aria-label="Move down">↓</button></div>`).join("")}
            ${off.map((s) => `<div class="sec off"><label class="check"><input type="checkbox" data-sec="${k}" value="${s}"></label><span>${SECTION_NAMES[s]}</span><span></span><span></span></div>`).join("")}
          </div></div>`;
      }).join("")}`;
    },
    publish() {
      const signed = GitHub.isSignedIn(), cfg = GitHub.config() || {}, who = GitHub.session();
      const changedKeys = Object.keys(D).filter((k) => k !== "meta" && k !== "__source" && JSON.stringify(D[k]) !== JSON.stringify(BASE[k]));
      const uploads = JSON.stringify(D).match(/"data:image\//g);
      const kb = Math.round(JSON.stringify(D).length / 1024);
      const lp = lastPublish;
      return `<h1>Publish</h1><p class="lede">Publishing commits your draft to GitHub as one change. GitHub Pages then updates the live site, usually within a minute.</p>
      <div class="panel"><h2>Destination</h2>
        ${signed ? `<div class="acct"><img src="${esc(who && who.avatar)}" alt=""><div><b>${esc(cfg.owner)}/${esc(cfg.repo)}</b> <span class="muted">· branch ${esc(cfg.branch)}</span><small class="muted">Signed in as ${esc(who && who.login)}</small></div><button class="mini" type="button" data-act="signout">Sign out</button></div>`
          : `<div class="acct"><div><b>Not connected</b><small class="muted">You're in local mode: edits are saved in this browser, but can't go live yet.</small></div><button class="primary" type="button" data-act="signin">Connect GitHub</button></div>`}
      </div>
      <div class="panel"><h2>Changes in your draft</h2>
        ${changedKeys.length ? `<div class="diff">${changedKeys.map((k) => `<div><span>${esc(k)}</span><span class="flag">changed</span></div>`).join("")}</div>${uploads ? `<p class="muted" style="margin:10px 0 0">${uploads.length} new image${uploads.length > 1 ? "s" : ""} will be added to <code>assets/uploads/</code>.</p>` : ""}`
          : `<p class="muted" style="margin:0">Nothing to publish. Your draft matches the live content.</p>`}
        ${changedKeys.length ? `<label class="f" style="margin-top:14px"><span>Change note (shown in history)</span><input type="text" id="commitMsg" placeholder="${esc(autoMessage(changedKeys))}"></label>` : ""}
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <button class="primary" type="button" data-act="publish" ${changedKeys.length && !busy ? "" : "disabled"}>${busy ? "Publishing…" : signed ? `Publish ${changedKeys.length} change${changedKeys.length === 1 ? "" : "s"}` : "Connect GitHub to publish"}</button>
          ${changedKeys.length ? `<button class="ghost" type="button" data-act="discard">Discard draft</button>` : ""}
        </div>
        ${lp ? `<div class="callout" style="margin-top:14px"><b>Published.</b> <a href="${esc(lp.commitUrl)}" target="_blank" rel="noopener">View the commit ↗</a>${lp.uploads ? ` · ${lp.uploads} image${lp.uploads > 1 ? "s" : ""} uploaded` : ""}<br><span id="deploy">${lp.deploy || "Waiting for GitHub Pages to redeploy…"}</span></div>` : ""}
      </div>
      ${signed ? `<div class="panel"><h2>Live site</h2><div id="ghPages" class="muted">Checking GitHub Pages…</div></div>
      <div class="panel"><h2>Version history</h2><div id="ghHistory" class="muted">Loading…</div></div>` : ""}
      <div class="panel"><h2>Backup & move</h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="ghost" type="button" data-act="export">Export content.json (${kb} KB)</button><button class="ghost" type="button" data-act="import">Import JSON…</button><button class="ghost danger" type="button" data-act="reset">Start draft from original repo content</button></div>
      </div>`;
    }
  };

  function autoMessage(keys) {
    keys = keys || Object.keys(D).filter((k) => k !== "meta" && JSON.stringify(D[k]) !== JSON.stringify(BASE[k]));
    return `Update ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ` +${keys.length - 3} more` : ""}`;
  }

  async function loadPublishExtras() {
    if (!GitHub.isSignedIn()) return;
    try {
      pagesInfo = await GitHub.pages();
      const el = $("#ghPages");
      if (el) el.innerHTML = pagesInfo
        ? `<a href="${esc(pagesInfo.url)}" target="_blank" rel="noopener">${esc(pagesInfo.url)} ↗</a> · last deploy: <b>${esc(pagesInfo.status || "unknown")}</b>${pagesInfo.updated ? ` (${new Date(pagesInfo.updated).toLocaleString()})` : ""}`
        : `GitHub Pages isn't switched on for this repository (or the token can't see it). Turn it on in the repo's Settings → Pages, using the <b>main</b> branch and the root folder.`;
      setLiveLink();
    } catch (e) { const el = $("#ghPages"); if (el) el.textContent = e.message; }
    try {
      historyCache = historyCache || (await GitHub.history(10));
      const el = $("#ghHistory");
      if (el) el.innerHTML = historyCache.length ? `<div class="list">${historyCache.map((h, i) => `<div class="hist"><div><b>${esc(h.message.split("\n")[0])}</b><small class="muted">${h.date ? new Date(h.date).toLocaleString() : ""} · ${esc(h.author || "")} · <a href="${esc(h.url)}" target="_blank" rel="noopener">${h.sha.slice(0, 7)}</a></small></div>${i === 0 ? `<span class="flag">Live</span>` : `<button class="mini" type="button" data-act="restore" data-sha="${h.sha}">Load into draft</button>`}</div>`).join("")}</div>`
        : `No versions yet. Your first publish will create <code>content.json</code> in the repo.`;
    } catch (e) { const el = $("#ghHistory"); if (el) el.textContent = e.message; }
  }

  /* ---------------- Change handling ---------------- */
  let saveT;
  function changed(opts = {}) {
    lastPublish = null;
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      if (baseSha && !Store.draftBase()) Store.setDraftBase(baseSha);
      if (!Store.saveDraft(D)) toast("Browser storage is full — use smaller images or export your content", true);
      updateState(); updateStorage();
    }, 250);
    sendPreview(opts.focus);
    if (opts.rerender) renderModule();
    renderNav();
  }

  function updateState() {
    const dirty = isDirty(), cfg = GitHub.config();
    const st = $("#state");
    st.className = "state" + (dirty ? " dirty" : "") + (GitHub.isSignedIn() ? "" : " local");
    st.textContent = dirty ? "Draft saved · not published" : GitHub.isSignedIn() ? `Up to date with ${cfg.owner}/${cfg.repo}` : "Local mode · not connected";
    $("#publish").disabled = !dirty || busy;
    $("#publish").textContent = busy ? "Publishing…" : "Publish";
    $("#discard").disabled = !dirty;
    renderAccount();
  }
  function updateStorage() { $("#storage").textContent = `Browser storage: ${(Store.bytesUsed() / 1048576).toFixed(2)} MB of ~5 MB`; }

  const frame = $("#frame");
  let lastFocus;
  function sendPreview(focus) {
    if (focus !== undefined) lastFocus = focus;
    try { frame.contentWindow.postMessage({ type: "amp:content", content: Object.keys(uploadCache).length ? resolveDeep(D) : D, lens: previewLens, focus }, location.origin === "null" ? "*" : location.origin); } catch (e) {}
  }
  frame.addEventListener("load", () => sendPreview(lastFocus));

  function moveArr(path, i, d) { const a = get(D, path); const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; open.clear(); }

  const ed = $("#editor");
  ed.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.path) {
      let v = el.value;
      const t = el.dataset.type;
      if (t === "number") v = v === "" ? "" : Number(v);
      if (t === "bool") v = el.checked;
      if (t === "tags") v = v.split(",").map((s) => s.trim()).filter(Boolean);
      if (t === "yt") v = ytId(v);
      set(D, el.dataset.path, v);
      $$(`[data-title-for="${CSS.escape(el.dataset.path)}"]`).forEach((n) => (n.textContent = v || "Untitled"));
      changed();
    }
  });
  ed.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset.type === "yt" || el.dataset.type === "img" || el.tagName === "SELECT" && el.dataset.path || el.dataset.type === "bool") { renderModule(); }
    if (el.dataset.lib) { if (el.value) { set(D, el.dataset.lib, el.value); changed({ rerender: true }); } }
    if (el.dataset.multi) {
      const arr = get(D, el.dataset.multi) || [];
      const next = el.checked ? [...new Set([...arr, el.value])] : arr.filter((x) => x !== el.value);
      set(D, el.dataset.multi, next); changed();
    }
    if (el.dataset.sec) {
      const L = D.lenses[el.dataset.sec];
      L.sections = el.checked ? [...L.sections, el.value] : L.sections.filter((s) => s !== el.value);
      previewLens = el.dataset.sec; $("#lensPick").value = previewLens;
      changed({ rerender: true });
    }
  });

  let uploadPath = null;
  ed.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]"); if (go) return navigate(go.dataset.go);
    const pl = e.target.closest("[data-preview-lens]"); if (pl) { previewLens = pl.dataset.previewLens; $("#lensPick").value = previewLens; return sendPreview(); }
    const b = e.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act, path = b.dataset.path, i = Number(b.dataset.i);
    if (act !== "toggle") e.stopPropagation();
    switch (act) {
      case "toggle": if (e.target.closest("button, select")) return; open.has(path) ? open.delete(path) : open.add(path); renderModule(); restoreScroll(b); return;
      case "add": {
        const arr = get(D, path); const mk = MAKERS[path];
        arr.push(b.dataset.make === "string" || !mk ? "" : mk()); open.add(`${path}.${arr.length - 1}`);
        return changed({ rerender: true, focus: SCHEMA[current] && SCHEMA[current].focus });
      }
      case "del": if (!confirm("Delete this item?")) return; get(D, path).splice(i, 1); open.clear(); return changed({ rerender: true });
      case "up": moveArr(path, i, -1); return changed({ rerender: true });
      case "down": moveArr(path, i, 1); return changed({ rerender: true });
      case "clear": set(D, path, ""); return changed({ rerender: true });
      case "upload": uploadPath = path; $("#filePick").value = ""; return $("#filePick").click();
      case "publish": return doPublish();
      case "export": return download("content.json", JSON.stringify(D, null, 2), "application/json");
      case "import": $("#jsonPick").value = ""; return $("#jsonPick").click();
      case "reset": if (!confirm("Replace your draft with the original content from the old repo? The live site doesn't change until you publish.")) return;
        D = Store.defaults(); open.clear(); changed({ rerender: true }); return toast("Draft reset to original content");
      case "discard": return discard();
      case "signin": return showSignIn();
      case "signout": return signOut();
      case "restore": return restore(b.dataset.sha);
      case "read": case "readall": case "delmsg": {
        let list = Store.enquiries();
        if (act === "read") list.forEach((m) => m.id === b.dataset.id && (m.read = true));
        if (act === "readall") list.forEach((m) => (m.read = true));
        if (act === "delmsg") { if (!confirm("Delete this enquiry?")) return; list = list.filter((m) => m.id !== b.dataset.id); }
        Store.setEnquiries(list); renderNav(); return renderModule();
      }
      case "csv": {
        const rows = [["Date", "Name", "Email", "Type", "Organisation", "Dates", "Message"], ...Store.enquiries().map((m) => [m.at, m.name, m.email, m.kind, m.org, m.dates, m.message])];
        return download("enquiries.csv", rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n"), "text/csv");
      }
    }
  });
  function restoreScroll(btn) { const p = btn.dataset.path; const el = $(`[data-item="${CSS.escape(p)}"]`); el && el.scrollIntoView({ block: "nearest" }); }

  $("#filePick").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file || !uploadPath) return;
    try {
      const url = await compress(file, 1600, 0.8);
      set(D, uploadPath, url);
      toast(`Image compressed to ${Math.round(url.length * 0.75 / 1024)} KB`);
      changed({ rerender: true });
    } catch (err) { toast("Couldn't read that image", true); }
  });
  async function compress(file, max, q) {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    let url = c.toDataURL("image/webp", q);
    if (!url.startsWith("data:image/webp")) url = c.toDataURL("image/jpeg", q);
    return url;
  }
  $("#jsonPick").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const obj = JSON.parse(await f.text()); if (!obj.profile || !obj.projects) throw 0; D = Object.assign(Store.defaults(), obj); open.clear(); changed({ rerender: true }); toast("Imported into draft — publish to make it live"); }
    catch (err) { toast("That file isn't a portfolio content export", true); }
  });

  function download(name, text, type) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function doPublish(force) {
    if (!GitHub.isSignedIn()) return showSignIn();
    if (!isDirty() || busy) return;
    const msg = ($("#commitMsg") && $("#commitMsg").value.trim()) || autoMessage();
    busy = true; updateState(); if (current === "publish") renderModule();
    try {
      const r = await GitHub.publish(D, { message: msg, expectedSha: Store.draftBase() || baseSha, force });
      (r.uploaded || []).forEach((u) => (uploadCache[u.path] = { data: u.dataUrl, at: Date.now() }));
      saveUploadCache();
      D = Store.withDefaults(r.content); BASE = Store.clone(D); baseSha = r.contentSha;
      Store.discardDraft(); Store.setDraftBase(baseSha); Store.setPublished(BASE);
      lastPublish = Object.assign({ at: Date.now() }, r); historyCache = null;
      toast("Published to GitHub — the live site updates in about a minute");
      watchDeploy(r.commitSha);
    } catch (e) {
      busy = false;
      if (e.code === "conflict") {
        if (confirm("Someone published a newer version since you started editing.\n\nOK = overwrite it with your draft\nCancel = keep it and review first (see Version history)")) return doPublish(true);
      } else toast(e.message, true);
    }
    busy = false;
    open.clear(); updateState(); renderNav(); sendPreview();
    if (current === "publish" || current === "dashboard") renderModule();
  }

  let deployT;
  function watchDeploy(sha) {
    clearInterval(deployT);
    const t0 = Date.now();
    const say = (html) => { if (lastPublish) lastPublish.deploy = html; const el = $("#deploy"); if (el) el.innerHTML = html; };
    deployT = setInterval(async () => {
      let p = null;
      try { p = await GitHub.pages(); } catch (e) {}
      if (!p) { say("Couldn't read the deploy status — check the repo's Actions tab."); return clearInterval(deployT); }
      const mine = p.commit === sha;
      if (mine && p.status === "built") { clearInterval(deployT); say(`Live site updated · <a href="${esc(p.url)}" target="_blank" rel="noopener">open it ↗</a>`); toast("Live site updated"); return; }
      if (mine && p.status === "errored") { clearInterval(deployT); say("GitHub Pages reported a build error — check the repo's Actions tab."); return; }
      say(`GitHub Pages is deploying… (${Math.round((Date.now() - t0) / 1000)}s)`);
      if (Date.now() - t0 > 4 * 60e3) { clearInterval(deployT); say("Still deploying — check the repo's Actions tab for progress."); }
    }, 6000);
  }

  function discard() {
    if (!confirm("Discard all unpublished changes?")) return;
    Store.discardDraft(); D = Store.clone(BASE); open.clear(); changed({ rerender: true }); toast("Draft discarded");
  }

  async function restore(sha) {
    if (isDirty() && !confirm("This replaces your current draft. Continue?")) return;
    try {
      const f = await GitHub.getContent(sha);
      if (!f) return toast("That version has no content.json", true);
      D = Store.withDefaults(f.content); open.clear(); changed({ rerender: true });
      toast("Older version loaded into your draft — publish to make it live again");
    } catch (e) { toast(e.message, true); }
  }

  /* ---------------- GitHub sign-in ---------------- */
  const dlg = $("#signin");
  function showSignIn() {
    const c = GitHub.config() || {};
    $("#ghRepo").value = c.owner ? `${c.owner}/${c.repo}` : "";
    $("#ghBranch").value = c.branch || "main";
    $("#ghToken").value = ""; $("#ghErr").textContent = "";
    dlg.showModal(); ($("#ghRepo").value ? $("#ghToken") : $("#ghRepo")).focus();
  }
  $("#ghForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const [owner, repo] = $("#ghRepo").value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").split("/");
    const btn = $("#ghGo"); btn.disabled = true; btn.textContent = "Checking…"; $("#ghErr").textContent = "";
    try {
      const who = await GitHub.signIn({ owner: owner || "", repo: repo || "", branch: $("#ghBranch").value, token: $("#ghToken").value, remember: $("#ghRemember").checked });
      $("#ghToken").value = "";
      dlg.close(); try { sessionStorage.removeItem("amp.localMode"); } catch (e2) {}
      toast(`Connected as ${who.login}`);
      await syncFromGitHub();
    } catch (err) { $("#ghErr").textContent = err.message; }
    btn.disabled = false; btn.textContent = "Connect";
  });
  $("#ghLocal").addEventListener("click", () => { try { sessionStorage.setItem("amp.localMode", "1"); } catch (e) {} dlg.close(); updateState(); });
  function signOut() {
    if (!confirm("Sign out of GitHub on this device? Your draft stays here.")) return;
    GitHub.signOut(); baseSha = null; pagesInfo = null; historyCache = null; lastPublish = null;
    updateState(); renderModule(); toast("Signed out");
  }
  function renderAccount() {
    const el = $("#account"); if (!el) return;
    const who = GitHub.session(), c = GitHub.config();
    el.innerHTML = GitHub.isSignedIn() && who
      ? `<span class="acct-mini"><img src="${esc(who.avatar)}" alt="">${esc(who.login)} → ${esc(c.repo)}</span>`
      : `<button class="mini" type="button" id="connectBtn">Connect GitHub</button>`;
    const cb = $("#connectBtn"); cb && cb.addEventListener("click", showSignIn);
  }
  function setLiveLink() { if (pagesInfo && pagesInfo.url) $("#liveLink").href = pagesInfo.url; }

  /** Pull the latest content.json straight from GitHub (fresher than the Pages cache). */
  async function syncFromGitHub() {
    try {
      const f = await GitHub.getContent();
      if (f) { BASE = Store.withDefaults(f.content); baseSha = f.sha; }
      else { baseSha = null; }
      if (!Store.hasLocalDraft()) D = Store.clone(BASE);
      else if (Store.draftBase() && f && Store.draftBase() !== f.sha) toast("The live content changed since you saved this draft — review before publishing", true);
      Store.setPublished(BASE);
    } catch (e) { toast(`Couldn't reach GitHub: ${e.message}`, true); }
    updateState(); renderNav(); renderModule(); sendPreview();
    GitHub.pages().then((p) => { pagesInfo = p; setLiveLink(); }).catch(() => {});
  }

  let tt;
  function toast(msg, bad) { const t = $("#toast"); t.textContent = msg; t.className = "toast on" + (bad ? " bad" : ""); clearTimeout(tt); tt = setTimeout(() => (t.className = "toast"), 2800); }

  /* ---------------- Navigation ---------------- */
  function renderNav() {
    const unread = Store.enquiries().filter((e) => !e.read).length;
    const empty = D.gallery.filter((g) => !g.src).length;
    const todo = checks().filter((c) => !c.ok).length;
    const counts = { inbox: unread ? [unread, true] : null, gallery: empty ? [empty] : null, dashboard: todo ? [todo] : null, projects: [D.projects.length], testimonials: [D.testimonials.length] };
    $("#nav").innerHTML = NAV.map(([g, items]) => `<div class="nav-group">${g}</div>` + items.map(([id, ic, label]) => {
      const c = counts[id];
      return `<button type="button" data-mod="${id}" ${id === current ? 'aria-current="page"' : ""}><span class="ic">${ic}</span>${label}${c ? `<span class="count ${c[1] ? "hot" : ""}">${c[0]}</span>` : ""}</button>`;
    }).join("")).join("");
  }
  function navigate(id) {
    current = id; history.replaceState(null, "", "#" + id); open.clear();
    renderNav(); renderModule();
    const s = SCHEMA[id];
    if (s) {
      const lensHas = (D.lenses[previewLens] || D.lenses.all).sections.includes(s.focus) || s.focus === "top" || s.focus === "stat-sheet";
      if (!lensHas) { previewLens = s.lens && D.lenses[s.lens].sections.includes(s.focus) ? s.lens : "all"; $("#lensPick").value = previewLens; }
      sendPreview(s.focus === "top" ? undefined : s.focus === "stat-sheet" ? "about" : s.focus);
    }
    $(".side").classList.remove("show");
  }
  $("#nav").addEventListener("click", (e) => { const b = e.target.closest("[data-mod]"); b && navigate(b.dataset.mod); });

  $("#publish").addEventListener("click", () => (GitHub.isSignedIn() ? navigateThenPublish() : showSignIn()));
  function navigateThenPublish() { if (current !== "publish") navigate("publish"); else doPublish(); }
  $("#discard").addEventListener("click", discard);
  $("#menu").addEventListener("click", () => $(".side").classList.toggle("show"));
  $("#togglePreview").addEventListener("click", () => $("#preview").classList.toggle("show"));
  // Desktop preview renders a real 1280px-wide page, scaled to fit the pane
  function fitStage() {
    const st = $("#stage");
    if (st.classList.contains("mobile")) { frame.style.height = ""; return; }
    const s = st.clientWidth / 1280;
    frame.style.transform = `scale(${s})`;
    frame.style.height = `${st.clientHeight / s}px`;
  }
  new ResizeObserver(fitStage).observe($("#stage"));
  $$("[data-device]").forEach((b) => b.addEventListener("click", () => {
    $$("[data-device]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("#stage").classList.toggle("mobile", b.dataset.device === "mobile");
    fitStage();
  }));
  $("#reload").addEventListener("click", () => frame.contentWindow.location.reload());
  const lp = $("#lensPick");
  lp.innerHTML = Object.entries(D.lenses).map(([k, l]) => `<option value="${k}">${esc(l.label)}</option>`).join("");
  lp.addEventListener("change", () => { previewLens = lp.value; sendPreview(); });
  addEventListener("storage", (e) => { if (e.key === Store.KEYS.enquiries) { renderNav(); if (current === "inbox" || current === "dashboard") renderModule(); } });
  // enquiries submitted inside the preview iframe share this origin's storage but don't fire "storage" here
  setInterval(() => { const n = Store.enquiries().length; if (n !== lastN) { lastN = n; renderNav(); if (current === "inbox") renderModule(); } }, 1500);
  let lastN = Store.enquiries().length;

  if (!SCHEMA[current] && !CUSTOM[current]) current = "dashboard";
  (async function boot() {
    $("#editor").innerHTML = `<p class="muted">Loading content…</p>`;
    BASE = await Store.loadPublished();
    D = Store.draft(BASE);
    navigate(current); updateState(); updateStorage();
    if (GitHub.isSignedIn()) await syncFromGitHub();
    else { let local = false; try { local = !!sessionStorage.getItem("amp.localMode"); } catch (e) {} if (!local) showSignIn(); }
  })();
})();
