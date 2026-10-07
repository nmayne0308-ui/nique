"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  kids.forEach(k => n.append(k));
  return n;
};

// ---------- state ----------
const KEY = "hurricane-ready-v1";
const defaults = () => ({
  checks: {}, settings: { people: 1, pets: 0 }, supplies: null,
  alerts: { items: [], fetchedAt: null, seen: [] }, notified: {}
});
let state = defaults();
try { state = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY))); } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

let phase = "before";

// ---------- helpers ----------
const landfall = () => state.settings.landfall ? new Date(state.settings.landfall) : null;
const hoursLeft = () => { const l = landfall(); return l ? (l - Date.now()) / 36e5 : null; };
const uid = () => Math.random().toString(36).slice(2, 10);

function fmtLeft(h) {
  if (h <= 0) return "Storm expected now or already here";
  const d = Math.floor(h / 24), hh = Math.floor(h % 24), m = Math.floor((h * 60) % 60);
  return `${d ? d + "d " : ""}${hh}h ${m}m until expected arrival`;
}

function seedSupplies() {
  const { people = 1 } = state.settings;
  state.supplies = DEFAULT_SUPPLIES.map(s => ({
    id: uid(), name: s.name, kit: s.kit, auto: true, per: s.per, base: s.base,
    need: Math.max(1, s.per * people + s.base), have: 0, expires: ""
  }));
  save();
}

// ---------- countdown ----------
function renderCountdown() {
  const h = hoursLeft();
  $("#countdown").textContent = h === null ? "Set your storm arrival time in Plan to start the countdown" : fmtLeft(h);
  renderDue();
  checkReminders(h);
}

function dueItems() {
  const h = hoursLeft();
  if (h === null) return [];
  return CHECKLIST.before.filter(i => i.h !== null && h <= i.h && !state.checks[i.id]);
}

function renderDue() {
  const box = $("#due");
  const due = dueItems();
  box.hidden = phase !== "before" || !due.length;
  if (!box.hidden) box.textContent = `${due.length} item${due.length === 1 ? "" : "s"} should be done by now (highlighted below).`;
}

function notify(title, body, tag) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try { new Notification(title, { body, tag, icon: "icon.svg" }); } catch {}
}

// Reminders fire only while the app is open: browsers can't schedule
// notifications reliably in a closed PWA without a push server.
function checkReminders(h) {
  if (h === null) return;
  for (const w of [72, 48, 24, 12]) {
    if (h <= w && h > w - 6 && !state.notified[w]) {
      const n = CHECKLIST.before.filter(i => i.h !== null && i.h >= w && !state.checks[i.id]).length;
      if (n) notify(`${w} hours to go`, `${n} preparation item${n === 1 ? "" : "s"} still open.`, "win-" + w);
      state.notified[w] = true; save();
    }
  }
}

// ---------- checklist ----------
function renderChecklist() {
  const items = CHECKLIST[phase];
  const box = $("#checklist");
  box.replaceChildren();
  const h = hoursLeft();
  const isDue = i => phase === "before" && h !== null && i.h !== null && h <= i.h && !state.checks[i.id];
  const groups = phase === "before"
    ? [["Do ahead of any storm", i => i.h === null], ["72–96 hours out", i => i.h >= 72],
       ["36–48 hours out", i => i.h !== null && i.h < 72 && i.h >= 36], ["Final 24 hours", i => i.h !== null && i.h < 36]]
    : [["", () => true]];
  for (const [label, test] of groups) {
    const sub = items.filter(test);
    if (!sub.length) continue;
    if (label) box.append(el("div", { className: "group" }, label));
    for (const i of sub) {
      const cb = el("input", { type: "checkbox", checked: !!state.checks[i.id], id: i.id });
      cb.onchange = () => { state.checks[i.id] = cb.checked; save(); renderChecklist(); renderDue(); };
      const row = el("label", { className: "item" + (cb.checked ? " done" : "") + (isDue(i) ? " due" : "") },
        cb, el("span", {}, i.t));
      box.append(row);
    }
  }
  const done = items.filter(i => state.checks[i.id]).length;
  $("#progress div").style.width = (100 * done / items.length) + "%";
  renderDue();
}

// ---------- supplies ----------
function renderSupplies() {
  if (!state.supplies) seedSupplies();
  const box = $("#supplies");
  box.replaceChildren();
  const soon = [];
  for (const [kit, label] of [["go", "Go-Kit (3+ days)"], ["home", "Stay-at-Home Kit (2+ weeks)"]]) {
    box.append(el("div", { className: "group" }, label));
    for (const s of state.supplies.filter(s => s.kit === kit)) {
      const complete = s.have >= s.need;
      const haveIn = el("input", { type: "number", min: 0, value: s.have, ariaLabel: `Have: ${s.name}` });
      haveIn.onchange = () => { s.have = Math.max(0, +haveIn.value || 0); save(); renderSupplies(); };
      const exp = el("input", { type: "date", value: s.expires, ariaLabel: `Expiry: ${s.name}` });
      exp.onchange = () => { s.expires = exp.value; save(); renderSupplies(); };
      exp.style.cssText = "min-height:36px;padding:4px 6px;margin-top:4px";
      const days = s.expires ? (new Date(s.expires) - Date.now()) / 864e5 : null;
      if (days !== null && days < 60) soon.push(`${s.name} (${days < 0 ? "expired" : "expires " + s.expires})`);
      const del = el("button", { textContent: "×", ariaLabel: `Remove ${s.name}`, title: "Remove" });
      del.onclick = () => { state.supplies = state.supplies.filter(x => x !== s); save(); renderSupplies(); };
      del.style.cssText = "min-height:36px;padding:0 10px";
      box.append(el("div", { className: "item" + (complete ? " done" : " low") },
        el("div", { style: "flex:1" }, el("span", {}, s.name), el("span", { className: "exp" }, "Expiry: ", exp)),
        el("div", { className: "qty" }, haveIn, `/ ${s.need}`, del)));
    }
  }
  const e = $("#expiring");
  e.hidden = !soon.length;
  e.textContent = soon.length ? "Expiring within 60 days: " + soon.join("; ") : "";
}

$("#add-supply").onsubmit = ev => {
  ev.preventDefault();
  const f = new FormData(ev.target);
  state.supplies.push({ id: uid(), name: f.get("name").trim(), kit: f.get("kit"), auto: false,
    need: Math.max(1, +f.get("qty") || 1), have: 0, expires: "" });
  save(); ev.target.reset(); renderSupplies();
};

// ---------- plan ----------
function loadPlan() {
  const f = $("#plan");
  for (const [k, v] of Object.entries(state.settings)) if (f.elements[k]) f.elements[k].value = v;
}

$("#plan").addEventListener("change", ev => {
  const f = ev.currentTarget;
  const prevPeople = state.settings.people;
  for (const e of f.elements) if (e.name) state.settings[e.name] = e.type === "number" ? +e.value : e.value;
  if (e_changed(ev, "landfall")) state.notified = {};
  if (state.settings.people !== prevPeople && state.supplies) {
    // rescale only the quantities the app generated; leave manual edits alone
    for (const s of state.supplies) if (s.auto) s.need = Math.max(1, s.per * state.settings.people + s.base);
  }
  save(); renderCountdown(); renderChecklist(); renderSupplies(); fetchAlerts();
});
const e_changed = (ev, name) => ev.target.name === name;

$("#locate").onclick = () => {
  const btn = $("#locate");
  if (!navigator.geolocation) { btn.textContent = "Geolocation unavailable: enter coordinates"; return; }
  btn.textContent = "Locating…";
  navigator.geolocation.getCurrentPosition(p => {
    const f = $("#plan");
    f.elements.lat.value = state.settings.lat = p.coords.latitude.toFixed(4);
    f.elements.lon.value = state.settings.lon = p.coords.longitude.toFixed(4);
    save(); btn.textContent = "Use my location"; fetchAlerts();
  }, () => { btn.textContent = "Location denied: enter coordinates"; });
};

$("#reset").onclick = () => {
  if (confirm("Clear all checklist ticks? Supplies and plan details are kept.")) {
    state.checks = {}; state.notified = {}; save(); renderChecklist();
  }
};

$("#print").onclick = () => {
  const s = state.settings;
  const line = (k, v) => v ? `${k}: ${v}\n` : "";
  let out = "HURRICANE PLAN\n\n";
  out += line("Household", `${s.people || 1} people, ${s.pets || 0} pets`);
  out += line("Expected arrival", s.landfall && new Date(s.landfall).toLocaleString());
  out += line("Evacuate to", s.evacTo) + line("Route", s.evacRoute) + line("Out-of-area contact", s.contact);
  out += line("Medications", s.meds) + line("Support team", s.support) + line("Notes", s.notes);
  out += "\nEmergencies: 911   Disaster Distress Helpline: 1-800-985-5990\n";
  out += "\nOPEN CHECKLIST ITEMS\n";
  for (const ph of ["before", "during", "after"])
    out += `\n${ph.toUpperCase()}\n` + CHECKLIST[ph].filter(i => !state.checks[i.id]).map(i => `[ ] ${i.t}`).join("\n") + "\n";
  out += "\nSUPPLIES STILL NEEDED\n" + (state.supplies || []).filter(x => x.have < x.need)
    .map(x => `[ ] ${x.kit === "go" ? "Go" : "Home"}: ${x.name} (${x.have}/${x.need})`).join("\n") + "\n";
  const p = $("#printout"); p.hidden = false; p.textContent = out;
  window.print();
};

// ---------- alerts ----------
const RELEVANT = /hurricane|tropical|storm surge|flood|extreme wind|tornado|high wind/i;
let alertTimer;

function renderAlerts() {
  const { items, fetchedAt } = state.alerts;
  const box = $("#alerts"); box.replaceChildren();
  const status = $("#alert-status");
  if (!state.settings.lat || !state.settings.lon) {
    status.textContent = "Add your location in Plan to get alerts.";
  } else if (fetchedAt) {
    status.textContent = `${navigator.onLine ? "Updated" : "Offline. Showing last update from"} ${new Date(fetchedAt).toLocaleString()}`;
  }
  if (fetchedAt && !items.length) box.append(el("p", {}, "No active hurricane, flood or wind alerts for your location."));
  for (const a of items) {
    const sev = /warning/i.test(a.event) ? "warning" : /watch/i.test(a.event) ? "watch" : "";
    box.append(el("div", { className: "alert " + sev },
      el("h3", {}, a.event), el("div", { className: "note" }, a.area || ""),
      el("p", {}, a.headline || ""), el("p", {}, a.instruction || "")));
  }
  const b = $("#badge");
  b.hidden = !items.length; b.textContent = items.length;
}

async function fetchAlerts() {
  clearTimeout(alertTimer);
  alertTimer = setTimeout(fetchAlerts, 5 * 60 * 1000);
  const { lat, lon } = state.settings;
  if (!lat || !lon || !navigator.onLine) return renderAlerts();
  try {
    const r = await fetch(`https://api.weather.gov/alerts/active?point=${encodeURIComponent(lat)},${encodeURIComponent(lon)}`,
      { headers: { Accept: "application/geo+json" } });
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    const items = j.features.map(f => ({ id: f.id, event: f.properties.event, area: f.properties.areaDesc,
      headline: f.properties.headline, instruction: f.properties.instruction })).filter(a => RELEVANT.test(a.event));
    for (const a of items) if (!state.alerts.seen.includes(a.id)) {
      notify(a.event, a.headline || a.area, a.id);
      state.alerts.seen.push(a.id);
    }
    state.alerts.seen = state.alerts.seen.slice(-50);
    state.alerts.items = items; state.alerts.fetchedAt = Date.now(); save();
  } catch {
    $("#alert-status").textContent = "Couldn't reach the weather service. Showing last known alerts.";
  }
  renderAlerts();
}

$("#refresh").onclick = fetchAlerts;
$("#notify").onclick = async () => {
  if (!("Notification" in window)) return alert("Notifications aren't supported in this browser.");
  const p = await Notification.requestPermission();
  $("#notify").textContent = p === "granted" ? "Notifications on (while app is open)" : "Notifications blocked";
};

// ---------- navigation ----------
$$(".seg button").forEach(b => b.onclick = () => {
  phase = b.dataset.phase;
  $$(".seg button").forEach(x => x.classList.toggle("on", x === b));
  renderChecklist();
});
$$(".tabs button").forEach(b => b.onclick = () => {
  $$(".tabs button").forEach(x => x.classList.toggle("on", x === b));
  $$(".tab").forEach(t => t.hidden = t.id !== "tab-" + b.dataset.tab);
});

// ---------- boot ----------
loadPlan(); renderChecklist(); renderSupplies(); renderAlerts(); renderCountdown();
setInterval(renderCountdown, 30000);
window.addEventListener("online", fetchAlerts);
window.addEventListener("offline", renderAlerts);
fetchAlerts();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
