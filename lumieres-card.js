/*
 * Carte Lumières — custom:lumieres-card
 *
 * Lumières de Home Assistant rangées par pièce, dans le style des cartes MyElectricalData :
 * marche / arrêt, luminosité directe, blanc chaud ↔ froid, couleurs, scènes et « tout éteindre ».
 * Sans configuration, la carte trouve seule les lumières et leurs pièces (zones de Home Assistant).
 */
(() => {
const CARD_VERSION = "0.1.0";

const DEFAULTS = {
  title: "",
  icon: "mdi:lightbulb-group",
  areas: [],
  exclude: [],
  show_off: true,
  show_scenes: true,
  layout: "list",
  show_header: true,
  scenes: [],
  max_scenes: 8,
  theme: "v2",
  language: "auto",
};

/* ---------------------------------------------------------------- textes */

const I18N = {
  fr: {
    title: "Lumières", all_off: "Tout éteindre", room_off: "Éteindre", off: "Éteinte", on: "Allumée", unavailable: "Indisponible",
    n_on: { one: "{n} lumière allumée", other: "{n} lumières allumées" }, none_on: "Tout est éteint",
    room_count: "{on}/{n}", other_room: "Autres lumières", scenes: "Scènes", brightness: "Luminosité",
    white: "Blanc", warm: "Chaud", cold: "Froid", color: "Couleur", details: "Plus de réglages", more: "Fiche complète",
    none: "Aucune lumière trouvée", none_hint: "Ajoutez des lumières dans Home Assistant, ou vérifiez les options areas et exclude de la carte.",
    toggle: "Allumer ou éteindre", hold: "Appui : allumer ou éteindre ; appui long : luminosité et couleur", collapse: "Replier ou déplier la pièce", scene_on: "Scène « {s} » activée",
  },
  en: {
    title: "Lights", all_off: "Turn all off", room_off: "Turn off", off: "Off", on: "On", unavailable: "Unavailable",
    n_on: { one: "{n} light on", other: "{n} lights on" }, none_on: "Everything is off",
    room_count: "{on}/{n}", other_room: "Other lights", scenes: "Scenes", brightness: "Brightness",
    white: "White", warm: "Warm", cold: "Cool", color: "Colour", details: "More settings", more: "Full details",
    none: "No lights found", none_hint: "Add lights to Home Assistant, or check the card's areas and exclude options.",
    toggle: "Turn on or off", hold: "Tap: turn on or off; long press: brightness and colour", collapse: "Collapse or expand the room", scene_on: "Scene “{s}” activated",
  },
  pl: {
    title: "Światła", all_off: "Wyłącz wszystko", room_off: "Wyłącz", off: "Wyłączone", on: "Włączone", unavailable: "Niedostępne",
    n_on: { one: "{n} światło włączone", few: "{n} światła włączone", many: "{n} świateł włączonych", other: "{n} świateł włączonych" },
    none_on: "Wszystko wyłączone", room_count: "{on}/{n}", other_room: "Inne światła", scenes: "Sceny", brightness: "Jasność",
    white: "Biel", warm: "Ciepła", cold: "Zimna", color: "Kolor", details: "Więcej ustawień", more: "Szczegóły",
    none: "Nie znaleziono świateł", none_hint: "Dodaj światła w Home Assistant lub sprawdź opcje areas i exclude karty.",
    toggle: "Włącz lub wyłącz", hold: "Dotknij: włącz lub wyłącz; przytrzymaj: jasność i kolor", collapse: "Zwiń lub rozwiń pomieszczenie", scene_on: "Scena „{s}” włączona",
  },
};

const EDITOR_LABELS = {
  fr: { title: "Titre (Lumières par défaut)", icon: "Icône", areas: "Pièces affichées (toutes si vide)", exclude: "Lumières à masquer",
    layout: "Affichage", show_header: "Afficher l'en-tête (titre et icône)", show_off: "Afficher les lumières éteintes", show_scenes: "Afficher les scènes", scenes: "Scènes (toutes si vide)",
    max_scenes: "Nombre de scènes au maximum", theme: "Couleurs de la carte", language: "Langue" },
  en: { title: "Title (Lights by default)", icon: "Icon", areas: "Rooms shown (all if empty)", exclude: "Lights to hide",
    layout: "Layout", show_header: "Show the header (title and icon)", show_off: "Show lights that are off", show_scenes: "Show scenes", scenes: "Scenes (all if empty)",
    max_scenes: "Maximum number of scenes", theme: "Card colours", language: "Language" },
  pl: { title: "Tytuł (domyślnie Światła)", icon: "Ikona", areas: "Pokazane pomieszczenia (wszystkie, jeśli puste)", exclude: "Ukryte światła",
    layout: "Układ", show_header: "Pokaż nagłówek (tytuł i ikona)", show_off: "Pokaż wyłączone światła", show_scenes: "Pokaż sceny", scenes: "Sceny (wszystkie, jeśli puste)",
    max_scenes: "Maksymalna liczba scen", theme: "Kolory karty", language: "Język" },
};

const EDITOR_HELP = {
  fr: { layout: "Par défaut : liste. Boutons : appui pour allumer ou éteindre, curseur dessous, appui long pour la couleur.",
    theme: "Par défaut : bleu nuit.", language: "Par défaut : langue de Home Assistant.", max_scenes: "8 par défaut.",
    show_header: "Décoché : une ligne discrète à la place, pour poser la carte sous une autre." },
  en: { layout: "Default: list. Buttons: tap to turn on or off, slider below, long press for colour.",
    theme: "Default: night blue.", language: "Default: Home Assistant language.", max_scenes: "8 by default.",
    show_header: "Unchecked: a discreet line instead, to place the card under another one." },
  pl: { layout: "Domyślnie: lista. Przyciski: dotknij, aby włączyć lub wyłączyć, suwak poniżej, przytrzymaj dla koloru.",
    theme: "Domyślnie: granatowy.", language: "Domyślnie: język Home Assistant.", max_scenes: "Domyślnie 8.",
    show_header: "Odznaczone: dyskretna linia, aby umieścić kartę pod inną." },
};
/** Langue de l'interface pour l'éditeur (Home Assistant ne lui passe pas toujours hass). */
const uiLang = () => String(document.querySelector("home-assistant")?.hass?.locale?.language || navigator.language || "fr").slice(0, 2);

// Couleurs proposées pour les ampoules couleur
const SWATCHES = [[255, 180, 107], [255, 236, 200], [255, 64, 64], [255, 140, 0], [255, 214, 10], [80, 220, 100], [0, 200, 255], [40, 90, 255], [170, 70, 255], [255, 80, 180]];
const DIMMABLE = new Set(["brightness", "color_temp", "hs", "xy", "rgb", "rgbw", "rgbww", "white"]);
const COLOR = new Set(["hs", "xy", "rgb", "rgbw", "rgbww"]);

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/**
 * Nom court : sans le nom de la pièce ni le mot du type d'appareil, où qu'ils soient
 * (« Lumière Salon Centre » dans la pièce Salon → « Centre »). Nom complet si rien ne reste.
 */
const KIND_WORDS = new Set(["lumiere", "lumieres", "light", "lights", "eclairage", "swiatlo", "swiatla", "lampa"]);
const LINK_WORDS = new Set(["de", "du", "des", "d", "la", "le", "les", "l", "of", "the", "w", "na"]);
const fold = (w) => w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const shortName = (name, area, kinds) => {
  const words = String(name).split(/\s+/).filter(Boolean);
  const keep = words.map(() => true);
  // la pièce entière, puis chacune de ses parties (« Salle de bain & WC » → « Salle de bain », « WC »)
  const areas = [String(area || ""), ...String(area || "").split(/\s*(?:&|\/|\+|,|\bet\b|\band\b|\bi\b)\s*/i)];
  for (const part of areas) {
    const areaW = part.split(/\s+/).map(fold).filter(Boolean);
    if (!areaW.length) continue;
    for (let i = 0; i + areaW.length <= words.length; i++) {
      if (areaW.every((a, j) => keep[i + j] && fold(words[i + j]) === a)) for (let j = 0; j < areaW.length; j++) keep[i + j] = false;
    }
  }
  words.forEach((w, i) => { if (kinds.has(fold(w))) keep[i] = false; });
  let out = words.filter((w, i) => keep[i]);
  while (out.length && LINK_WORDS.has(fold(out[0]))) out.shift();
  while (out.length && LINK_WORDS.has(fold(out[out.length - 1]))) out.pop();
  if (!out.length) return String(name);
  const s = out.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const store = {
  get(k, d) { try { const v = JSON.parse(window.localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } },
  set(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rgbCss = (c) => (Array.isArray(c) && c.length >= 3 ? `rgb(${c.slice(0, 3).map((x) => clamp(Number(x) || 0, 0, 255)).join(",")})` : null);
/** Couleur approximative d'un blanc (Kelvin) pour l'icône et le curseur. */
const kelvinCss = (k) => {
  const t = clamp((Number(k) - 2000) / 4500, 0, 1);
  const mix = (a, b) => Math.round(a + (b - a) * t);
  return `rgb(${mix(255, 220)},${mix(176, 234)},${mix(92, 255)})`;
};

class LumieresCard extends HTMLElement {
  constructor() {
    super();
    // fin d'un glissement de curseur : la carte se remet à jour
    this._release = () => { if (this._dragging) { this._dragging = false; this._sig = null; this._render(); } };
  }

  static getStubConfig() {
    return {};
  }

  /** Éditeur visuel : formulaire de Home Assistant. */
  static getConfigForm() {
    return {
      schema: [
        { type: "grid", name: "", schema: [
          { name: "title", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
        ] },
        { name: "areas", selector: { area: { multiple: true, entity: { domain: "light" } } } },
        { name: "exclude", selector: { entity: { multiple: true, filter: { domain: "light" } } } },
        { type: "grid", name: "", schema: [
          { name: "show_off", selector: { boolean: {} } },
          { name: "show_scenes", selector: { boolean: {} } },
        ] },
        { name: "scenes", selector: { entity: { multiple: true, filter: { domain: "scene" } } } },
        { name: "max_scenes", selector: { number: { min: 1, max: 30, mode: "box" } } },
        { name: "layout", selector: { select: { mode: "dropdown", options: [
          { value: "list", label: "Liste" }, { value: "buttons", label: "Boutons" }] } } },
        { name: "show_header", selector: { boolean: {} } },
        { name: "theme", selector: { select: { mode: "dropdown", options: [
          { value: "v2", label: "Bleu nuit (style MyElectricalData)" },
          { value: "auto", label: "Bleu nuit, clair si Home Assistant est en mode clair" },
          { value: "ha", label: "Thème de Home Assistant" }] } } },
        { name: "language", selector: { select: { mode: "dropdown", options: [
          { value: "auto", label: "Langue de Home Assistant" }, { value: "fr", label: "Français" },
          { value: "en", label: "English" }, { value: "pl", label: "Polski" }] } } },
      ],
      computeLabel: (s) => (EDITOR_LABELS[uiLang()] || EDITOR_LABELS.fr)[s.name] || s.name,
      computeHelper: (s) => (EDITOR_HELP[uiLang()] || EDITOR_HELP.fr)[s.name],
    };
  }

  setConfig(config) {
    this._config = { ...DEFAULTS, ...(config || {}) };
    for (const k of ["areas", "exclude", "scenes"]) {
      const v = this._config[k];
      this._config[k] = Array.isArray(v) ? v : v ? [v] : [];
    }
    this._sig = null;
    if (!this.shadowRoot) this._init();
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: "full", rows: "auto", min_columns: 6 };
  }

  /* -------------------------------------------------------- événements */

  _init() {
    this.attachShadow({ mode: "open" });
    this._open = new Set();
    this._collapsed = new Set(store.get("lumieres-card:collapsed", []));
    const root = this.shadowRoot;
    root.addEventListener("click", (ev) => {
      if (this._held) { this._held = false; ev.stopPropagation(); return; } // appui long : la fiche est déjà ouverte
      if (ev.target.matches?.("input[type=range]")) return; // curseur dans un bouton : pas de bascule
      const el = ev.target.closest?.("[data-act]");
      if (!el) return;
      const { act, id } = el.dataset;
      if (act === "toggle") this._call("light", "toggle", { entity_id: id });
      else if (act === "off") this._call("light", "turn_off", { entity_id: JSON.parse(el.dataset.ids) });
      else if (act === "scene") { this._call("scene", "turn_on", { entity_id: id }); this._flash(el); }
      else if (act === "rgb") this._call("light", "turn_on", { entity_id: id, rgb_color: JSON.parse(el.dataset.rgb) });
      else if (act === "info") this._moreInfo(id);
      else if (act === "open") { this._open.has(id) ? this._open.delete(id) : this._open.add(id); this._sig = null; this._render(); }
      else if (act === "room") {
        this._collapsed.has(id) ? this._collapsed.delete(id) : this._collapsed.add(id);
        store.set("lumieres-card:collapsed", [...this._collapsed]);
        this._sig = null; this._render();
      }
    });
    // curseurs : affichage pendant le glissement, envoi au relâchement, pas de rafraîchissement entre-temps
    root.addEventListener("pointerdown", (ev) => { if (ev.target.matches?.("input[type=range]")) this._dragging = true; });
    root.addEventListener("input", (ev) => {
      const r = ev.target;
      if (!r.matches?.("input[type=range]")) return;
      this._dragging = true;
      r.style.setProperty("--p", `${this._pct(r)}%`);
      const out = r.closest(".lc-slider")?.querySelector("output") || r.closest(".lc-bt")?.querySelector("span");
      if (out && r.dataset.kind === "bri") out.textContent = `${r.value} %`;
    });
    root.addEventListener("change", (ev) => {
      const r = ev.target;
      if (!r.matches?.("input[type=range]")) return;
      this._dragging = false;
      const v = Number(r.value);
      if (r.dataset.kind === "bri") this._call("light", "turn_on", { entity_id: r.dataset.id, brightness_pct: v });
      else if (r.dataset.kind === "ct") this._call("light", "turn_on", { entity_id: r.dataset.id, color_temp_kelvin: v });
    });
    // appui long sur un bouton (affichage « boutons ») : fiche de Home Assistant
    root.addEventListener("pointerdown", (ev) => {
      clearTimeout(this._holdTimer);
      this._held = false;
      const el = ev.target.closest?.("[data-hold]");
      if (el && !ev.target.matches?.("input[type=range]")) this._holdTimer = setTimeout(() => { this._held = true; this._moreInfo(el.dataset.hold); }, 550);
    });
    for (const t of ["pointerup", "pointercancel", "pointerleave"]) root.addEventListener(t, () => clearTimeout(this._holdTimer), true);
    root.addEventListener("contextmenu", (ev) => { if (ev.target.closest?.("[data-hold]")) ev.preventDefault(); });
    root.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches?.("[data-act]:not(button)")) { ev.preventDefault(); ev.target.click(); }
    });
  }

  connectedCallback() {
    window.addEventListener("pointerup", this._release);
  }

  disconnectedCallback() {
    window.removeEventListener("pointerup", this._release);
  }

  _pct(r) {
    const min = Number(r.min), max = Number(r.max);
    return max > min ? ((Number(r.value) - min) / (max - min)) * 100 : 0;
  }

  _call(domain, service, data) {
    this._hass?.callService(domain, service, data);
  }

  _moreInfo(entityId) {
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId };
    this.dispatchEvent(ev);
  }

  _flash(el) {
    el.classList.add("lc-done");
    setTimeout(() => el.classList.remove("lc-done"), 900);
  }

  /* ------------------------------------------------------------ données */

  _t() {
    const want = this._config.language === "auto" ? String(this._hass?.locale?.language || this._hass?.language || "fr").slice(0, 2) : this._config.language;
    this._lang = I18N[want] ? want : "fr";
    return I18N[this._lang];
  }

  _fmt(key, vars = {}) {
    let s = this._t()[key] ?? key;
    if (typeof s === "object") s = s[new Intl.PluralRules(this._lang).select(Number(vars.n))] ?? s.other;
    return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  }

  _areaOf(id) {
    const e = this._hass.entities?.[id];
    if (!e) return null;
    return e.area_id || this._hass.devices?.[e.device_id]?.area_id || null;
  }

  _visible(id) {
    const e = this._hass.entities?.[id];
    return !(e && (e.hidden || e.entity_category));
  }

  _name(id) {
    const st = this._hass.states[id];
    const e = this._hass.entities?.[id];
    const name = e?.name || st?.attributes?.friendly_name || id;
    // sans le nom de la pièce ni le type d'appareil (« Lumière Salon Centre » → « Centre »)
    return shortName(name, this._hass.areas?.[this._areaOf(id)]?.name, KIND_WORDS);
  }

  /** Pièces avec leurs lumières, dans l'ordre des étages puis des noms. */
  _rooms() {
    const c = this._config, hass = this._hass;
    const exclude = new Set(c.exclude);
    const only = new Set(c.areas);
    const groups = new Map();
    for (const id of Object.keys(hass.states)) {
      if (!id.startsWith("light.") || exclude.has(id) || !this._visible(id)) continue;
      const area = this._areaOf(id) || "";
      if (only.size && !only.has(area)) continue;
      if (!groups.has(area)) groups.set(area, []);
      groups.get(area).push(id);
    }
    const floors = hass.floors || {};
    const level = (a) => floors[hass.areas?.[a]?.floor_id]?.level ?? 999;
    const order = only.size ? [...only] : null;
    const rooms = [...groups.entries()].map(([area, ids]) => ({
      area,
      name: hass.areas?.[area]?.name || this._t().other_room,
      icon: hass.areas?.[area]?.icon || (area ? "mdi:door" : "mdi:lightbulb-multiple-outline"),
      ids: ids.sort((a, b) => this._name(a).localeCompare(this._name(b), this._lang)),
    }));
    rooms.sort((a, b) => {
      if (!a.area !== !b.area) return a.area ? -1 : 1;
      if (order) return order.indexOf(a.area) - order.indexOf(b.area);
      return level(a.area) - level(b.area) || a.name.localeCompare(b.name, this._lang);
    });
    return rooms;
  }

  _scenes() {
    const c = this._config, hass = this._hass;
    if (!c.show_scenes) return [];
    let ids = c.scenes.length ? c.scenes.filter((id) => hass.states[id])
      : Object.keys(hass.states).filter((id) => id.startsWith("scene.") && this._visible(id));
    if (!c.scenes.length && c.areas.length) {
      const only = new Set(c.areas);
      const inArea = ids.filter((id) => only.has(this._areaOf(id)));
      if (inArea.length) ids = inArea;
    }
    if (!c.scenes.length) ids.sort((a, b) => (hass.states[a].attributes.friendly_name || a).localeCompare(hass.states[b].attributes.friendly_name || b, this._lang));
    return ids.slice(0, Math.max(1, Number(c.max_scenes) || 8));
  }

  /* ---------------------------------------------------------- affichage */

  _themeClass() {
    const light = this._hass?.themes?.darkMode === false, th = this._config.theme;
    if (th === "ha") return `th-ha${light ? " light" : ""}`;
    if (th === "auto" && light) return "light";
    return "";
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot || this._dragging) return;
    const T = this._t(), c = this._config;
    const rooms = this._rooms();
    const scenes = this._scenes();
    const ids = rooms.flatMap((r) => r.ids);
    const sig = JSON.stringify([c, this._lang, this._hass.themes?.darkMode, [...this._open], [...this._collapsed],
      ids.map((id) => { const s = this._hass.states[id]; return [id, s.state, s.attributes.brightness, s.attributes.rgb_color, s.attributes.color_temp_kelvin, s.attributes.color_mode]; }),
      scenes.map((id) => [id, this._hass.states[id]?.attributes?.friendly_name])]);
    if (sig === this._sig) return;
    this._sig = sig;

    const lit = ids.filter((id) => this._hass.states[id].state === "on");
    // sans en-tête (show_header: false) : une ligne discrète, pour une carte posée sous une autre
    const head = c.show_header === false ? `<div class="mini"><span>${esc(lit.length ? this._fmt("n_on", { n: lit.length }) : T.none_on)}</span>
      ${lit.length ? `<button class="lc-off" data-act="off" data-ids="${esc(JSON.stringify(lit))}"><ha-icon icon="mdi:lightbulb-group-off-outline"></ha-icon>${esc(T.all_off)}</button>` : ""}</div>` : `<header>
      <div class="brand"><span class="logo${lit.length ? " on" : ""}"><ha-icon icon="${esc(c.icon || DEFAULTS.icon)}"></ha-icon></span>
        <div><div class="title">${esc(c.title || T.title)}</div>
        <div class="sub">${esc(lit.length ? this._fmt("n_on", { n: lit.length }) : T.none_on)}</div></div></div>
      ${lit.length ? `<button class="lc-off" data-act="off" data-ids="${esc(JSON.stringify(lit))}"><ha-icon icon="mdi:lightbulb-group-off-outline"></ha-icon>${esc(T.all_off)}</button>` : ""}
    </header>`;

    let body;
    if (!ids.length) {
      body = `<div class="empty"><b>${esc(T.none)}</b><span>${esc(T.none_hint)}</span></div>`;
    } else {
      // une seule pièce : pas de cadre de pièce, le titre de la carte suffit
      const filled = rooms.filter((r) => c.show_off || r.ids.some((id) => this._hass.states[id].state === "on"));
      body = filled.length === 1 ? this._room(filled[0], true) : rooms.map((r) => this._room(r)).filter(Boolean).join("");
    }
    const sc = scenes.length ? `<div class="lc-scenes" role="group" aria-label="${esc(T.scenes)}">${scenes.map((id) => {
      const s = this._hass.states[id];
      return `<button class="lc-scene" data-act="scene" data-id="${esc(id)}"><ha-icon icon="${esc(s.attributes.icon || "mdi:palette-outline")}"></ha-icon>${esc(s.attributes.friendly_name || id)}</button>`;
    }).join("")}</div>` : "";

    this.shadowRoot.innerHTML = `${STYLE}<ha-card class="${this._themeClass()}">${head}${sc}<div class="lc-rooms">${body}</div></ha-card>`;
    for (const r of this.shadowRoot.querySelectorAll("input[type=range]")) r.style.setProperty("--p", `${this._pct(r)}%`);
  }

  _room(r, solo = false) {
    const T = this._t(), c = this._config;
    const on = r.ids.filter((id) => this._hass.states[id].state === "on");
    const shown = c.show_off ? r.ids : on;
    const key = r.area || "_other";
    if (!shown.length && !c.show_off) return "";
    if (solo) {
      return c.layout === "buttons"
        ? `<div class="lc-grid lc-solo">${shown.map((id) => this._tile(id)).join("")}</div>`
        : `<div class="lc-list lc-solo">${shown.map((id) => this._light(id)).join("")}</div>`;
    }
    const closed = this._collapsed.has(key);
    return `<section class="lc-room${on.length ? " on" : ""}">
      <div class="lc-rh">
        <div class="lc-rt" data-act="room" data-id="${esc(key)}" role="button" tabindex="0" aria-expanded="${!closed}" title="${esc(T.collapse)}">
          <ha-icon icon="${esc(r.icon)}"></ha-icon><b>${esc(r.name)}</b>
          <span class="lc-count">${esc(this._fmt("room_count", { on: on.length, n: r.ids.length }))}</span>
          <ha-icon class="lc-chev" icon="${closed ? "mdi:chevron-down" : "mdi:chevron-up"}"></ha-icon>
        </div>
        ${on.length ? `<button class="lc-roff" data-act="off" data-ids="${esc(JSON.stringify(on))}">${esc(T.room_off)}</button>` : ""}
      </div>
      ${closed ? "" : c.layout === "buttons"
        ? `<div class="lc-grid">${shown.map((id) => this._tile(id)).join("")}</div>`
        : `<div class="lc-list">${shown.map((id) => this._light(id)).join("")}</div>`}
    </section>`;
  }

  /** Affichage « boutons » : un appui allume ou éteint, un appui long ouvre la fiche (luminosité, couleur). */
  _tile(id) {
    const T = this._t();
    const s = this._hass.states[id], a = s.attributes || {};
    const on = s.state === "on", off = s.state === "off";
    const dimmable = (a.supported_color_modes || []).some((m) => DIMMABLE.has(m));
    const pct = on && a.brightness != null ? Math.max(1, Math.round((a.brightness / 255) * 100)) : 100;
    const tint = on ? (a.color_mode === "color_temp" && a.color_temp_kelvin ? kelvinCss(a.color_temp_kelvin) : rgbCss(a.rgb_color) || "#f7c948") : null;
    const state = on ? (dimmable ? `${pct} %` : T.on) : off ? T.off : T.unavailable;
    const icon = a.icon || (on ? "mdi:lightbulb-on" : "mdi:lightbulb-outline");
    const act = on || off ? ` data-act="toggle" data-id="${esc(id)}" role="switch" aria-checked="${on}" tabindex="0"` : "";
    return `<div class="lc-bt lc-light${on ? " on" : ""}${on || off ? "" : " na"}"${tint ? ` style="--tint:${tint}"` : ""}${act} data-hold="${esc(id)}" title="${esc(T.hold)}">
      <ha-icon icon="${esc(icon)}"></ha-icon>
      <b>${esc(this._name(id))}</b>
      <span>${esc(state)}</span>
      ${on && dimmable ? `<input class="lc-bt-r" type="range" min="1" max="100" step="1" value="${pct}" data-kind="bri" data-id="${esc(id)}" aria-label="${esc(T.brightness)}">` : ""}
    </div>`;
  }

  _light(id) {
    const T = this._t();
    const s = this._hass.states[id], a = s.attributes || {};
    const on = s.state === "on", off = s.state === "off";
    const modes = a.supported_color_modes || [];
    const dimmable = modes.some((m) => DIMMABLE.has(m));
    const temp = modes.includes("color_temp");
    const color = modes.some((m) => COLOR.has(m));
    const pct = on && a.brightness != null ? Math.max(1, Math.round((a.brightness / 255) * 100)) : on ? 100 : 0;
    const tint = on ? (a.color_mode === "color_temp" && a.color_temp_kelvin ? kelvinCss(a.color_temp_kelvin) : rgbCss(a.rgb_color) || "#f7c948") : null;
    const state = on ? (dimmable ? `${pct} %` : T.on) : off ? T.off : T.unavailable;
    const open = this._open.has(id) && on && (temp || color);
    const icon = a.icon || (on ? "mdi:lightbulb-on" : "mdi:lightbulb-outline");
    const kmin = Number(a.min_color_temp_kelvin) || 2000, kmax = Number(a.max_color_temp_kelvin) || 6500;
    const kval = clamp(Number(a.color_temp_kelvin) || Math.round((kmin + kmax) / 2), kmin, kmax);

    const details = open ? `<div class="lc-more">
      ${temp ? `<div class="lc-slider ct"><span>${esc(T.warm)}</span>
        <input type="range" min="${kmin}" max="${kmax}" step="50" value="${kval}" data-kind="ct" data-id="${esc(id)}" aria-label="${esc(T.white)}"
          style="--k1:${kelvinCss(kmin)};--k2:${kelvinCss(kmax)}"><span>${esc(T.cold)}</span></div>` : ""}
      ${color ? `<div class="lc-sw" role="group" aria-label="${esc(T.color)}">${SWATCHES.map((rgb) =>
        `<button class="lc-dot" data-act="rgb" data-id="${esc(id)}" data-rgb="${esc(JSON.stringify(rgb))}" style="background:${rgbCss(rgb)}" aria-label="${esc(T.color)} ${rgb.join(",")}"></button>`).join("")}</div>` : ""}
      <button class="lc-link" data-act="info" data-id="${esc(id)}"><ha-icon icon="mdi:tune-variant"></ha-icon>${esc(T.more)}</button>
    </div>` : "";

    return `<div class="lc-light${on ? " on" : ""}${off || on ? "" : " na"}"${tint ? ` style="--tint:${tint}"` : ""}>
      <div class="lc-row">
        <button class="lc-bulb" data-act="toggle" data-id="${esc(id)}" aria-label="${esc(T.toggle)}" ${on || off ? "" : "disabled"}><ha-icon icon="${esc(icon)}"></ha-icon></button>
        <div class="lc-name" data-act="${on && (temp || color) ? "open" : "info"}" data-id="${esc(id)}" role="button" tabindex="0"
          title="${esc(on && (temp || color) ? T.details : T.more)}">
          <b>${esc(this._name(id))}</b><span>${esc(state)}</span>
        </div>
        ${on && (temp || color) ? `<button class="lc-tune${open ? " open" : ""}" data-act="open" data-id="${esc(id)}" aria-label="${esc(T.details)}" aria-expanded="${open}"><ha-icon icon="mdi:palette-outline"></ha-icon></button>` : ""}
        <button class="lc-sw-t${on ? " on" : ""}" data-act="toggle" data-id="${esc(id)}" role="switch" aria-checked="${on}" aria-label="${esc(T.toggle)}" ${on || off ? "" : "disabled"}><i></i></button>
      </div>
      ${on && dimmable ? `<div class="lc-slider bri"><ha-icon icon="mdi:brightness-6"></ha-icon>
        <input type="range" min="1" max="100" step="1" value="${pct}" data-kind="bri" data-id="${esc(id)}" aria-label="${esc(T.brightness)}">
        <output>${pct} %</output></div>` : ""}
      ${details}
    </div>`;
  }
}

const STYLE = `<style>
:host {
  --med-bg: #1a2434; --med-surface: #212d40; --med-line: #2f3d55; --med-text: #e7edf5; --med-muted: #8fa0b8;
  --med-accent: #1d93e3; --med-on-accent: #fff; --lc-warm: #f7c948; --lc-red: #ee4a4a;
}
ha-card { display: block; background: var(--med-bg); color: var(--med-text); border: 1px solid var(--med-line); border-radius: 18px;
  overflow: hidden; padding-bottom: 12px; container-type: inline-size; }
ha-card.light { --med-bg: #f4f6fa; --med-surface: #e8edf4; --med-line: #d3dbe6; --med-text: #1a2434; --med-muted: #5b6b82; --med-accent: #1673b8; --lc-warm: #b37a00; }
ha-card.th-ha { --med-bg: var(--ha-card-background, var(--card-background-color)); --med-surface: color-mix(in srgb, var(--primary-text-color, #000) 6%, transparent);
  --med-line: var(--divider-color, rgba(127,127,127,.25)); --med-text: var(--primary-text-color); --med-muted: var(--secondary-text-color);
  --med-accent: var(--primary-color, #1d93e3); --med-on-accent: var(--text-primary-color, #fff); border-radius: var(--ha-card-border-radius, 12px); }
header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px 8px; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.logo { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 11px; background: var(--med-surface); flex: none; }
.logo ha-icon { --mdc-icon-size: 22px; color: var(--med-muted); }
.logo.on { background: color-mix(in srgb, var(--lc-warm) 20%, transparent); }
.logo.on ha-icon { color: var(--lc-warm); }
.title { font-size: 1.12rem; font-weight: 700; }
.mini { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 30px; padding: 10px 14px 8px; font-size: .78rem; color: var(--med-muted); }
.mini .lc-off { padding: 4px 10px; font-size: .76rem; }
.sub { font-size: .78rem; color: var(--med-muted); }
button { font: inherit; color: inherit; cursor: pointer; }
button:focus-visible, [role=button]:focus-visible, input:focus-visible { outline: 2px solid var(--med-accent); outline-offset: 2px; }
.lc-off, .lc-roff { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; border: 1px solid var(--med-line);
  background: var(--med-surface); padding: 6px 12px; font-size: .8rem; font-weight: 600; }
.lc-off ha-icon { --mdc-icon-size: 17px; color: var(--lc-warm); }
.lc-off:hover, .lc-roff:hover { border-color: var(--lc-warm); }
.lc-roff { padding: 3px 10px; font-size: .74rem; font-weight: 500; }
.lc-scenes { display: flex; flex-wrap: wrap; gap: 6px; padding: 2px 12px 8px; }
.lc-scene { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; border-radius: 999px; border: 1px solid var(--med-line);
  background: var(--med-surface); padding: 6px 12px; font-size: .8rem; transition: background .2s, border-color .2s; }
.lc-scene ha-icon { --mdc-icon-size: 16px; color: var(--med-accent); }
.lc-scene:hover { border-color: var(--med-accent); }
.lc-scene.lc-done { background: var(--med-accent); border-color: var(--med-accent); color: var(--med-on-accent); }
.lc-scene.lc-done ha-icon { color: var(--med-on-accent); }
.lc-rooms { display: flex; flex-direction: column; gap: 10px; padding: 0 12px; }
.lc-room { border: 1px solid var(--med-line); border-radius: 14px; padding: 8px; }
.lc-room.on { border-color: color-mix(in srgb, var(--lc-warm) 35%, var(--med-line)); }
.lc-rh { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 2px 0 4px; }
.lc-rt { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; cursor: pointer; padding: 4px 0; border-radius: 8px; }
.lc-rt > ha-icon { --mdc-icon-size: 18px; color: var(--med-muted); }
.lc-room.on .lc-rt > ha-icon:first-child { color: var(--lc-warm); }
.lc-rt b { font-size: .92rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lc-count { font-size: .74rem; color: var(--med-muted); }
.lc-chev { --mdc-icon-size: 18px; color: var(--med-muted); margin-left: auto; }
.lc-list { display: grid; grid-template-columns: 1fr; gap: 6px; margin-top: 6px; align-items: start; }
@container (min-width: 560px) { .lc-list { grid-template-columns: 1fr 1fr; } }
.lc-light { background: var(--med-surface); border-radius: 12px; padding: 8px 10px; border: 1px solid transparent; min-width: 0;
  /* --ink : couleur de la lumière pour l'icône et le curseur ; assombrie en thème clair pour rester visible (blanc froid) */
  --ink: var(--tint, var(--lc-warm)); }
ha-card.light .lc-light, ha-card.th-ha.light .lc-light { --ink: color-mix(in srgb, var(--tint, var(--lc-warm)) 62%, #4a3b12); }
.lc-light.on { border-color: color-mix(in srgb, var(--tint, var(--lc-warm)) 45%, transparent);
  background: color-mix(in srgb, var(--tint, var(--lc-warm)) 9%, var(--med-surface)); }
.lc-light.na { opacity: .55; }
.lc-row { display: flex; align-items: center; gap: 10px; min-width: 0; }
.lc-bulb { width: 38px; height: 38px; border-radius: 50%; border: 0; display: grid; place-items: center; flex: none;
  background: color-mix(in srgb, var(--med-text) 8%, transparent); }
.lc-bulb ha-icon { --mdc-icon-size: 21px; color: var(--med-muted); }
.lc-light.on .lc-bulb { background: color-mix(in srgb, var(--tint, var(--lc-warm)) 28%, transparent); }
.lc-light.on .lc-bulb ha-icon { color: var(--ink); filter: drop-shadow(0 0 6px color-mix(in srgb, var(--tint, var(--lc-warm)) 60%, transparent)); }
ha-card.light .lc-light.on .lc-bulb ha-icon, ha-card.th-ha.light .lc-light.on .lc-bulb ha-icon { filter: none; }
.lc-name { flex: 1; min-width: 0; display: flex; flex-direction: column; cursor: pointer; border-radius: 8px; }
.lc-name b { font-size: .88rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lc-name span { font-size: .74rem; color: var(--med-muted); }
.lc-tune { width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--med-line); background: none; display: grid; place-items: center; flex: none; }
.lc-tune ha-icon { --mdc-icon-size: 17px; color: var(--med-muted); }
.lc-tune.open { border-color: var(--ink, var(--med-accent)); }
.lc-tune.open ha-icon { color: var(--ink, var(--med-accent)); }
.lc-sw-t { width: 42px; height: 24px; border-radius: 12px; border: 0; padding: 0; position: relative; flex: none;
  background: color-mix(in srgb, var(--med-text) 18%, transparent); transition: background .2s; }
.lc-sw-t i { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
.lc-sw-t.on { background: var(--med-accent); }
.lc-sw-t.on i { transform: translateX(18px); }
.lc-sw-t:disabled, .lc-bulb:disabled { cursor: default; }
.lc-slider { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: .74rem; color: var(--med-muted); }
.lc-slider ha-icon { --mdc-icon-size: 16px; color: var(--med-muted); flex: none; }
.lc-slider output { min-width: 42px; text-align: right; font-variant-numeric: tabular-nums; color: var(--med-text); font-weight: 600; }
input[type=range] { -webkit-appearance: none; appearance: none; flex: 1; min-width: 0; height: 22px; background: none; margin: 0; cursor: pointer; }
input[type=range]::-webkit-slider-runnable-track { height: 8px; border-radius: 5px;
  background: linear-gradient(90deg, var(--ink, var(--lc-warm)) var(--p, 50%), color-mix(in srgb, var(--med-text) 15%, transparent) var(--p, 50%)); }
input[type=range]::-moz-range-track { height: 8px; border-radius: 5px; background: color-mix(in srgb, var(--med-text) 15%, transparent); }
input[type=range]::-moz-range-progress { height: 8px; border-radius: 5px; background: var(--ink, var(--lc-warm)); }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; margin-top: -5px;
  border: 2px solid var(--ink, var(--lc-warm)); box-shadow: 0 1px 3px rgba(0,0,0,.35); }
input[type=range]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid var(--ink, var(--lc-warm)); }
.lc-slider.ct input[type=range]::-webkit-slider-runnable-track { background: linear-gradient(90deg, var(--k1), var(--k2)); }
.lc-slider.ct input[type=range]::-moz-range-track { background: linear-gradient(90deg, var(--k1), var(--k2)); }
.lc-slider.ct input[type=range]::-moz-range-progress { background: transparent; }
.lc-slider.ct input[type=range]::-webkit-slider-thumb { border-color: var(--med-muted); }
.lc-more { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; padding-top: 6px; border-top: 1px dashed var(--med-line); }
.lc-sw { display: flex; flex-wrap: wrap; gap: 8px; }
.lc-dot { width: 26px; height: 26px; border-radius: 50%; border: 2px solid color-mix(in srgb, var(--med-text) 25%, transparent); padding: 0; }
.lc-dot:hover { transform: scale(1.1); }
.lc-link { align-self: flex-start; display: inline-flex; align-items: center; gap: 5px; background: none; border: 0; padding: 2px 0; font-size: .78rem; color: var(--med-accent); }
.lc-link ha-icon { --mdc-icon-size: 16px; }
.empty { display: flex; flex-direction: column; gap: 6px; padding: 8px 4px 4px; font-size: .88rem; }
.empty span { color: var(--med-muted); }
.lc-solo { margin-top: 0; }
.lc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; margin-top: 6px; }
.lc-bt { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; min-height: 96px;
  padding: 12px 8px; border-radius: 14px; border: 1px solid var(--med-line); cursor: pointer; user-select: none; -webkit-user-select: none;
  -webkit-touch-callout: none; transition: border-color .2s, background .2s; }
.lc-bt:hover { border-color: color-mix(in srgb, var(--ink, var(--lc-warm)) 50%, var(--med-line)); }
.lc-bt:focus-visible { outline: 2px solid var(--med-accent); outline-offset: 2px; }
.lc-bt ha-icon { --mdc-icon-size: 26px; color: var(--med-muted); }
.lc-bt b { font-size: .84rem; font-weight: 600; line-height: 1.2; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.lc-bt span { font-size: .78rem; color: var(--med-muted); font-weight: 600; }
.lc-bt.on ha-icon { color: var(--ink); filter: drop-shadow(0 0 6px color-mix(in srgb, var(--tint, var(--lc-warm)) 60%, transparent)); }
ha-card.light .lc-bt.on ha-icon, ha-card.th-ha.light .lc-bt.on ha-icon { filter: none; }
.lc-bt.on span { color: var(--ink); }
.lc-bt.na { cursor: default; }
.lc-bt .lc-bt-r { width: 100%; flex: none; margin-top: 2px; touch-action: pan-y; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>`;

if (!customElements.get("lumieres-card")) customElements.define("lumieres-card", LumieresCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "lumieres-card")) {
  window.customCards.push({
    type: "lumieres-card",
    name: "Lumières",
    description: "Lumières par pièce : marche / arrêt, luminosité, blanc, couleurs, scènes et tout éteindre (style MyElectricalData).",
    preview: true,
    documentationURL: "https://github.com/Marlboro62/lumieres-card",
  });
}
console.info(`%c LUMIERES-CARD %c ${CARD_VERSION} `, "background:#f7c948;color:#1a2434;font-weight:700", "background:#1d93e3;color:#fff");
})();
