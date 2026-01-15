(function () {
  const SITE = window.__JSW_SITE__;
  const I18N = window.__JSW_I18N__;

  const q = (s, el = document) => el.querySelector(s);
  const qa = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));

  function detectLang() {
    const langs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || "en"];
    for (const raw of langs) {
      const L = String(raw || "").toLowerCase();
      if (L.startsWith("zh")) {
        const isHant = L.includes("hant") || L.includes("tw") || L.includes("hk") || L.includes("mo");
        return isHant ? "zh-Hant" : "zh-Hans";
      }
      if (L.startsWith("en")) return "en";
    }
    return "en";
  }

  function pick(obj, path, fallback="") {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (!cur || typeof cur !== "object" || !(p in cur)) return fallback;
      cur = cur[p];
    }
    return cur ?? fallback;
  }

  function setMeta(dict, langCode) {
    document.documentElement.lang = langCode;

    const title = pick(dict, "meta.title", `${SITE.site.short} Portal`);
    const desc  = pick(dict, "meta.description", "");

    document.title = title;

    const md = q('meta[name="description"]');
    if (md) md.setAttribute("content", desc);

    const ogt = q('meta[property="og:title"]');
    if (ogt) ogt.setAttribute("content", title);

    const ogd = q('meta[property="og:description"]');
    if (ogd) ogd.setAttribute("content", desc);

    const twd = q('meta[name="twitter:description"]');
    if (twd) twd.setAttribute("content", desc);
  }

  function render(dict) {
    // a11y skip text
    const skip = q("#skipLink");
    if (skip) skip.textContent = pick(dict, "ui.skip_to_content", "Skip to content");

    // header
    q("#hTitle").textContent = pick(dict, "ui.home_title", "Portal");
    q("#hSub").textContent   = pick(dict, "ui.home_subtitle", "");

    // search
    q("#searchLabel").textContent = pick(dict, "ui.search_label", "Search");
    q("#search").setAttribute("placeholder", pick(dict, "ui.search_placeholder", ""));

    // footer
    q("#footNote").textContent = pick(dict, "footer.note", "");
    const email = SITE.site.email || "";
    const mailLink = q("#mailLink");
    mailLink.href = email ? `mailto:${email}` : "#";
    mailLink.textContent = email || "mail";

    const main = q("#content");
    const sectionsHtml = SITE.sections.map((sec) => {
      const sTitle = pick(dict, `sections.${sec.id}`, sec.id);
      const cards = sec.items.map((it) => {
        const t = pick(dict, `items.${it.id}.title`, it.id);
        const d = pick(dict, `items.${it.id}.desc`, "");
        const icon = it.icon || "↗";
        const openTxt = pick(dict, "ui.open", "Open");
        const isExternal = /^https?:\/\//i.test(it.href);
        const rel = isExternal ? ` rel="noopener noreferrer"` : "";
        const target = isExternal ? ` target="_blank"` : "";
        return `
          <article class="card" data-title="${esc(t)}" data-desc="${esc(d)}">
            <div class="left">
              <div class="icon" aria-hidden="true">${esc(icon)}</div>
              <div>
                <h3>${esc(t)}</h3>
                <p>${esc(d)}</p>
              </div>
            </div>
            <a class="go" href="${esc(it.href)}"${target}${rel}>${esc(openTxt)}</a>
          </article>
        `.trim();
      }).join("");

      return `
        <section class="section" aria-label="${esc(sTitle)}">
          <h2>${esc(sTitle)}</h2>
          <div class="cards">${cards}</div>
        </section>
      `.trim();
    }).join("");

    main.innerHTML = sectionsHtml;

    // search filtering
    const input = q("#search");
    const cards = qa("[data-title]");
    const norm = (s) => String(s || "").toLowerCase().trim();
    const apply = () => {
      const needle = norm(input.value);
      for (const c of cards) {
        const hay = norm(c.getAttribute("data-title") + " " + c.getAttribute("data-desc"));
        c.hidden = !!needle && !hay.includes(needle);
      }
    };
    input.addEventListener("input", apply, { passive: true });
  }

  const lang = detectLang();
  const dict = I18N[lang] || I18N.en || {};
  setMeta(dict, lang);
  render(dict);
})();
