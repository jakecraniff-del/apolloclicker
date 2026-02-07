const STORAGE_KEY = "apollo-clicker-save-v1";

const upgrades = [
  { id: "claw", name: "Talon Training", description: "+1 seed/click", baseCost: 25, spc: 1, sps: 0 },
  { id: "perch", name: "Perch Assistant", description: "+0.4 seeds/sec", baseCost: 20, spc: 0, sps: 0.4 },
  { id: "feeder", name: "Seed Feeder", description: "+2.5 seeds/sec", baseCost: 120, spc: 0, sps: 2.5 },
  { id: "flock", name: "Flock Trainer", description: "+12 seeds/sec", baseCost: 850, spc: 0, sps: 12 }
];

const state = {
  seeds: 0,
  lifetimeSeeds: 0,
  seedsPerClick: 1,
  seedsPerSecond: 0,
  owned: Object.fromEntries(upgrades.map((u) => [u.id, 0]))
};

const seedsEl = document.getElementById("seeds");
const spcEl = document.getElementById("spc");
const spsEl = document.getElementById("sps");
const shopEl = document.getElementById("shop");
const template = document.getElementById("upgrade-template");
const apolloBtn = document.getElementById("apollo-button");
const resetBtn = document.getElementById("reset");

function format(value) {
  if (value < 1000) return value.toFixed(value < 10 && value % 1 ? 1 : 0);
  const units = ["K", "M", "B", "T"];
  let v = value;
  let i = -1;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v.toFixed(1)}${units[i]}`;
}

function getCost(upgrade) {
  const owned = state.owned[upgrade.id];
  return Math.floor(upgrade.baseCost * Math.pow(1.15, owned));
}

function recalcRates() {
  state.seedsPerClick = 1;
  state.seedsPerSecond = 0;
  upgrades.forEach((u) => {
    const count = state.owned[u.id];
    state.seedsPerClick += count * u.spc;
    state.seedsPerSecond += count * u.sps;
  });
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.seeds = Number(parsed.seeds) || 0;
    state.lifetimeSeeds = Number(parsed.lifetimeSeeds) || 0;
    upgrades.forEach((u) => {
      state.owned[u.id] = Number(parsed.owned?.[u.id]) || 0;
    });
    recalcRates();
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function render() {
  seedsEl.textContent = format(state.seeds);
  spcEl.textContent = format(state.seedsPerClick);
  spsEl.textContent = format(state.seedsPerSecond);

  upgrades.forEach((u) => {
    const card = document.getElementById(`upgrade-${u.id}`);
    const cost = getCost(u);
    card.querySelector(".owned").textContent = state.owned[u.id];
    card.querySelector(".cost").textContent = format(cost);
    card.disabled = state.seeds < cost;
  });
}

function buildShop() {
  upgrades.forEach((upgrade) => {
    const node = template.content.cloneNode(true);
    const button = node.querySelector(".upgrade");
    button.id = `upgrade-${upgrade.id}`;
    button.querySelector(".name").textContent = upgrade.name;
    button.querySelector(".description").textContent = upgrade.description;

    button.addEventListener("click", () => {
      const cost = getCost(upgrade);
      if (state.seeds < cost) return;
      state.seeds -= cost;
      state.owned[upgrade.id] += 1;
      recalcRates();
      render();
      save();
    });

    shopEl.appendChild(node);
  });
}

function clickApollo() {
  state.seeds += state.seedsPerClick;
  state.lifetimeSeeds += state.seedsPerClick;
  apolloBtn.classList.add("popping");
  setTimeout(() => apolloBtn.classList.remove("popping"), 80);
  render();
}

apolloBtn.addEventListener("click", clickApollo);
resetBtn.addEventListener("click", () => {
  if (!confirm("Reset all Apollo Clicker progress?")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

buildShop();
load();
render();

setInterval(() => {
  const gain = state.seedsPerSecond / 10;
  state.seeds += gain;
  state.lifetimeSeeds += gain;
  render();
}, 100);

setInterval(save, 5000);
window.addEventListener("beforeunload", save);
