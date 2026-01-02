console.log('=== APP.JS LOADED - VERSION 7.0 - FIXED ===');

let allProducts = [];
let proteinProducts = [];
let normalProducts = [];

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        if (line.startsWith('"')) {
            const endQuoteIndex = line.lastIndexOf('"');
            if (endQuoteIndex > 0) {
                line = line.substring(1, endQuoteIndex);
            }
        }
        
        const values = [];
        let current = '';
        let inQuotes = false;
        let prevChar = '';
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"' && prevChar === '"') {
                current += char;
                prevChar = '';
                continue;
            } else if (char === '"') {
                inQuotes = !inQuotes;
                prevChar = char;
                continue;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
                prevChar = char;
                continue;
            }
            
            current += char;
            prevChar = char;
        }
        
        values.push(current.trim());
        
        if (values.length >= 7) {
            products.push({
                'Naam': values[0] || '',
                'Prijs': values[1] || '',
                'Aanbieding': values[2] || '-',
                'Eiwit per 100g': values[3] || '',
                'Koolhydraten per 100g': values[4] || '',
                'Vetten per 100g': values[5] || '',
                'Calorieën': values[6] || '',
                'Link': values[7] || '',
                'Afbeelding': values[8] || ''
            });
        }
    }

    return products;
}

function getProteinValue(proteinString) {
    // Extract numeric value from "10.0 g" or "10 g"
    const match = proteinString.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
}

function getProductImageUrl(product) {
    // First, try to use the Afbeelding field if it exists
    if (product.Afbeelding && product.Afbeelding.trim()) {
        let image = product.Afbeelding.replace(/^"+|"+$/g, "").trim(); // Remove quotes
        
        // Clean up the URL
        const marker = "fileType=binary";
        if (image.includes(marker)) {
            image = image.substring(0, image.indexOf(marker) + marker.length);
        }
        
        return image;
    }
    
    // Fallback: Extract product ID from AH link and create image URL
    const productLink = product.Link;
    if (!productLink) return '';
    
    const match = productLink.match(/product\/(wi\d+)/);
    if (match && match[1]) {
        const productId = match[1];
        return `https://static.ah.nl/image-optimization/static/product/${productId}_40x40_JPG.JPG?quality=90&width=300`;
    }
    
    return '';
}

async function loadCSVData() {
    console.log('🔄 Laden CSV...');
    
    try {
        const response = await fetch('alle_producten_samengevoegd.csv');
        
        if (!response.ok) {
            throw new Error('CSV niet gevonden');
        }
        
        console.log('✓ CSV geladen');
        const csvText = await response.text();
        console.log(`✓ CSV grootte: ${csvText.length} characters`);
        
        allProducts = parseCSV(csvText);
        console.log(`✓ Geparsed: ${allProducts.length} producten`);
        
        if (allProducts.length === 0) {
            alert('ERROR: Geen producten gevonden!');
            return;
        }
        
        console.log('Eerste product:', allProducts[0]);
        
        proteinProducts = allProducts.filter(p => {
            const protein = getProteinValue(p['Eiwit per 100g']);
            return protein >= 8;
        });
        
        normalProducts = allProducts.filter(p => {
            const protein = getProteinValue(p['Eiwit per 100g']);
            return protein < 8 && protein > 0;
        });
        
        console.log(`✓ Proteïne producten: ${proteinProducts.length}`);
        console.log(`✓ Normale producten: ${normalProducts.length}`);
        
        const sel1 = document.getElementById('protein-select');
        const sel2 = document.getElementById('normal-select');
        
        if (!sel1 || !sel2) {
            console.error('❌ Dropdowns niet gevonden!');
            alert('ERROR: Dropdowns niet gevonden!');
            return;
        }
        
        console.log('✓ Dropdowns gevonden, producten toevoegen...');
        
        proteinProducts.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            const productName = p.Naam || 'Onbekend';
            opt.textContent = productName.length > 60 ? productName.substring(0, 60) + '...' : productName;
            sel1.appendChild(opt);
        });
        
        normalProducts.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            const productName = p.Naam || 'Onbekend';
            opt.textContent = productName.length > 60 ? productName.substring(0, 60) + '...' : productName;
            sel2.appendChild(opt);
        });
        
        console.log(`✓ KLAAR! ${proteinProducts.length} proteïne + ${normalProducts.length} normale producten toegevoegd`);
        
    } catch (e) {
        console.error('❌ ERROR:', e);
        alert('ERROR: ' + e.message);
    }
}

function getProductImageUrl(product) {
    // First, try to use the Afbeelding field if it exists
    if (product.Afbeelding && product.Afbeelding.trim()) {
        let image = product.Afbeelding.replace(/^"+|"+$/g, "").trim(); // Remove quotes
        
        // Clean up the URL
        const marker = "fileType=binary";
        if (image.includes(marker)) {
            image = image.substring(0, image.indexOf(marker) + marker.length);
        }
        
        return image;
    }
    
    // Fallback: Extract product ID from AH link and create image URL
    const productLink = product.Link;
    if (!productLink) return '';
    
    const match = productLink.match(/product\/(wi\d+)/);
    if (match && match[1]) {
        const productId = match[1];
        return `https://static.ah.nl/image-optimization/static/product/${productId}_40x40_JPG.JPG?quality=90&width=300`;
    }
    
    return '';
}

function compareProducts() {
    const i1 = document.getElementById('protein-select').value;
    const i2 = document.getElementById('normal-select').value;
    
    if (!i1 || !i2) return;
    
    const p1 = proteinProducts[i1];
    const p2 = normalProducts[i2];
    
    console.log('Comparing products:', p1, p2);
    
    document.getElementById('comparison-container').classList.remove('hidden');
    document.getElementById('links-section').classList.remove('hidden');
    
    // Set product data
    document.getElementById('protein-name').textContent = p1.Naam || '-';
    document.getElementById('protein-price').textContent = p1.Prijs || '-';
    document.getElementById('protein-eiwit').textContent = p1['Eiwit per 100g'] || '-';
    document.getElementById('protein-calories').textContent = p1['Calorieën'] || '-';
    document.getElementById('protein-vetten').textContent = p1['Vetten per 100g'] || '-';
    document.getElementById('protein-koolhydraten').textContent = p1['Koolhydraten per 100g'] || '-';
    
    document.getElementById('normal-name').textContent = p2.Naam || '-';
    document.getElementById('normal-price').textContent = p2.Prijs || '-';
    document.getElementById('normal-eiwit').textContent = p2['Eiwit per 100g'] || '-';
    document.getElementById('normal-calories').textContent = p2['Calorieën'] || '-';
    document.getElementById('normal-vetten').textContent = p2['Vetten per 100g'] || '-';
    document.getElementById('normal-koolhydraten').textContent = p2['Koolhydraten per 100g'] || '-';
    
    // Set product images
    const p1ImageUrl = getProductImageUrl(p1);
    const p2ImageUrl = getProductImageUrl(p2);
    
    console.log('Product 1 image URL:', p1ImageUrl);
    console.log('Product 2 image URL:', p2ImageUrl);
    
    const proteinImageEl = document.getElementById('protein-image');
    const normalImageEl = document.getElementById('normal-image');
    
    if (p1ImageUrl) {
        proteinImageEl.style.backgroundImage = `url('${p1ImageUrl}')`;
        proteinImageEl.style.backgroundSize = 'cover';
        proteinImageEl.style.backgroundPosition = 'center';
    } else {
        proteinImageEl.style.backgroundImage = '';
        proteinImageEl.style.backgroundColor = '#e2e8f0';
    }
    
    if (p2ImageUrl) {
        normalImageEl.style.backgroundImage = `url('${p2ImageUrl}')`;
        normalImageEl.style.backgroundSize = 'cover';
        normalImageEl.style.backgroundPosition = 'center';
    } else {
        normalImageEl.style.backgroundImage = '';
        normalImageEl.style.backgroundColor = '#e2e8f0';
    }
    
    // Set product links
    document.getElementById('protein-link').href = p1.Link || '#';
    document.getElementById('normal-link').href = p2.Link || '#';
}
}

function clearComparison() {
    document.getElementById('protein-select').value = '';
    document.getElementById('normal-select').value = '';
    document.getElementById('comparison-container').classList.add('hidden');
    document.getElementById('links-section').classList.add('hidden');
}

function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const proteinSelect = document.getElementById('protein-select');
    const normalSelect = document.getElementById('normal-select');
    
    // Filter protein products
    const proteinOptions = proteinSelect.querySelectorAll('option:not(:first-child)');
    proteinOptions.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(searchTerm) ? '' : 'none';
    });
    
    // Filter normal products
    const normalOptions = normalSelect.querySelectorAll('option:not(:first-child)');
    normalOptions.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM ready - starting initialization');
    alert('DOM ready! App.js wordt geladen...');
    
    const proteinSelect = document.getElementById('protein-select');
    const normalSelect = document.getElementById('normal-select');
    const searchInput = document.getElementById('search-input');
    
    console.log('Found elements:');
    console.log('  protein-select:', proteinSelect);
    console.log('  normal-select:', normalSelect);
    console.log('  search-input:', searchInput);
    
    if (!proteinSelect || !normalSelect) {
        console.error('❌ CRITICAL: Select elements not found!');
        alert('ERROR: Dropdowns niet gevonden in DOM!');
        return;
    }
    
    alert('Dropdowns gevonden! Nu CSV laden...');
    
    console.log('Adding event listeners...');
    proteinSelect.addEventListener('change', compareProducts);
    normalSelect.addEventListener('change', compareProducts);
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    console.log('✅ Event listeners added');
    
    console.log('Starting CSV load...');
    loadCSVData();
});
