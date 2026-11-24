/* Public site renderer — everything is drawn from the content object. */
(function () {
  const params = new URLSearchParams(location.search);
  const PREVIEW = params.has("preview");
  let C = Store.defaults();
  let lens = params.get("lens") || safeGet("amp.lens") || "";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const ytThumb = (id) => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
  const ytEmbed = (id) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- Section renderers ---------- */
  const S = {};

  S.featured = (n) => {
    const f = C.featured;
    const v0 = f.videos[0] || {};
    return `
    <section class="block" id="featured"><div class="wrap">
      ${head(n, "Featured work", "The film that started it", "One filmmaker, every department — and an audience of millions.")}
      <div class="feat">
        <div class="reveal">
          <div class="player" data-yt="${esc(v0.youtube)}">
            <img src="${esc(f.still || ytThumb(v0.youtube))}" alt="Still from ${esc(f.title)}" loading="lazy">
            <button class="play" type="button" aria-label="Play ${esc(v0.label)}"></button>
          </div>
          <div class="tabs" role="group" aria-label="Choose video">
            ${f.videos.map((v, i) => `<button type="button" data-video="${esc(v.youtube)}" aria-pressed="${i === 0}">${esc(v.label)}</button>`).join("")}
          </div>
        </div>
        <div class="feat-copy reveal" style="--d:.12s">
          <span class="mono kicker">${esc(f.kicker)}</span>
          <h3>${esc(f.title)}</h3>
          <p class="crew">${esc(f.roles)}</p>
          <p class="logline">${esc(f.logline)}</p>
          <div class="stats">
            ${f.stats.map((s) => `<a href="${esc(f.statsUrl)}" target="_blank" rel="noopener"><b data-count="${esc(s.value)}">${esc(s.value)}</b><span>${esc(s.label)}</span></a>`).join("")}
          </div>
          <ul class="badges">${f.badges.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
        </div>
      </div>
      ${f.reactionImages && f.reactionImages.length ? `
      <div class="reactions reveal">
        <span class="mono">Real audience reactions — tap to read</span>
        <div class="strip">${[f.proofImage, ...f.reactionImages].filter(Boolean).map((src, i) => `<button type="button" data-pic="${esc(src)}" data-group="reactions" aria-label="Open reaction screenshot ${i + 1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join("")}</div>
      </div>` : ""}
    </div></section>`;
  };

  S.about = (n) => {
    const p = C.profile;
    const age = p.birthYear ? new Date().getFullYear() - Number(p.birthYear) : "";
    const sheet = [...C.statSheet];
    if (age) sheet.splice(3, 0, { label: "Age", value: String(age), note: p.playingRange ? `plays ${p.playingRange}` : "" });
    return `
    <section class="block" id="about"><div class="wrap">
      ${head(n, "About", "Both sides of the lens")}
      <div class="about">
        <figure class="portrait reveal" style="margin:0">
          <img src="${esc(p.headshot)}" alt="Portrait of ${esc(p.firstName)} ${esc(p.lastName)}" loading="lazy">
          <figcaption class="mono">Headshot · ${new Date().getFullYear()}</figcaption>
        </figure>
        <div class="about-copy reveal" style="--d:.1s">
          <p class="lead">${esc(p.bioLead)}</p>
          ${p.bio.map((b) => `<p>${esc(b)}</p>`).join("")}
          ${p.quote ? `<blockquote>${esc(p.quote)}</blockquote>` : ""}
          <div class="sheet" id="stat-sheet">
            <div class="sheet-head"><span class="mono">Casting sheet</span><a class="btn btn-sm" href="comp-card.html${PREVIEW ? "?preview=1" : ""}" target="_blank" rel="noopener">↓ Comp card (PDF)</a></div>
            <dl>${sheet.map((s) => `<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}${s.note ? `<small>${esc(s.note)}</small>` : ""}</dd></div>`).join("")}</dl>
            <div class="skills">${C.skills.map((g) => `<div><h4>${esc(g.group)}</h4><div class="chips">${g.items.map((i) => `<span>${esc(i)}</span>`).join("")}</div></div>`).join("")}</div>
          </div>
        </div>
      </div>
    </div></section>`;
  };

  S.direction = (n) => {
    const items = C.projects.filter((p) => p.visible !== false);
    const types = ["All", ...new Set(items.map((p) => p.type))];
    return `
    <section class="block" id="direction"><div class="wrap">
      ${head(n, "As a director", "Stories shaped from behind the lens", "Debut shorts that reached millions, brand films and web series — each a study in tension, silence and the human condition.")}
      ${types.length > 2 ? filters(types, "proj") : ""}
      <div class="cards" data-filter-target="proj">
        ${items.map((p, i) => {
          const img = p.image || (p.youtube ? ytThumb(p.youtube) : "");
          const tag = p.status === "coming-soon" ? `<span class="tag soon">Coming soon</span>` : p.status === "unreleased" ? `<span class="tag">Unreleased</span>` : "";
          return `
          <article class="card reveal" style="--d:${(i % 3) * 0.08}s" data-cat="${esc(p.type)}">
            <button class="thumb" type="button" ${p.youtube ? `data-yt-modal="${esc(p.youtube)}" aria-label="Play ${esc(p.title)}"` : `tabindex="-1" aria-hidden="true" style="cursor:default"`}>
              ${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<span class="poster-fallback">${esc(p.title)}<small>${esc(p.type)}</small></span>`}
              ${p.youtube ? `<span class="play" aria-hidden="true"></span>` : ""}
              ${tag}
            </button>
            <div class="card-body">
              <div class="card-meta mono"><span>${esc(p.type)}</span><span>${esc(p.year)}</span></div>
              <h3>${esc(p.title)}</h3>
              <p class="role">${esc(p.role)}</p>
              <p>${esc(p.description)}</p>
            </div>
          </article>`;
        }).join("")}
      </div>
    </div></section>`;
  };

  S.gallery = (n) => {
    const items = C.gallery.filter((g) => g.src || PREVIEW);
    if (!items.length) return "";
    const cats = ["All", ...new Set(items.map((g) => g.category))];
    return `
    <section class="block" id="gallery"><div class="wrap">
      ${head(n, "Acting portfolio", "Selected frames", "Film stills, portraits and behind-the-scenes moments.")}
      ${filters(cats, "gal")}
      <div class="grid" data-filter-target="gal">
        ${items.map((g) => g.src ? `
          <figure class="tile reveal" data-cat="${esc(g.category)}">
            <button type="button" data-pic="${esc(g.src)}" data-cap="${esc(g.caption)}" data-group="gallery" aria-label="Open ${esc(g.caption)}"><img src="${esc(g.src)}" alt="${esc(g.caption)}" loading="lazy"></button>
            <figcaption><span>${esc(g.caption)}</span><span>${esc(g.category)}</span></figcaption>
          </figure>` : `
          <figure class="tile empty" data-cat="${esc(g.category)}">
            <div><span class="mono">Open slot · ${esc(g.category)}</span><b>${esc(g.caption)}</b><small>Add a photo in Admin → Gallery.<br>Hidden from visitors until filled.</small></div>
          </figure>`).join("")}
      </div>
    </div></section>`;
  };

  S.bts = (n) => {
    const b = C.bts;
    const [p1, p2, p3] = b.photos;
    const ph = (p, cls) => p ? `<figure class="${cls} reveal" style="margin:0"><button type="button" data-pic="${esc(p.src)}" data-cap="${esc(p.caption)}" data-group="bts" style="border:0;padding:0;width:100%;height:100%;cursor:zoom-in;background:none"><img src="${esc(p.src)}" alt="${esc(p.caption)}" loading="lazy"></button><span class="cap">${esc(p.caption)}</span></figure>` : "";
    return `
    <section class="block" id="bts"><div class="wrap">
      ${head(n, "On set", b.title, b.text)}
      <div class="bts">
        ${ph(p1, "p1")}${ph(p2, "p2")}${ph(p3, "p3")}
        ${b.clips.map((c) => `<figure class="clip reveal" style="margin:0"><video muted loop playsinline preload="none" poster="${esc(c.poster)}" src="${esc(c.src)}" aria-label="${esc(c.caption)}"></video><span class="cap">${esc(c.caption)}</span></figure>`).join("")}
      </div>
    </div></section>`;
  };

  S.anchoring = (n) => {
    const a = C.anchoring;
    return `
    <section class="block" id="anchoring"><div class="wrap">
      ${head(n, "Anchoring & hosting", "Command the mic. Own the room.", a.intro)}
      <div class="anchor-stats reveal">${a.stats.map((s) => `<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>
      <div class="reel" id="event-reel">
        ${a.events.map((e) => `<figure class="reveal"><button type="button" data-pic="${esc(e.src)}" data-cap="${esc(e.title)}" data-group="events" aria-label="Open ${esc(e.title)}"><img src="${esc(e.src)}" alt="${esc(e.title)}" loading="lazy"></button><figcaption><span>${esc(e.title)}</span><span class="mono">${esc(e.category)}</span></figcaption></figure>`).join("")}
      </div>
      <div class="reel-nav"><button type="button" data-reel="-1" aria-label="Previous">←</button><button type="button" data-reel="1" aria-label="Next">→</button></div>
    </div></section>`;
  };

  S.voices = (n) => {
    const list = C.testimonials.filter((t) => lens === "all" || t.lens === lens);
    const show = list.length ? list : C.testimonials;
    return `
    <section class="block" id="voices"><div class="wrap">
      ${head(n, "Audience love", "What people are saying")}
      <div class="voices">
        ${show.map((t, i) => `<figure class="voice reveal" style="--d:${(i % 3) * 0.08}s"><blockquote>${esc(t.quote)}</blockquote><figcaption><b>${esc(t.author)}</b> · via ${esc(t.source)}</figcaption></figure>`).join("")}
      </div>
    </div></section>`;
  };

  S.credits = (n) => `
    <section class="block" id="credits"><div class="wrap">
      ${head(n, "Credits", "Filmography & training")}
      <table class="credits reveal">
        <thead><tr><th class="mono">Year</th><th class="mono">Title</th><th class="mono">Role</th><th class="mono">Type</th></tr></thead>
        <tbody>${C.timeline.map((t) => `<tr><td>${esc(t.year)}</td><td><b>${esc(t.title)}</b>${t.note ? `<small>${esc(t.note)}</small>` : ""}</td><td>${esc(t.role)}</td><td><span class="tag">${esc(t.category)}</span></td></tr>`).join("")}</tbody>
      </table>
    </div></section>`;

  S.contact = (n) => {
    const c = C.contact;
    const L = C.lenses[lens] || C.lenses.all;
    const kinds = [...new Set(Object.values(C.lenses).map((l) => l.enquiry))];
    return `
    <section class="block" id="contact"><div class="wrap contact">
      <div class="reveal">
        <span class="mono" style="color:var(--accent)">${String(n).padStart(2, "0")} — Get in touch</span>
        <h2>Let's make<br><em>something</em> real.</h2>
        <p style="color:var(--ink-2)">${esc(C.availability.note)}</p>
        <ul class="links">
          ${c.email ? `<li><a href="mailto:${esc(c.email)}"><span>Email</span>${esc(c.email)}</a></li>` : ""}
          ${c.phone ? `<li><a href="tel:${esc(c.phone.replace(/\s/g, ""))}"><span>Phone</span>${esc(c.phone)}</a></li>` : ""}
          ${c.whatsapp ? `<li><a href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener"><span>WhatsApp</span>Message directly →</a></li>` : ""}
          ${c.instagram ? `<li><a href="https://www.instagram.com/${esc(c.instagram)}" target="_blank" rel="noopener"><span>Instagram</span>@${esc(c.instagram)}</a></li>` : ""}
        </ul>
      </div>
      <form class="enquiry reveal" style="--d:.1s" novalidate>
        <fieldset class="kind" style="border:0;padding:0;margin:0"><legend class="sr-only">Enquiry type</legend>
          ${kinds.map((k) => `<label><input type="radio" name="kind" value="${esc(k)}" ${k === L.enquiry ? "checked" : ""}><span>${esc(k)}</span></label>`).join("")}
        </fieldset>
        <div class="row">
          <label>Your name<input name="name" required autocomplete="name"></label>
          <label>Email<input name="email" type="email" required autocomplete="email"></label>
        </div>
        <div class="row">
          <label>Company / production<input name="org" autocomplete="organization"></label>
          <label>Dates (optional)<input name="dates" placeholder="e.g. Feb 2027"></label>
        </div>
        <label>Message<textarea name="message" required></textarea></label>
        <button class="btn btn-gold" type="submit" style="justify-self:start">Send enquiry →</button>
        <p class="form-note">${c.formEndpoint ? "Goes straight to Arun's inbox." : (PREVIEW ? "Preview: test messages go to Admin → Enquiries. Add a Web3Forms key in Admin → Contact to deliver real ones to your inbox." : "This opens your email app with the message ready to send.")}</p>
        <div class="form-status" aria-live="polite"></div>
      </form>
    </div></section>`;
  };

  /* ---------- Helpers ---------- */
  function head(n, kicker, title, text) {
    return `<div class="head reveal"><span class="num" aria-hidden="true">${String(n).padStart(2, "0")}</span><span class="mono">${esc(kicker)}</span><h2>${esc(title)}</h2>${text ? `<p>${esc(text)}</p>` : ""}</div>`;
  }
  function filters(cats, key) {
    return `<div class="filters reveal" role="group" aria-label="Filter" data-filter="${key}">${cats.map((c, i) => `<button type="button" data-val="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join("")}</div>`;
  }

  /* ---------- Render ---------- */
  function renderChrome() {
    const p = C.profile, L = C.lenses[lens] || C.lenses.all;
    document.documentElement.style.setProperty("--accent", C.site.accent || "#d4a54a");
    document.body.classList.toggle("grain", !!C.site.grain);
    document.body.classList.toggle("letterbox", !!C.site.letterbox);
    document.title = C.site.title;
    setMeta('meta[name="description"]', C.site.description);
    setMeta('meta[property="og:title"]', C.site.title);
    setMeta('meta[property="og:description"]', C.site.description);
    setMeta('meta[property="og:image"]', C.site.ogImage);

    bind("monogram", (el) => (el.textContent = p.monogram));
    bind("firstName", (el) => (el.textContent = p.firstName));
    bind("lastName", (el) => (el.textContent = p.lastName));
    bind("heroLine", (el) => (el.textContent = p.heroLine));
    bind("heroImage", (el) => (el.src = p.heroImage));
    bind("reelLabel", (el) => (el.textContent = p.showreel.label || "Watch the reel"));
    bind("cta", (el) => (el.textContent = L.cta));
    bind("cta2", (el) => (el.textContent = L.cta));
    const roleOn = { actor: "Actor", director: "Director", anchor: "Anchor" }[lens];
    bind("roles", (el) => (el.innerHTML = p.roles.map((r) => `<li class="${r === roleOn ? "on" : ""}">${esc(r)}</li>`).join("")));
    const statusText = { available: "Available for projects", limited: "Limited availability", booked: "Currently booked" }[C.availability.status] || "";
    bind("status", (el) => { el.dataset.s = C.availability.status; el.querySelector("span").textContent = statusText; });
    bind("copyright", (el) => (el.textContent = `© ${new Date().getFullYear()} ${p.firstName} ${p.lastName}`));

    const nav = $(".lens");
    $$("button", nav).forEach((b) => b.remove());
    Object.entries(C.lenses).forEach(([key, l]) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = l.label; b.dataset.lens = key;
      b.setAttribute("aria-pressed", String(key === lens));
      nav.appendChild(b);
    });
  }

  function renderMain() {
    const L = C.lenses[lens] || C.lenses.all;
    const html = L.sections.filter((k) => S[k]).map((k, i) => S[k](i + 1)).join("");
    $("#main").innerHTML = html;
    observe();
  }

  function render() { renderChrome(); renderMain(); }
  function bind(name, fn) { $$(`[data-bind="${name}"]`).forEach(fn); }
  function setMeta(sel, v) { const m = $(sel); if (m) m.setAttribute("content", v || ""); }

  /* ---------- Behaviour ---------- */
  let io;
  function observe() {
    io && io.disconnect();
    io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach((el) => io.observe(el));

    const vio = new IntersectionObserver((entries) => entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting && !matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {}); else v.pause();
    }), { threshold: 0.4 });
    $$(".bts video").forEach((v) => vio.observe(v));
  }

  function setLens(next) {
    if (!C.lenses[next]) return;
    lens = next; safeSet("amp.lens", lens);
    const u = new URL(location.href);
    next === "all" ? u.searchParams.delete("lens") : u.searchParams.set("lens", next);
    history.replaceState(null, "", u);
    render();
    const first = $("#main section");
    if (first && scrollY > innerHeight * 0.6) first.scrollIntoView({ behavior: "smooth" });
  }

  const modal = $("#modal");
  let gallery = [], gi = 0;
  function openVideo(id) {
    $(".modal-body", modal).innerHTML = `<button class="x" type="button" aria-label="Close">×</button><div class="frame"><iframe src="${ytEmbed(id)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video"></iframe></div>`;
    modal.showModal();
  }
  function openPic(group, src) {
    gallery = $$(`[data-group="${group}"]`).map((b) => ({ src: b.dataset.pic, cap: b.dataset.cap || "" }));
    gi = Math.max(0, gallery.findIndex((g) => g.src === src));
    drawPic(); modal.showModal();
  }
  function drawPic() {
    const g = gallery[gi];
    $(".modal-body", modal).innerHTML = `<button class="x" type="button" aria-label="Close">×</button>
      <div class="pic"><img src="${esc(g.src)}" alt="${esc(g.cap)}"></div>${g.cap ? `<p>${esc(g.cap)}</p>` : ""}
      ${gallery.length > 1 ? `<button class="nav-arrow prev" type="button" aria-label="Previous">‹</button><button class="nav-arrow next" type="button" aria-label="Next">›</button>` : ""}`;
  }
  modal.addEventListener("close", () => ($(".modal-body", modal).innerHTML = ""));
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".x")) modal.close();
    if (e.target.closest(".prev")) { gi = (gi - 1 + gallery.length) % gallery.length; drawPic(); }
    if (e.target.closest(".next")) { gi = (gi + 1) % gallery.length; drawPic(); }
  });
  modal.addEventListener("keydown", (e) => {
    if (!gallery.length || !$(".pic", modal)) return;
    if (e.key === "ArrowLeft") { gi = (gi - 1 + gallery.length) % gallery.length; drawPic(); }
    if (e.key === "ArrowRight") { gi = (gi + 1) % gallery.length; drawPic(); }
  });

  document.addEventListener("click", (e) => {
    const t = e.target;
    const lensBtn = t.closest("[data-lens]");
    if (lensBtn) return setLens(lensBtn.dataset.lens);
    if (t.closest('[data-action="reel"]')) return C.profile.showreel.youtube && openVideo(C.profile.showreel.youtube);

    const player = t.closest(".player");
    if (player && player.dataset.yt) {
      player.innerHTML = `<iframe src="${ytEmbed(player.dataset.yt)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video player"></iframe>`;
      return;
    }
    const vbtn = t.closest("[data-video]");
    if (vbtn) {
      const pl = $(".player"); const id = vbtn.dataset.video;
      $$("[data-video]").forEach((b) => b.setAttribute("aria-pressed", String(b === vbtn)));
      pl.dataset.yt = id;
      pl.innerHTML = `<iframe src="${ytEmbed(id)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video player"></iframe>`;
      return;
    }
    const ym = t.closest("[data-yt-modal]");
    if (ym) return openVideo(ym.dataset.ytModal);
    const pic = t.closest("[data-pic]");
    if (pic) return openPic(pic.dataset.group, pic.dataset.pic);

    const fb = t.closest("[data-filter] button");
    if (fb) {
      const grp = fb.parentElement; const val = fb.dataset.val;
      $$("button", grp).forEach((b) => b.setAttribute("aria-pressed", String(b === fb)));
      $$(`[data-filter-target="${grp.dataset.filter}"] > *`).forEach((el) => (el.style.display = val === "All" || el.dataset.cat === val ? "" : "none"));
      return;
    }
    const rn = t.closest("[data-reel]");
    if (rn) { const r = $("#event-reel"); r.scrollBy({ left: Number(rn.dataset.reel) * r.clientWidth * 0.8, behavior: "smooth" }); }
  });

  document.addEventListener("submit", async (e) => {
    const form = e.target.closest("form.enquiry"); if (!form) return;
    e.preventDefault();
    const out = $(".form-status", form);
    const data = Object.fromEntries(new FormData(form));
    if (!data.name || !data.email || !data.message || !form.email.checkValidity()) {
      out.innerHTML = `<p class="form-note" style="color:var(--busy)">Please add your name, a valid email and a message.</p>`; return;
    }
    const entry = Object.assign({ id: "e" + Date.now(), at: new Date().toISOString(), lens, read: false }, data);
    const C2 = C.contact;
    if (C2.formEndpoint) {
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(Object.assign({ access_key: C2.formEndpoint, subject: `Portfolio enquiry — ${data.kind}` }, data))
        });
        if (!res.ok) throw new Error(res.status);
        form.reset(); out.innerHTML = `<div class="form-ok">Thank you, ${esc(data.name)} — your message is on its way.</div>`;
      } catch (err) {
        out.innerHTML = `<p class="form-note" style="color:var(--busy)">Couldn't send right now. Please email <a href="mailto:${esc(C2.email)}">${esc(C2.email)}</a>.</p>`;
      }
      return;
    }
    if (PREVIEW) Store.addEnquiry(entry);
    const body = `${data.message}\n\n— ${data.name} (${data.email})${data.org ? "\n" + data.org : ""}${data.dates ? "\nDates: " + data.dates : ""}`;
    const mail = `mailto:${C2.email}?subject=${encodeURIComponent("Portfolio enquiry — " + data.kind)}&body=${encodeURIComponent(body)}`;
    if (PREVIEW) { form.reset(); out.innerHTML = `<div class="form-ok">Test enquiry saved to Admin → Enquiries (preview only).</div>`; return; }
    location.href = mail;
    out.innerHTML = `<div class="form-ok">Your email app should open with the message ready to send. If it doesn't, write to <a href="${esc(mail)}">${esc(C2.email)}</a>.</div>`;
  });

  // Header + timecode
  const top = $("#top"), tc = $(".timecode");
  const fps = 24;
  addEventListener("scroll", () => {
    top.classList.toggle("scrolled", scrollY > 40);
    const f = Math.floor(scrollY / 6), s = Math.floor(f / fps);
    const pad = (n) => String(n).padStart(2, "0");
    tc.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % fps)}`;
  }, { passive: true });

  // Live preview from admin
  if (PREVIEW) {
    const flag = document.createElement("div"); flag.className = "preview-flag"; flag.textContent = "Draft preview";
    document.body.appendChild(flag);
    addEventListener("message", (e) => {
      if (e.origin !== location.origin || !e.data || e.data.type !== "amp:content") return;
      C = e.data.content; fromAdmin = true;
      if (e.data.lens && C.lenses[e.data.lens]) lens = e.data.lens;
      const y = scrollY; render(); scrollTo(0, y);
      if (e.data.focus) { const el = document.getElementById(e.data.focus); el && el.scrollIntoView({ behavior: "smooth" }); }
    });
  }

  let fromAdmin = false;
  Store.loadPublished().then((pub) => {
    if (fromAdmin) return;
    C = PREVIEW ? Store.draft(pub) : pub;
    if (!lens) lens = C.site.defaultLens || "all";
    if (!C.lenses[lens]) lens = "all";
    render();
  });
})();
