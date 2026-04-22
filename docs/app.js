// MBTI Bingo – Card Viewer (tile picker + selectable behaviours)
// - 2×4 card picker tiles
// - 4×4 behaviour grid (16 squares)
// - Click squares to select (strong outline)
// - Selected counter
// - No FREE square
// - Saves selections per card via localStorage

const titleEl = document.getElementById("cardTitle");
const descEl = document.getElementById("cardDesc");
const gridEl = document.getElementById("grid");
const pickerEl = document.getElementById("cardPicker");
const printBtn = document.getElementById("printBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const selectedCountEl = document.getElementById("selectedCount");

let CARDS = [];
const GRID_SIZE = 16;

function byId(id) {
  return CARDS.find((c) => c.id === id);
}

function getHashCardId() {
  const hash = (window.location.hash || "").replace("#", "").trim();
  if (!hash) return null;
  return CARDS.some((c) => c.id === hash) ? hash : null;
}

function setHashCardId(id) {
  window.location.hash = id;
}

function setActiveTile(id) {
  const tiles = pickerEl.querySelectorAll(".cardTile");
  tiles.forEach((t) => t.classList.toggle("active", t.dataset.id === id));
}

/** localStorage helpers **/
function storageKey(cardId) {
  return `mbti_selected_${cardId}`;
}

function loadSelected(cardId) {
  try {
    const raw = localStorage.getItem(storageKey(cardId));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.filter(n => Number.isInteger(n) && n >= 0 && n < GRID_SIZE)
      : [];
  } catch {
    return [];
  }
}

function saveSelected(cardId, selectedIndices) {
  localStorage.setItem(storageKey(cardId), JSON.stringify(selectedIndices));
}

function updateSelectedCount(selectedIndices) {
  selectedCountEl.textContent = `Selected: ${selectedIndices.length} / ${GRID_SIZE}`;
}

function buildTilePicker() {
  pickerEl.innerHTML = "";

  CARDS.forEach((card) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cardTile";
    btn.dataset.id = card.id;
    btn.setAttribute("role", "listitem");

    const top = document.createElement("div");
    top.className = "tileTop";

    const label = document.createElement("div");
    label.className = "tileLabel";
    label.textContent = card.label;

    const idBadge = document.createElement("div");
    idBadge.className = "tileId";
    idBadge.textContent = card.id;

    top.appendChild(label);
    top.appendChild(idBadge);

    const desc = document.createElement("div");
    desc.className = "tileDesc";
    desc.textContent = card.description || "";

    btn.appendChild(top);
    btn.appendChild(desc);

    btn.addEventListener("click", () => {
      setHashCardId(card.id);
      renderCard(card);
      setActiveTile(card.id);
    });

    pickerEl.appendChild(btn);
  });
}

function renderCard(card) {
  titleEl.textContent = card.label;
  descEl.textContent = card.description || "";

  const squaresAll = Array.isArray(card.squares) ? card.squares : [];
  const squares = squaresAll.slice(0, GRID_SIZE); // first 16

  let selected = loadSelected(card.id);
  updateSelectedCount(selected);

  gridEl.innerHTML = "";

  squares.forEach((sq, idx) => {
    const div = document.createElement("div");
    div.className = "square";
    if (selected.includes(idx)) div.classList.add("selected");

    const header = document.createElement("div");
    header.className = "squareHeader";

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = `#${idx + 1}`;

    header.appendChild(badge);

    const text = document.createElement("div");
    text.className = "text";
    text.textContent = sq.text || "";

    div.appendChild(header);
    div.appendChild(text);

    if (sq.try && sq.try.trim().length) {
      const tryEl = document.createElement("div");
      tryEl.className = "try";
      tryEl.textContent = sq.try;
      div.appendChild(tryEl);
    }

    div.addEventListener("click", () => {
      if (selected.includes(idx)) {
        selected = selected.filter(n => n !== idx);
        div.classList.remove("selected");
      } else {
        selected = [...selected, idx];
        div.classList.add("selected");
      }
      saveSelected(card.id, selected);
      updateSelectedCount(selected);
    });

    gridEl.appendChild(div);
  });
}

async function init() {
  const res = await fetch("./data/cards.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load cards.json: ${res.status}`);
  const data = await res.json();

  CARDS = data.cards || [];
  if (!CARDS.length) throw new Error("cards.json contains no cards[]");

  buildTilePicker();

  const startId = getHashCardId() || CARDS[0].id;
  renderCard(byId(startId));
  setActiveTile(startId);
  if (!getHashCardId()) setHashCardId(startId);

  window.addEventListener("hashchange", () => {
    const id = getHashCardId();
    if (id) {
      renderCard(byId(id));
      setActiveTile(id);
    }
  });

  printBtn.addEventListener("click", () => window.print());

  copyLinkBtn.addEventListener("click", async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      copyLinkBtn.textContent = "Copied!";
      setTimeout(() => (copyLinkBtn.textContent = "Copy link"), 1200);
    } catch {
      window.prompt("Copy this link:", url);
    }
  });
}

init().catch((err) => {
  console.error(err);
  titleEl.textContent = "Could not load site data";
  descEl.textContent = "Check that docs/data/cards.json exists and GitHub Pages is publishing from /docs.";
});
``
