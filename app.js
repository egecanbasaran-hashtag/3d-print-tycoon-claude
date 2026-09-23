/* =========================================================
   3D PRINT TYCOON — app.js
   Reines Vanilla-JS, kein Framework, kein Backend.
   ========================================================= */

const SAVE_KEY = "3dpt_save_v1";
const TICK_MS = 250;
const AUTOSAVE_MS = 8000;
const ORDER_REFILL_MS = 15000;
const MAX_ORDER_SLOTS = 5;

/* ---------------- Config: Druckertypen ---------------- */
const PRINTER_TYPES = [
  { id: "tier1", name: "Einsteiger-FDM", icon: "🖨️", unlockCost: 0, baseBuyCost: 120, speed: 1.0, quality: 1.0 },
  { id: "tier2", name: "Profi-FDM", icon: "⚙️", unlockCost: 600, baseBuyCost: 450, speed: 1.4, quality: 1.15 },
  { id: "tier3", name: "Harz-Drucker Pro", icon: "🔮", unlockCost: 2200, baseBuyCost: 1400, speed: 1.85, quality: 1.35 },
];

/* ---------------- Config: Produkte ---------------- */
const PRODUCTS = {
  figur:    { name: "Figur",         icon: "🧍", basePrice: 15,  baseDur: 25, diff: 1 },
  vase:     { name: "Vase",          icon: "🏺", basePrice: 24,  baseDur: 35, diff: 1 },
  deko:     { name: "Deko-Objekt",   icon: "🎨", basePrice: 20,  baseDur: 30, diff: 1 },
  teil:     { name: "Ersatzteil",    icon: "🔩", basePrice: 30,  baseDur: 32, diff: 2 },
  litho:    { name: "Lithophanie",   icon: "💡", basePrice: 55,  baseDur: 55, diff: 2 },
  stadt:    { name: "Stadtmodell",   icon: "🏙️", basePrice: 85,  baseDur: 75, diff: 3 },
  sonder:   { name: "Sonderauftrag", icon: "✨", basePrice: 160, baseDur: 95, diff: 4 },
};

/* ---------------- Config: Auftragsvorlagen (>=10) ---------------- */
const ORDER_TEMPLATES = [
  { product: "figur", label: "Mini-Figur",            qty: 1 },
  { product: "figur", label: "Figuren-Set (3x)",       qty: 3, mult: 2.6 },
  { product: "vase",  label: "Deko-Vase",              qty: 1 },
  { product: "vase",  label: "Designer-Vase XL",       qty: 1, mult: 1.8 },
  { product: "deko",  label: "Wohnzimmer-Deko",        qty: 1 },
  { product: "deko",  label: "Deko-Set Herbst",        qty: 2, mult: 1.7 },
  { product: "teil",  label: "Ersatzteil (Standard)",  qty: 1 },
  { product: "teil",  label: "Ersatzteil (Express)",   qty: 1, mult: 1.4, rush: true },
  { product: "litho", label: "Lithophanie-Lampenschirm", qty: 1 },
  { product: "litho", label: "Lithophanie Nachtlicht", qty: 1, mult: 0.8 },
  { product: "stadt", label: "Stadtmodell Viertel",    qty: 1 },
  { product: "stadt", label: "Stadtmodell Großauftrag", qty: 1, mult: 1.9 },
  { product: "sonder", label: "Sonderauftrag: Prototyp", qty: 1, rare: true },
  { product: "sonder", label: "Sonderauftrag: Messemodell", qty: 1, mult: 1.6, rare: true },
];

const CUSTOMERS = ["Familie Müller", "Café Nova", "Architekturbüro Klein", "Sammler Tom", "Deko-Shop Lumen",
  "Ingenieurbüro Voss", "Hobbyist Lea", "Stadtplanung Nord", "Werbeagentur Pixel", "Nachbarin Frau Beck"];

/* ---------------- Config: Shop-Upgrades ---------------- */
const SPEED_LEVELS = 6;      // +8% Geschwindigkeit je Stufe
const MATERIAL_LEVELS = 6;   // +8% Preis je Stufe
const EMPLOYEE_MAX = 5;      // je -5% Druckzeit
const WORKSHOP_MAX_EXPANSIONS = 5; // +1 Drucker-Slot je Stufe

/* ---------------- Achievements ---------------- */
const ACHIEVEMENTS = [
  { id: "first_order", icon: "🥇", title: "Erster Auftrag", desc: "Schließe deinen ersten Auftrag ab", check: s => s.ordersCompleted >= 1, reward: 20 },
  { id: "ten_orders", icon: "📦", title: "Fleißige Hände", desc: "10 Aufträge abgeschlossen", check: s => s.ordersCompleted >= 10, reward: 50 },
  { id: "fifty_orders", icon: "🏭", title: "Produktionsprofi", desc: "50 Aufträge abgeschlossen", check: s => s.ordersCompleted >= 50, reward: 200 },
  { id: "hundred_orders", icon: "🚀", title: "Fabrik-Imperium", desc: "100 Aufträge abgeschlossen", check: s => s.ordersCompleted >= 100, reward: 500 },
  { id: "three_printers", icon: "🖨️", title: "Kleiner Maschinenpark", desc: "3 Drucker besitzen", check: s => s.printers.length >= 3, reward: 60 },
  { id: "tier2_unlocked", icon: "⚙️", title: "Profi-Ausrüstung", desc: "Profi-FDM-Drucker freigeschaltet", check: s => s.unlockedTier2, reward: 100 },
  { id: "tier3_unlocked", icon: "🔮", title: "High-End-Werkstatt", desc: "Harz-Drucker Pro freigeschaltet", check: s => s.unlockedTier3, reward: 300 },
  { id: "level5", icon: "⭐", title: "Aufsteiger", desc: "Level 5 erreichen", check: s => s.level >= 5, reward: 80 },
  { id: "level10", icon: "🌟", title: "Firmenchef", desc: "Level 10 erreichen", check: s => s.level >= 10, reward: 250 },
  { id: "earn1000", icon: "💰", title: "Erste Tausend", desc: "1.000 💰 insgesamt verdient", check: s => s.totalEarned >= 1000, reward: 100 },
  { id: "earn10000", icon: "💎", title: "Großunternehmer", desc: "10.000 💰 insgesamt verdient", check: s => s.totalEarned >= 10000, reward: 400 },
  { id: "employee1", icon: "🧑‍🔧", title: "Erster Mitarbeiter", desc: "Stelle einen Mitarbeiter ein", check: s => s.employees >= 1, reward: 60 },
];

/* ---------------- State ---------------- */
let state = null;
let uid = 1;
const genId = () => "id" + (uid++) + "_" + Date.now().toString(36);

function freshState() {
  return {
    money: 150,
    xp: 0,
    level: 1,
    totalEarned: 0,
    ordersCompleted: 0,
    highscore: 0,
    printers: [
      { id: genId(), tier: "tier1", level: 1, busy: false, orderId: null, startTime: null, duration: null }
    ],
    maxPrinters: 3,
    availableOrders: [],
    unlockedTier2: false,
    unlockedTier3: false,
    speedLevel: 0,
    materialLevel: 0,
    employees: 0,
    workshopExpansions: 0,
    lastDailyClaim: null,
    achievementsUnlocked: [],
    lastOrderSpawn: 0,
    createdAt: Date.now(),
  };
}

/* ---------------- Save / Load ---------------- */
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) { /* Speicher voll o.ä. - Spiel läuft trotzdem weiter */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(freshState(), parsed);
      // defensive: sicherstellen, dass Arrays existieren
      if (!Array.isArray(state.printers) || state.printers.length === 0) {
        state.printers = freshState().printers;
      }
      if (!Array.isArray(state.availableOrders)) state.availableOrders = [];
      if (!Array.isArray(state.achievementsUnlocked)) state.achievementsUnlocked = [];
      return;
    }
  } catch (e) { /* korrupter Speicher -> neu starten */ }
  state = freshState();
}

/* ---------------- Helpers ---------------- */
function fmt(n) { return Math.round(n).toLocaleString("de-DE"); }
function todayStr() { const d = new Date(); return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); }
function xpNeeded(level) { return Math.round(80 * Math.pow(level, 1.45)); }
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1800);
}

function printerType(tierId) { return PRINTER_TYPES.find(p => p.id === tierId); }

function printerSpeedMult(printer) {
  const type = printerType(printer.tier);
  const levelBonus = 1 + (printer.level - 1) * 0.12;
  const globalSpeed = 1 + state.speedLevel * 0.08;
  const employeeBonus = 1 + state.employees * 0.05;
  return type.speed * levelBonus * globalSpeed * employeeBonus;
}

function priceMult() {
  const globalQuality = 1 + state.materialLevel * 0.08;
  return globalQuality;
}

function countOwned(tier) { return state.printers.filter(p => p.tier === tier).length; }

function buyCostForType(tier) {
  const type = printerType(tier);
  const owned = countOwned(tier);
  return Math.round(type.baseBuyCost * Math.pow(1.55, owned));
}

function upgradeCostForPrinter(p) {
  const type = printerType(p.tier);
  return Math.round(type.baseBuyCost * 0.35 * p.level);
}

/* ---------------- Order generation ---------------- */
function makeOrder() {
  const rareTemplates = ORDER_TEMPLATES.filter(t => t.rare);
  const normalTemplates = ORDER_TEMPLATES.filter(t => !t.rare);
  const spawnRare = Math.random() < 0.12;
  const pool = spawnRare ? rareTemplates : normalTemplates;
  const tpl = pool[Math.floor(Math.random() * pool.length)];
  const product = PRODUCTS[tpl.product];
  const variance = 0.85 + Math.random() * 0.3;
  const mult = tpl.mult || 1;
  const price = Math.round(product.basePrice * mult * variance * priceMult());
  const duration = Math.round(product.baseDur * mult * (0.9 + Math.random() * 0.2));
  return {
    id: genId(),
    product: tpl.product,
    label: tpl.label,
    icon: product.icon,
    customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
    price,
    baseDuration: duration,
    diff: product.diff,
    rare: !!tpl.rare,
  };
}

function refillOrders() {
  while (state.availableOrders.length < Math.min(MAX_ORDER_SLOTS, 3 + Math.floor(state.level / 3))) {
    state.availableOrders.push(makeOrder());
  }
}

/* ---------------- Actions ---------------- */
function acceptOrder(orderId, printerId) {
  const order = state.availableOrders.find(o => o.id === orderId);
  const printer = state.printers.find(p => p.id === printerId);
  if (!order || !printer || printer.busy) return;
  const speed = printerSpeedMult(printer);
  const duration = Math.max(4, order.baseDuration / speed);
  printer.busy = true;
  printer.orderId = order.id;
  printer.startTime = Date.now();
  printer.duration = duration * 1000;
  printer.orderData = order;
  state.availableOrders = state.availableOrders.filter(o => o.id !== orderId);
  save();
  renderAll();
}

function collectOrder(printerId) {
  const printer = state.printers.find(p => p.id === printerId);
  if (!printer || !printer.busy) return;
  const elapsed = Date.now() - printer.startTime;
  if (elapsed < printer.duration) return; // noch nicht fertig
  const order = printer.orderData;
  state.money += order.price;
  state.totalEarned += order.price;
  state.ordersCompleted++;
  gainXp(Math.round(order.price * 0.6));
  printer.busy = false;
  printer.orderId = null;
  printer.startTime = null;
  printer.duration = null;
  printer.orderData = null;
  toast("+" + fmt(order.price) + " 💰  Auftrag abgeholt!");
  checkAchievements();
  save();
  renderAll();
}

function gainXp(amount) {
  state.xp += amount;
  let needed = xpNeeded(state.level);
  while (state.xp >= needed) {
    state.xp -= needed;
    state.level++;
    state.money += 25 + state.level * 5;
    toast("🎉 Level " + state.level + " erreicht!");
    needed = xpNeeded(state.level);
  }
}

function buyPrinter() {
  // wähle höchsten freigeschalteten Tier als Standard-Kauf, aber Spieler kauft über Shop-Buttons je Tier
}

function buyPrinterOfTier(tier) {
  if (state.printers.length >= state.maxPrinters) { toast("Werkstatt voll — erweitere sie im Shop!"); return; }
  const cost = buyCostForType(tier);
  if (state.money < cost) { toast("Nicht genug Geld 💸"); return; }
  state.money -= cost;
  state.printers.push({ id: genId(), tier, level: 1, busy: false, orderId: null, startTime: null, duration: null });
  toast("Neuer Drucker gekauft!");
  checkAchievements();
  save();
  renderAll();
}

function upgradePrinter(printerId) {
  const p = state.printers.find(pp => pp.id === printerId);
  if (!p) return;
  const cost = upgradeCostForPrinter(p);
  if (state.money < cost) { toast("Nicht genug Geld 💸"); return; }
  if (p.level >= 5) { toast("Maximalstufe erreicht"); return; }
  state.money -= cost;
  p.level++;
  toast("Drucker auf Stufe " + p.level + " verbessert!");
  save();
  renderAll();
}

function claimDaily() {
  const today = todayStr();
  if (state.lastDailyClaim === today) return;
  const reward = 50 + state.level * 12;
  state.money += reward;
  state.lastDailyClaim = today;
  toast("🎁 Tägliche Belohnung: +" + fmt(reward) + " 💰");
  save();
  renderAll();
}

function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!state.achievementsUnlocked.includes(a.id) && a.check(state)) {
      state.achievementsUnlocked.push(a.id);
      state.money += a.reward;
      toast("🏆 " + a.title + " (+" + a.reward + " 💰)");
    }
  });
}

function companyValue() {
  let v = state.money;
  state.printers.forEach(p => {
    const type = printerType(p.tier);
    v += type.baseBuyCost * 0.5 * p.level;
  });
  v += state.speedLevel * 80 + state.materialLevel * 80 + state.employees * 150 + state.workshopExpansions * 200;
  if (state.unlockedTier2) v += 300;
  if (state.unlockedTier3) v += 1000;
  return v;
}

/* ---------------- Shop upgrade actions ---------------- */
function unlockTier(tier) {
  const type = printerType(tier);
  if (state.money < type.unlockCost) { toast("Nicht genug Geld 💸"); return; }
  state.money -= type.unlockCost;
  if (tier === "tier2") state.unlockedTier2 = true;
  if (tier === "tier3") state.unlockedTier3 = true;
  toast(type.name + " freigeschaltet!");
  checkAchievements();
  save();
  renderAll();
}

function buySpeedUpgrade() {
  if (state.speedLevel >= SPEED_LEVELS) return;
  const cost = Math.round(200 * Math.pow(1.7, state.speedLevel));
  if (state.money < cost) { toast("Nicht genug Geld 💸"); return; }
  state.money -= cost;
  state.speedLevel++;
  toast("Druckgeschwindigkeit erhöht!");
  save();
  renderAll();
}

function buyMaterialUpgrade() {
  if (state.materialLevel >= MATERIAL_LEVELS) return;
  const cost = Math.round(220 * Math.pow(1.7, state.materialLevel));
  if (state.money < cost) { toast("Nicht genug Geld 💸"); return; }
  state.money -= cost;
  state.materialLevel++;
  toast("Bessere Materialien freigeschaltet!");
  save();
  renderAll();
}

function hireEmployee() {
  if (state.employees >= EMPLOYEE_MAX) return;
  const cost = Math.round(300 * Math.pow(1.8, state.employees));
  if (state.money < cost) { toast("Nicht genug Geld 💸"); return; }
  state.money -= cost;
  state.employees++;
  toast("Neuer Mitarbeiter eingestellt!");
  checkAchievements();
  save();
  renderAll();
}

function expandWorkshop() {
  if (state.workshopExpansions >= WORKSHOP_MAX_EXPANSIONS) return;
  const cost = Math.round(400 * Math.pow(1.9, state.workshopExpansions));
  if (state.money < cost) { toast("Nicht genug Geld 💸"); return; }
  state.money -= cost;
  state.workshopExpansions++;
  state.maxPrinters++;
  toast("Werkstatt erweitert! Platz für " + state.maxPrinters + " Drucker.");
  save();
  renderAll();
}

/* ---------------- Rendering ---------------- */
function renderTop() {
  document.getElementById("stat-money").textContent = fmt(state.money);
  document.getElementById("stat-level").textContent = state.level;
  const needed = xpNeeded(state.level);
  document.getElementById("xp-fill").style.width = Math.min(100, (state.xp / needed) * 100) + "%";
  document.getElementById("xp-label").textContent = fmt(state.xp) + " / " + fmt(needed) + " XP";
}

function printerCardHTML(p, opts) {
  const type = printerType(p.tier);
  let statusHTML;
  if (p.busy) {
    const elapsed = Date.now() - p.startTime;
    const pct = Math.min(100, (elapsed / p.duration) * 100);
    const ready = pct >= 100;
    statusHTML = `
      <div class="order-on-printer"><span>${p.orderData.icon} ${p.orderData.label}</span><span>${ready ? "Fertig!" : Math.ceil((p.duration - elapsed) / 1000) + "s"}</span></div>
      <div class="progress-track"><div class="progress-fill ${ready ? "ready" : ""}" style="width:${pct}%"></div></div>
      <div class="printer-actions">
        <button class="btn ${ready ? "btn-accept" : "btn-secondary"}" ${ready ? "" : "disabled"} data-action="collect" data-id="${p.id}">${ready ? "📥 Abholen" : "Druckt…"}</button>
      </div>`;
  } else {
    statusHTML = `<div class="printer-idle">Frei — bereit für einen Auftrag</div>`;
  }
  const upgradeCost = upgradeCostForPrinter(p);
  const upgradeBtn = opts && opts.showUpgrade ? `
      <div class="printer-actions">
        <button class="btn btn-secondary" data-action="upgrade" data-id="${p.id}" ${p.level >= 5 ? "disabled" : ""}>
          ${p.level >= 5 ? "Max. Stufe" : "⬆️ Upgrade (" + fmt(upgradeCost) + " 💰)"}
        </button>
      </div>` : "";
  return `
    <div class="printer-card">
      <div class="printer-card-top">
        <div>
          <div class="printer-name">${type.icon} ${type.name}</div>
          <div class="printer-tier">Geschwindigkeit x${printerSpeedMult(p).toFixed(2)}</div>
        </div>
        <span class="printer-lvl">Stufe ${p.level}</span>
      </div>
      <div class="printer-status">${statusHTML}</div>
      ${upgradeBtn}
    </div>`;
}

function renderDashboard() {
  document.getElementById("mini-printers").textContent = state.printers.length;
  document.getElementById("mini-orders").textContent = state.ordersCompleted;
  const val = companyValue();
  if (val > state.highscore) state.highscore = val;
  document.getElementById("mini-value").textContent = fmt(val);
  document.getElementById("mini-highscore").textContent = fmt(state.highscore);

  const dailyBtn = document.getElementById("daily-btn");
  const claimedToday = state.lastDailyClaim === todayStr();
  dailyBtn.disabled = claimedToday;
  document.getElementById("daily-sub").textContent = claimedToday ? "Schon abgeholt — komm morgen wieder" : "Jetzt abholen";

  document.getElementById("dashboard-printers").innerHTML =
    state.printers.map(p => printerCardHTML(p, { showUpgrade: false })).join("");
}

function renderOrders() {
  refillOrders();
  const freePrinters = state.printers.filter(p => !p.busy);
  const list = document.getElementById("orders-list");
  if (state.availableOrders.length === 0) {
    list.innerHTML = `<div class="empty-hint">Keine Aufträge gerade — schau gleich wieder vorbei.</div>`;
  } else {
    list.innerHTML = state.availableOrders.map(o => {
      const dots = Array.from({ length: 4 }, (_, i) => `<span class="${i < o.diff ? "on" : ""}">●</span>`).join("");
      const printerBtns = state.printers.map(p =>
        `<button class="printer-pick-btn" data-action="accept" data-order="${o.id}" data-printer="${p.id}" ${p.busy ? "disabled" : ""}>
          ${printerType(p.tier).icon} Drucker ${state.printers.indexOf(p) + 1}
        </button>`).join("");
      return `
        <div class="order-card ${o.rare ? "rare" : ""}">
          <div class="order-top">
            <span class="order-name"><span class="order-icon">${o.icon}</span>${o.label}</span>
            <span class="order-price">${fmt(o.price)} 💰</span>
          </div>
          <div class="order-meta">
            <span>👤 ${o.customer}</span>
            <span class="diff-dots">${dots}</span>
            <span>⏱️ ~${Math.round(o.baseDuration)}s</span>
          </div>
          <div class="order-actions">${printerBtns}</div>
        </div>`;
    }).join("");
  }
  document.getElementById("badge-orders").classList.toggle("show", freePrinters.length > 0 && state.availableOrders.length > 0);
  document.getElementById("badge-orders").textContent = state.availableOrders.length;
}

function renderPrinters() {
  document.getElementById("printers-list").innerHTML =
    state.printers.map(p => printerCardHTML(p, { showUpgrade: true })).join("");
  const buyBtn = document.getElementById("buy-printer-btn");
  const full = state.printers.length >= state.maxPrinters;
  buyBtn.disabled = full;
  const cost = buyCostForType("tier1");
  document.getElementById("buy-printer-cost").textContent = full ? "Werkstatt voll" : fmt(cost) + " 💰";
}

function shopRow({ icon, title, desc, costLabel, buyable, action, maxed }) {
  return `
    <div class="shop-card">
      <div class="shop-icon">${icon}</div>
      <div class="shop-info">
        <div class="shop-title">${title}</div>
        <div class="shop-desc">${desc}</div>
      </div>
      <button class="shop-buy ${maxed ? "maxed" : ""}" data-action="${action}" ${buyable ? "" : "disabled"}>${maxed ? "MAX" : costLabel}</button>
    </div>`;
}

function renderShop() {
  const rows = [];

  // Drucker-Tiers freischalten
  PRINTER_TYPES.forEach(type => {
    if (type.id === "tier1") return;
    const unlocked = type.id === "tier2" ? state.unlockedTier2 : state.unlockedTier3;
    rows.push(shopRow({
      icon: type.icon,
      title: type.name + " freischalten",
      desc: "Geschwindigkeit x" + type.speed.toFixed(2) + ", Qualität x" + type.quality.toFixed(2),
      costLabel: fmt(type.unlockCost) + " 💰",
      buyable: !unlocked && state.money >= type.unlockCost,
      action: "unlock_" + type.id,
      maxed: unlocked,
    }));
  });

  // Drucker dieses Tiers kaufen (falls freigeschaltet)
  PRINTER_TYPES.forEach(type => {
    const unlocked = type.id === "tier1" || (type.id === "tier2" ? state.unlockedTier2 : state.unlockedTier3);
    if (!unlocked) return;
    const cost = buyCostForType(type.id);
    const full = state.printers.length >= state.maxPrinters;
    rows.push(shopRow({
      icon: type.icon,
      title: type.name + " kaufen",
      desc: "Weiterer Drucker dieses Typs (" + countOwned(type.id) + " im Besitz)",
      costLabel: fmt(cost) + " 💰",
      buyable: !full && state.money >= cost,
      action: "buyprinter_" + type.id,
      maxed: false,
    }));
  });

  rows.push(shopRow({
    icon: "⚡",
    title: "Schnellere Drucker (Stufe " + state.speedLevel + "/" + SPEED_LEVELS + ")",
    desc: "+8% Druckgeschwindigkeit für alle Drucker",
    costLabel: fmt(Math.round(200 * Math.pow(1.7, state.speedLevel))) + " 💰",
    buyable: state.speedLevel < SPEED_LEVELS && state.money >= Math.round(200 * Math.pow(1.7, state.speedLevel)),
    action: "speed",
    maxed: state.speedLevel >= SPEED_LEVELS,
  }));

  rows.push(shopRow({
    icon: "🧪",
    title: "Bessere Materialien (Stufe " + state.materialLevel + "/" + MATERIAL_LEVELS + ")",
    desc: "+8% Verkaufspreis für alle Aufträge",
    costLabel: fmt(Math.round(220 * Math.pow(1.7, state.materialLevel))) + " 💰",
    buyable: state.materialLevel < MATERIAL_LEVELS && state.money >= Math.round(220 * Math.pow(1.7, state.materialLevel)),
    action: "material",
    maxed: state.materialLevel >= MATERIAL_LEVELS,
  }));

  rows.push(shopRow({
    icon: "🧑‍🔧",
    title: "Mitarbeiter einstellen (" + state.employees + "/" + EMPLOYEE_MAX + ")",
    desc: "+5% Druckgeschwindigkeit pro Mitarbeiter",
    costLabel: fmt(Math.round(300 * Math.pow(1.8, state.employees))) + " 💰",
    buyable: state.employees < EMPLOYEE_MAX && state.money >= Math.round(300 * Math.pow(1.8, state.employees)),
    action: "employee",
    maxed: state.employees >= EMPLOYEE_MAX,
  }));

  rows.push(shopRow({
    icon: "🏗️",
    title: "Werkstatt erweitern (" + state.workshopExpansions + "/" + WORKSHOP_MAX_EXPANSIONS + ")",
    desc: "Platz für einen weiteren Drucker (aktuell max. " + state.maxPrinters + ")",
    costLabel: fmt(Math.round(400 * Math.pow(1.9, state.workshopExpansions))) + " 💰",
    buyable: state.workshopExpansions < WORKSHOP_MAX_EXPANSIONS && state.money >= Math.round(400 * Math.pow(1.9, state.workshopExpansions)),
    action: "expand",
    maxed: state.workshopExpansions >= WORKSHOP_MAX_EXPANSIONS,
  }));

  document.getElementById("shop-list").innerHTML = rows.join("");
}

function renderStats() {
  const rows = [
    ["Geld", fmt(state.money) + " 💰"],
    ["Level", state.level],
    ["Gesamt verdient", fmt(state.totalEarned) + " 💰"],
    ["Aufträge abgeschlossen", state.ordersCompleted],
    ["Drucker im Besitz", state.printers.length],
    ["Mitarbeiter", state.employees],
    ["Unternehmenswert", fmt(companyValue()) + " 💰"],
    ["Bestwert", fmt(state.highscore) + " 💰"],
  ];
  document.getElementById("stats-list").innerHTML = rows.map(([k, v]) =>
    `<div class="stat-row"><span>${k}</span><span>${v}</span></div>`).join("");

  document.getElementById("achievements-list").innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = state.achievementsUnlocked.includes(a.id);
    return `<div class="ach-card ${unlocked ? "unlocked" : ""}">
      <div class="ach-icon">${unlocked ? a.icon : "🔒"}</div>
      <div><div class="ach-title">${a.title}</div><div class="ach-desc">${a.desc}</div></div>
    </div>`;
  }).join("");
}

function renderAll() {
  renderTop();
  renderDashboard();
  renderOrders();
  renderPrinters();
  renderShop();
  renderStats();
}

/* ---------------- Navigation ---------------- */
function switchPanel(name) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.getElementById("panel-" + name).classList.add("active");
  document.querySelectorAll(".navbtn").forEach(b => b.classList.toggle("active", b.dataset.panel === name));
}

document.querySelectorAll(".navbtn").forEach(btn => {
  btn.addEventListener("click", () => switchPanel(btn.dataset.panel));
});

/* ---------------- Event delegation ---------------- */
document.getElementById("daily-btn").addEventListener("click", claimDaily);
document.getElementById("buy-printer-btn").addEventListener("click", () => buyPrinterOfTier("tier1"));
document.getElementById("reset-btn").addEventListener("click", () => {
  if (confirm("Wirklich den kompletten Spielstand löschen? Das kann nicht rückgängig gemacht werden.")) {
    localStorage.removeItem(SAVE_KEY);
    state = freshState();
    renderAll();
    toast("Neustart! Viel Erfolg 🚀");
  }
});

document.getElementById("app").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn || btn.disabled) return;
  const action = btn.dataset.action;
  if (action === "collect") collectOrder(btn.dataset.id);
  else if (action === "upgrade") upgradePrinter(btn.dataset.id);
  else if (action === "accept") acceptOrder(btn.dataset.order, btn.dataset.printer);
  else if (action === "speed") buySpeedUpgrade();
  else if (action === "material") buyMaterialUpgrade();
  else if (action === "employee") hireEmployee();
  else if (action === "expand") expandWorkshop();
  else if (action === "unlock_tier2") unlockTier("tier2");
  else if (action === "unlock_tier3") unlockTier("tier3");
  else if (action.startsWith("buyprinter_")) buyPrinterOfTier(action.replace("buyprinter_", ""));
});

/* ---------------- Game loop ---------------- */
function tick() {
  refillOrders();
  renderTop();
  renderDashboard();
  // Aufträge-Panel nur neu rendern wenn sichtbar oder ein Drucker fertig wurde (leichtgewichtig genug für Interval)
  if (document.getElementById("panel-orders").classList.contains("active")) renderOrders();
  if (document.getElementById("panel-printers").classList.contains("active")) renderPrinters();
}

function init() {
  load();
  refillOrders();
  renderAll();
  setInterval(tick, TICK_MS);
  setInterval(save, AUTOSAVE_MS);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
  window.addEventListener("pagehide", save);
  window.addEventListener("beforeunload", save);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

init();
