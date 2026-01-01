/* =========================
   CHECK: DETAILPAGINA
========================= */
const isDetailPage = document.getElementById("productName") !== null;
if (!isDetailPage) return;

/* =========================
   CONFIG
========================= */
const CSV_URL = "ah_normale_producten(in).csv";

/* =========================
   FALLBACK PRODUCT
========================= */
const defaultProduct = {
  Naam: "Onbekend product",
  Prijs: "-",
  "Eiwit per 100g": "-",
  "Koolhydraten per 100g": "-",
  "Vetten per 100g": "-",
  Calorieën: "-",
  Link: "",
  Afbeelding: "",
  MAS_score: "0",
  PQI_estimate: "0",
  PPG_eur_per_protein_g: "0"
};

/* =========================
   CSV LADEN
========================= */
async function loadCSV() {
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error("CSV niet gevonden");
    const text = await res.text();
    return parseCSV(text);
  } catch (e) {
    console.warn("CSV laden mislukt, fallback gebruikt");
    return [defaultProduct];
  }
}

/* =========================
   CSV PARSER (zelfde als zoekpagina)
========================= */
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const products = [];

  const clean = (v) =>
    v?.replace(/^"+|"+$/g, "").replace(/""/g, '"').trim() || "";

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const values =
      row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];

    const imageValue =
      values.find(
        (v) =>
          v.includes("static.ah.nl") &&
          v.includes("fileType=binary")
      ) || "";

    products.push({
      Naam: clean(values[0]),
      Prijs: clean(values[1]),
      "Eiwit per 100g": clean(values[3]),
      "Koolhydraten per 100g": clean(values[4]),
      "Vetten per 100g": clean(values[5]),
      Calorieën: clean(values[6]),
      Link: clean(values[7]),
      Afbeelding: clean(imageValue),
      MAS_score: clean(values[8]),
      PQI_estimate: clean(values[9]),
      PPG_eur_per_protein_g: clean(values[10])
    });
  }

  return products;
}

/* =========================
   URL ID
========================= */
function getProductId() {
  return new URLSearchParams(window.location.search).get("id");
}

/* =========================
   SCORES
========================= */
function interpretScores(product) {
  const mas = parseFloat(product.MAS_score);
  document.getElementById("masLabel").textContent =
    mas >= 1 ? "JA" : mas >= 0.5 ? "Gedeeltelijk" : "NEE";

  const pqi = parseFloat(product.PQI_estimate);
  document.getElementById("pqiLabel").textContent =
    pqi >= 0.8 ? "Hoog" : pqi >= 0.5 ? "Gemiddeld" : "Laag";

  const ppg = parseFloat(product.PPG_eur_per_protein_g);
  document.getElementById("ppgValue").textContent =
    isNaN(ppg) ? "-" : "€" + ppg.toFixed(3) + "/g";

  document.getElementById("ppgLabel").textContent =
    ppg < 0.06 ? "Goedkoop" : ppg < 0.09 ? "Gemiddeld" : "Duur";
}

/* =========================
   RENDER PRODUCT
========================= */
function renderProduct(product) {
  const clean = (v) => (v ? v.replace(/"/g, "").trim() : "-");

  /* NAAM */
  document.getElementById("productName").textContent =
    clean(product.Naam);

  /* PRIJS — ENIGE KEER */
  const priceEl = document.getElementById("productPrice");
  priceEl.textContent = clean(product.Prijs) || "-";

  /* AFBEELDING */
  const img = document.getElementById("productImage");
  const wrapper = document.getElementById("productImageWrapper");

  let image = product.Afbeelding;
  if (image.includes("fileType=binary")) {
    image = image.substring(
      0,
      image.indexOf("fileType=binary") + "fileType=binary".length
    );
  }

  if (image) {
    img.src = image;
    img.style.display = "block";
  } else {
    img.style.display = "none";
    wrapper.innerHTML =
      `<span class="text-xs text-slate-400">Geen afbeelding</span>`;
  }

  /* VOEDING */
  document.getElementById("kcal").textContent = clean(product.Calorieën);
  document.getElementById("protein").textContent = clean(product["Eiwit per 100g"]);
  document.getElementById("carbs").textContent = clean(product["Koolhydraten per 100g"]);
  document.getElementById("fat").textContent = clean(product["Vetten per 100g"]);

  /* SCORES */
  interpretScores(product);

  /* LINK */
  const btn = document.getElementById("visitButton");
  if (btn && product.Link) {
    btn.onclick = () => window.open(product.Link, "_blank");
  }
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", async () => {
  const id = decodeURIComponent(getProductId() || "");
  const products = await loadCSV();

  const product =
    products.find(
      (p) => p.Naam.toLowerCase() === id.toLowerCase()
    ) || products[0] || defaultProduct;

  renderProduct(product);
});

/* =========================
   DROPDOWNS
========================= */
function toggleDropdown(i) {
  const buttons = document.querySelectorAll(".dropdown-toggle");
  const content = document.getElementById(`nutrition-dropdown-${i}`);
  buttons[i].classList.toggle("open");
  content.classList.toggle("open");
}
