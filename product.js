// Juiste CSV-bestand pad
const CSV_URL = "ah_normale_producten(in).csv";

// Sample product data (fallback)
const defaultProduct = {
    "Naam": "Jumbo High Protein Kwark Vanille Smaak 200 g",
    "Prijs": "€0.99",
    "parsed_price_eur": "0.99",
    "Eiwit per 100g": "10.1g",
    "Koolhydraten per 100g": "-",
    "Vetten per 100g": "-",
    "Calorieën": "82kcal",
    "Link": "https://www.jumbo.com",
    "package_weight_g": "200",
    "total_protein_g_per_package": "20.2",
    "MAS_score": "1.0",
    "PQI_estimate": "0.901",
    "PPG_eur_per_protein_g": "0.0490"
};

// 1. CSV inladen
async function loadCSV() {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error("CSV not found");
        const text = await response.text();
        return parseCSV(text);
    } catch (e) {
        console.warn("Could not load CSV, using default product");
        return [defaultProduct];
    }
}

// 2. CSV parser
function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let current = "";
        let inQuotes = false;

        for (let char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
                values.push(current);
                current = "";
            } else {
                current += char;
            }
        }

        values.push(current);

        const obj = {};
        headers.forEach((h, idx) => obj[h] = values[idx] || "");
        products.push(obj);
    }

    return products;
}

// 3. ID uit URL halen
function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

// 4. Labels & interpretaties
function interpretScores(product) {
    const mas = parseFloat(product["MAS_score"]);
    document.getElementById("masLabel").textContent =
        mas >= 1 ? "JA" :
        mas >= 0.5 ? "Gedeeltelijk" :
        "NEE";

    const pqi = parseFloat(product["PQI_estimate"]);
    document.getElementById("pqiLabel").textContent =
        pqi >= 0.8 ? "Hoog" :
        pqi >= 0.5 ? "Gemiddeld" :
        "Laag";

    const ppg = parseFloat(product["PPG_eur_per_protein_g"]);
    document.getElementById("ppgValue").textContent = "€" + ppg.toFixed(3) + "/g";

    document.getElementById("ppgLabel").textContent =
        ppg < 0.06 ? "Goedkoop" :
        ppg < 0.09 ? "Gemiddeld" :
        "Duur";
}

// 5. Winkel detecteren
function detectStore(name) {
    const n = name.toLowerCase();
    if (n.includes("jumbo")) return "Jumbo";
    if (n.includes("ah")) return "Albert Heijn";
    return "Onbekend";
}

// 6. HTML vullen
function renderProduct(product) {
    document.getElementById("productName").textContent = product.Naam;
    document.getElementById("productPrice").textContent = product.Prijs || ("€" + product.parsed_price_eur);

    document.getElementById("kcal").textContent = product["Calorieën"] || "-";
    document.getElementById("protein").textContent = product["Eiwit per 100g"] || "-";
    document.getElementById("carbs").textContent = product["Koolhydraten per 100g"] || "-";
    document.getElementById("fat").textContent = product["Vetten per 100g"] || "-";

    document.getElementById("weight").textContent = product["package_weight_g"] + "g";
    document.getElementById("totalProtein").textContent = product["total_protein_g_per_package"] + "g";

    document.getElementById("store").textContent = detectStore(product.Naam);

    // Store link
    document.getElementById("visitButton").onclick = () =>
        window.open(product.Link, "_blank");

    interpretScores(product);
}

// 7. Dropdown toggles
function toggleDropdown(i) {
    const button = document.querySelectorAll(".dropdown-toggle")[i];
    const content = document.getElementById(`nutrition-dropdown-${i}`);
    button.classList.toggle("open");
    content.classList.toggle("open");
}

// 8. Startpagina
window.addEventListener("DOMContentLoaded", async () => {
    const id = getProductId();
    let products = await loadCSV();

    // Fallback if no products loaded
    if (!products || products.length === 0) {
        products = [defaultProduct];
    }

    let product;
    if (id) {
        // If ID provided in URL, find matching product
        product = products.find(p => p.Naam === decodeURIComponent(id));
    }
    
    // If no product found or no ID, use first product or default
    if (!product) {
        product = products.length > 0 ? products[0] : defaultProduct;
    }

    if (!product || !product.Naam) {
        alert("Product kon niet geladen worden.");
        return;
    }

    renderProduct(product);
});
