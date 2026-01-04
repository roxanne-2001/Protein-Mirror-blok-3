
/**********************************************************
 * CONFIG
 **********************************************************/
const CSV_URL = "alle_producten_samengevoegd.csv";

/**********************************************************
 * HELPERS
 **********************************************************/
function clean(value) {
  if (!value) return "";
  return value.replace(/^"+|"+$/g, "").replace(/""/g, '"').trim();
}

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

//helper

function cleanProductName(rawName) {
  if (!rawName) return "Onbekend product";

  let name = rawName
    .replace(/"/g, "")          // alle quotes weg
    .replace(/\s*,\s*/g, " ")   // ALLE losse komma’s vervangen door spatie
    .replace(/\s+/g, " ")       // dubbele spaties opruimen
    .trim();

  // Extra veiligheid: prijs eruit slopen als die er toch in zit
  if (name.includes("€")) {
    name = name.split("€")[0].trim();
  }

  return name;
}

// helper om naam en prijs te extraheren uit rommelige naamvelden
function extractNameAndPrice(rawName) {
  if (!rawName) {
    return { name: "-", price: "" };
  }

  let cleaned = rawName.replace(/"/g, "").trim();

  // match €1,89 of €2.49 etc
  const priceMatch = cleaned.match(/€\s?\d+[.,]\d{2}/);

  let price = "";
  if (priceMatch) {
    price = priceMatch[0];
    cleaned = cleaned.replace(priceMatch[0], "");
  }

  // opschonen van rest-rotzooi
  cleaned = cleaned
    .replace(/,+$/g, "")
    .trim();

  return {
    name: cleaned,
    price,
  };
}

//helper voor het extraheren van numerieke waarden
function extractValue(value) {
  if (!value) return "-";
  const match = value.match(/([\d.,]+)/);
  return match ? match[1].replace(",", ".") : "-";
}

//helper voor het combineren van numerieke waarden met eenheid
function combineValue(tokens, unit) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      tokens[i].match(/^\d+(\.\d+)?$/) &&
      tokens[i + 1] === unit
    ) {
      return tokens[i] + " " + unit;
    }
  }

  return "-";
}

function extractWithRegex(row, regex) {
  const match = row.match(regex);
  return match ? match[1] : "-";
}

function extractGrams(row) {
  return [...row.matchAll(/(\d+(\.\d+)?)\s*g/g)].map(m => m[1]);
}

/**********************************************************
 * CSV PARSER (zelfde logica als zoekpagina)
 **********************************************************/
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];

    // split op komma’s buiten quotes
    const values =
      row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];

    // afbeelding zoeken (AH)
    const imageValue =
      values.find(
        (v) =>
          v.includes("static.ah.nl") &&
          v.includes("fileType=binary")
      ) || "";

      const grams = extractGrams(row);
      const protein = grams[0] || "-";
      const carbs   = grams[1] || "-";
      const fat     = grams[2] || "-";
      const kcal    = extractWithRegex(row, /(\d+(\.\d+)?)\s*kcal/);

    products.push({
        id: i,
      Naam: clean(values[0] || "")
        .replace(/,+$/, "")
        .replace(/"+$/, ""),
      Prijs: clean(values[1] || ""),
        Aanbieding: clean(values[2] || ""),
  "Eiwit per 100g": protein !== "-" ? protein + " g" : "-",
  "Koolhydraten per 100g": carbs !== "-" ? carbs + " g" : "-",
  "Vetten per 100g": fat !== "-" ? fat + " g" : "-",
  Calorieën: kcal !== "-" ? kcal + " kcal" : "-",
      Link: clean(values[7] || ""),
      Afbeelding: clean(imageValue),
    });
  }

  return products;
}

/**********************************************************
 * DATA LOAD
 **********************************************************/
async function loadProducts() {
  const response = await fetch(CSV_URL);
  if (!response.ok) throw new Error("CSV niet gevonden");
  const text = await response.text();
  return parseCSV(text);
}

/**********************************************************
 * RENDER PRODUCT
 **********************************************************/
function renderProduct(product) {
    console.table(product);
  const { name, price } = extractNameAndPrice(product.Naam);

  /* =========================
     TITELS
  ========================= */

  // Titel onder afbeelding
  document.getElementById("productName").textContent = name;

  // Header titel
  const headerTitle = document.querySelector("header span.font-bold");
  if (headerTitle) {
    headerTitle.textContent = name;
  }

  /* =========================
     PRIJS OVERLAY
  ========================= */

  const priceEl = document.getElementById("productPrice");
  if (priceEl) {
    if (price) {
      priceEl.textContent = price;
      priceEl.style.display = "block";
    } else {
      priceEl.style.display = "none";
    }
  }

  /* =========================
     AFBEELDING
  ========================= */

  const img = document.getElementById("productImage");
  const wrapper = document.getElementById("productImageWrapper");

  let image = product.Afbeelding || "";

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
      '<span class="text-xs text-slate-400">Geen afbeelding</span>';
  }

  /* =========================
     VOEDINGSWAARDES
  ========================= */

  document.getElementById("kcal").textContent =
    product["Calorieën"] || "-";
  document.getElementById("protein").textContent =
    product["Eiwit per 100g"] || "-";
  document.getElementById("carbs").textContent =
    product["Koolhydraten per 100g"] || "-";
  document.getElementById("fat").textContent =
    product["Vetten per 100g"] || "-";

  /* =========================
     WINKEL
  ========================= */

  document.getElementById("store").textContent =
    name.toLowerCase().includes("ah")
      ? "Albert Heijn"
      : "Onbekend";

  /* =========================
     CTA
  ========================= */

  if (product.Link) {
    document.getElementById("visitButton").onclick = () =>
      window.open(product.Link, "_blank");
  }
}

/**********************************************************
 * DROPDOWNS
 **********************************************************/
function toggleDropdown(i) {
  const content = document.getElementById(`nutrition-dropdown-${i}`);
  content.classList.toggle("open");
}

/**********************************************************
 * INIT (GEEN ILLEGAL RETURN!)
 **********************************************************/
window.addEventListener("DOMContentLoaded", async () => {
  // check of dit echt de product-detail pagina is
  if (!document.getElementById("productName")) return;

  try {
    const products = await loadProducts();
    const rawId = getProductId(); // string uit URL
const id = decodeURIComponent(rawId).toLowerCase();

    let product =
      products.find(
        (p) =>
          encodeURIComponent(p.Naam) === id ||
          p.Naam === decodeURIComponent(id)
      ) || products[0];

    if (!product) {
      alert("Product niet gevonden");
      return;
    }

    renderProduct(product);
  } catch (err) {
    console.error(err);
    alert("Fout bij laden van product");
  }
});